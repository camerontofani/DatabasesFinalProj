import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddForm.css';

export default function AddTeaches() {
  const navigate = useNavigate();
  
  // Form fields
  const [instructorId, setInstructorId] = useState('');
  const [section, setSection] = useState(''); // "course_no|section_no|term|year"
  
  // Dropdown data
  const [instructors, setInstructors] = useState([]);
  const [sections, setSections] = useState([]);
  const [assignedSections, setAssignedSections] = useState([]); // Sections that already have instructors
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch instructors, sections, and existing teaches data
  useEffect(() => {
    async function fetchData() {
      setLoadingData(true);
      try {
        const [instructorsRes, sectionsRes, teachesRes] = await Promise.all([
          fetch('http://localhost:4000/api/instructors'),
          fetch('http://localhost:4000/api/sections'),
          fetch('http://localhost:4000/api/teaches')
        ]);
        
        const instructorsData = await instructorsRes.json();
        const sectionsData = await sectionsRes.json();
        const teachesData = await teachesRes.json();
        
        setInstructors(instructorsData);
        setSections(sectionsData);
        
        // Track which sections already have an instructor assigned
        // Per constraints: one instructor per section
        const assigned = teachesData.map(t => 
          `${t.course_no}|${t.section_no}|${t.term}|${t.year}`
        );
        setAssignedSections(assigned);
        
      } catch (err) {
        console.error(err);
        setError('Could not load data. Please make sure the backend is running.');
      }
      setLoadingData(false);
    }
    fetchData();
  }, []);

  // Check if selected section already has an instructor
  const sectionAlreadyAssigned = section && assignedSections.includes(section);

  // Get available sections (not yet assigned)
  const availableSections = sections.filter(sec => {
    const key = `${sec.course_no}|${sec.section_no}|${sec.term}|${sec.year}`;
    return !assignedSections.includes(key);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!instructorId) {
      setError('Please select an instructor.');
      return;
    }

    if (!section) {
      setError('Please select a section.');
      return;
    }

    // Double-check section isn't already assigned
    if (sectionAlreadyAssigned) {
      setError('This section already has an instructor assigned.');
      return;
    }

    setLoading(true);

    try {
      const [course_no, section_no, term, year] = section.split('|');

      const response = await fetch('http://localhost:4000/api/teaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructor_id: parseInt(instructorId, 10),
          course_no,
          section_no,
          term,
          year: parseInt(year, 10)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to assign instructor. Please try again.');
        return;
      }

      // Get instructor name for success message
      const instructor = instructors.find(i => i.instructor_id === parseInt(instructorId, 10));
      
      setSuccess(`Successfully assigned ${instructor?.instructor_name} to ${course_no} Section ${section_no} (${term} ${year})`);
      
      // Add to assigned sections list
      setAssignedSections(prev => [...prev, section]);
      
      // Reset form
      setInstructorId('');
      setSection('');

    } catch (err) {
      console.error(err);
      setError('Could not connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <Link to="/add" className="back-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Add Data
      </Link>

      <div className="form-header">
        <h1>Assign Instructor to Section</h1>
        <p className="subtitle">Link an instructor to a course section they teach</p>
      </div>

      {loadingData ? (
        <div className="data-form" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading instructors and sections...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="data-form">
          {error && (
            <div className="message error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="message success-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {success}
            </div>
          )}

          {/* Warnings for missing data */}
          {instructors.length === 0 && (
            <div className="message error-message">
              No instructors found. Please <Link to="/add/instructor">add an instructor</Link> first.
            </div>
          )}

          {sections.length === 0 && (
            <div className="message error-message">
              No sections found. Please <Link to="/add/section">add a section</Link> first.
            </div>
          )}

          {availableSections.length === 0 && sections.length > 0 && (
            <div className="message error-message" style={{ background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' }}>
              All existing sections already have instructors assigned. <Link to="/add/section">Add a new section</Link> first.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="teaches-instructor">
              Instructor <span className="required">*</span>
            </label>
            <select
              id="teaches-instructor"
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              disabled={loading || instructors.length === 0}
            >
              <option value="">-- Select Instructor --</option>
              {instructors.map((inst) => (
                <option key={inst.instructor_id} value={inst.instructor_id}>
                  {inst.instructor_name} (ID: {inst.instructor_id})
                </option>
              ))}
            </select>
            <span className="help-text">Who is teaching this section?</span>
          </div>

          <div className="form-group">
            <label htmlFor="teaches-section">
              Section <span className="required">*</span>
            </label>
            <select
              id="teaches-section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={loading || availableSections.length === 0}
            >
              <option value="">-- Select Section --</option>
              {availableSections.map((sec) => {
                const key = `${sec.course_no}|${sec.section_no}|${sec.term}|${sec.year}`;
                return (
                  <option key={key} value={key}>
                    {sec.course_no} - Section {sec.section_no} - {sec.term} {sec.year} ({sec.student_count} students)
                  </option>
                );
              })}
            </select>
            <span className="help-text">
              Only sections without an assigned instructor are shown.
              {assignedSections.length > 0 && (
                <span style={{ display: 'block', marginTop: '0.25rem', color: '#059669' }}>
                  {assignedSections.length} section(s) already have instructors assigned.
                </span>
              )}
            </span>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || instructors.length === 0 || availableSections.length === 0}
            >
              {loading ? 'Assigning...' : 'Assign Instructor'}
            </button>
            <button 
              type="button" 
              className="secondary-btn"
              onClick={() => navigate('/add')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


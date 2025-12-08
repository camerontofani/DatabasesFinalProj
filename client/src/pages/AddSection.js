import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddForm.css';

export default function AddSection() {
  const navigate = useNavigate();
  
  // Form fields
  const [courseNo, setCourseNo] = useState('');
  const [semester, setSemester] = useState(''); // Will store "term|year" combined
  const [sectionNo, setSectionNo] = useState('');
  const [studentCount, setStudentCount] = useState('');
  
  // Dropdown data
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch courses and semesters on mount
  useEffect(() => {
    async function fetchDropdownData() {
      setLoadingData(true);
      try {
        const [coursesRes, semestersRes] = await Promise.all([
          fetch('http://localhost:4000/api/courses'),
          fetch('http://localhost:4000/api/semesters')
        ]);
        
        const coursesData = await coursesRes.json();
        const semestersData = await semestersRes.json();
        
        setCourses(coursesData);
        setSemesters(semestersData);
      } catch (err) {
        console.error(err);
        setError('Could not load courses and semesters. Please make sure the backend is running.');
      }
      setLoadingData(false);
    }
    
    fetchDropdownData();
  }, []);

  // Normalize section number to 3 digits (e.g., "1" -> "001")
  const normalizeSectionNo = (str) => {
    const cleaned = str.replace(/[^0-9]/g, ''); // Only digits
    if (!cleaned) return '';
    const num = parseInt(cleaned, 10);
    return num.toString().padStart(3, '0'); // Pad to 3 digits
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!courseNo) {
      setError('Please select a course.');
      return;
    }

    if (!semester) {
      setError('Please select a semester.');
      return;
    }

    if (!sectionNo.trim()) {
      setError('Section number is required.');
      return;
    }

    // Check for negative numbers
    if (sectionNo.trim().startsWith('-') || parseInt(sectionNo, 10) < 0) {
      setError('Section number cannot be negative.');
      return;
    }

    const normalizedSectionNo = normalizeSectionNo(sectionNo);
    if (!normalizedSectionNo || normalizedSectionNo === '000') {
      setError('Section number must be a positive number (e.g., 1, 01, 001).');
      return;
    }

    if (!studentCount) {
      setError('Student count is required.');
      return;
    }

    const studentCountNum = parseInt(studentCount, 10);
    if (isNaN(studentCountNum) || studentCountNum < 1) {
      setError('Student count must be at least 1.');
      return;
    }

    if (studentCountNum > 500) {
      setError('Student count seems too high. Maximum is 500.');
      return;
    }

    // Parse semester (stored as "term|year")
    const [term, year] = semester.split('|');

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_no: courseNo,
          section_no: normalizedSectionNo,
          term: term,
          year: parseInt(year, 10),
          student_count: studentCountNum,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add section. Please try again.');
        return;
      }

      // Success!
      setSuccess(`Successfully added: ${courseNo} Section ${normalizedSectionNo} (${term} ${year}) - ${studentCountNum} students`);
      setCourseNo('');
      setSemester('');
      setSectionNo('');
      setStudentCount('');

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
        <h1>Add Section</h1>
        <p className="subtitle">Create a new course section for a semester</p>
      </div>

      {loadingData ? (
        <div className="data-form" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading courses and semesters...</p>
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

          {/* Warning if no courses or semesters */}
          {courses.length === 0 && (
            <div className="message error-message">
              No courses found. Please <Link to="/add/course">add a course</Link> first.
            </div>
          )}

          {semesters.length === 0 && (
            <div className="message error-message">
              No semesters found. Please <Link to="/add/semester">add a semester</Link> first.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="section-course">
              Course <span className="required">*</span>
            </label>
            <select
              id="section-course"
              value={courseNo}
              onChange={(e) => setCourseNo(e.target.value)}
              disabled={loading || courses.length === 0}
            >
              <option value="">-- Select Course --</option>
              {courses.map((course) => (
                <option key={course.course_no} value={course.course_no}>
                  {course.course_no} - {course.course_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="section-semester">
              Semester <span className="required">*</span>
            </label>
            <select
              id="section-semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              disabled={loading || semesters.length === 0}
            >
              <option value="">-- Select Semester --</option>
              {semesters.map((sem) => (
                <option key={`${sem.term}|${sem.year}`} value={`${sem.term}|${sem.year}`}>
                  {sem.term} {sem.year}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="section-no">
              Section Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="section-no"
              value={sectionNo}
              onChange={(e) => setSectionNo(e.target.value)}
              placeholder="e.g., 001, 01, or 1"
              disabled={loading}
              maxLength={3}
            />
            <span className="help-text">Will be padded to 3 digits (e.g., 1 → 001)</span>
          </div>

          <div className="form-group">
            <label htmlFor="student-count">
              Number of Students <span className="required">*</span>
            </label>
            <input
              type="number"
              id="student-count"
              value={studentCount}
              onChange={(e) => setStudentCount(e.target.value)}
              placeholder="e.g., 30"
              disabled={loading}
              min="1"
              max="500"
            />
            <span className="help-text">How many students are enrolled (1-500)</span>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || courses.length === 0 || semesters.length === 0}
            >
              {loading ? 'Adding...' : 'Add Section'}
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


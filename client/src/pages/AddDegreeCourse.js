import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddForm.css';

export default function AddDegreeCourse() {
  const navigate = useNavigate();
  
  // Form fields
  const [degree, setDegree] = useState(''); // Will store "name|level" combined
  const [courseNo, setCourseNo] = useState('');
  const [isCore, setIsCore] = useState(false);
  
  // Dropdown data
  const [degrees, setDegrees] = useState([]);
  const [courses, setCourses] = useState([]);
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch degrees and courses on mount
  useEffect(() => {
    async function fetchDropdownData() {
      setLoadingData(true);
      try {
        const [degreesRes, coursesRes] = await Promise.all([
          fetch('http://localhost:4000/api/degrees'),
          fetch('http://localhost:4000/api/courses')
        ]);
        
        const degreesData = await degreesRes.json();
        const coursesData = await coursesRes.json();
        
        setDegrees(degreesData);
        setCourses(coursesData);
      } catch (err) {
        console.error(err);
        setError('Could not load degrees and courses. Please make sure the backend is running.');
      }
      setLoadingData(false);
    }
    
    fetchDropdownData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!degree) {
      setError('Please select a degree.');
      return;
    }

    if (!courseNo) {
      setError('Please select a course.');
      return;
    }

    // Parse degree (stored as "name|level")
    const [degreeName, degreeLevel] = degree.split('|');

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/degree-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          degree_name: degreeName,
          degree_level: degreeLevel,
          course_no: courseNo,
          is_core: isCore,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to link degree to course. Please try again.');
        return;
      }

      // Get display names for success message
      const course = courses.find(c => c.course_no === courseNo);
      const coreText = isCore ? '(Core Course)' : '(Elective)';

      // Success!
      setSuccess(`Successfully linked: ${degreeName} ${degreeLevel} → ${courseNo} (${course?.course_name}) ${coreText}`);
      setDegree('');
      setCourseNo('');
      setIsCore(false);

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
        <h1>Link Degree to Course</h1>
        <p className="subtitle">Assign a course to a degree program (core or elective)</p>
      </div>

      {loadingData ? (
        <div className="data-form" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading degrees and courses...</p>
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

          {/* Warning if no degrees or courses */}
          {degrees.length === 0 && (
            <div className="message error-message">
              No degrees found. Please <Link to="/add/degree">add a degree</Link> first.
            </div>
          )}

          {courses.length === 0 && (
            <div className="message error-message">
              No courses found. Please <Link to="/add/course">add a course</Link> first.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="dc-degree">
              Degree Program <span className="required">*</span>
            </label>
            <select
              id="dc-degree"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              disabled={loading || degrees.length === 0}
            >
              <option value="">-- Select Degree --</option>
              {degrees.map((deg) => (
                <option key={`${deg.name}|${deg.level}`} value={`${deg.name}|${deg.level}`}>
                  {deg.name} ({deg.level})
                </option>
              ))}
            </select>
            <span className="help-text">Which degree program requires this course?</span>
          </div>

          <div className="form-group">
            <label htmlFor="dc-course">
              Course <span className="required">*</span>
            </label>
            <select
              id="dc-course"
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
            <span className="help-text">Which course belongs to this degree?</span>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isCore}
                onChange={(e) => setIsCore(e.target.checked)}
                disabled={loading}
              />
              <span className="checkbox-text">
                This is a <strong>Core Course</strong> for this degree
              </span>
            </label>
            <span className="help-text">Core courses are required; unchecked means elective</span>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || degrees.length === 0 || courses.length === 0}
            >
              {loading ? 'Linking...' : 'Link Degree to Course'}
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


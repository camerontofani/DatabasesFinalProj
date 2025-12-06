import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddForm.css';

export default function AddCourseObjective() {
  const navigate = useNavigate();
  
  // Form fields
  const [courseNo, setCourseNo] = useState('');
  const [objectiveCode, setObjectiveCode] = useState('');
  
  // Dropdown data
  const [courses, setCourses] = useState([]);
  const [objectives, setObjectives] = useState([]);
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch courses and objectives on mount
  useEffect(() => {
    async function fetchDropdownData() {
      setLoadingData(true);
      try {
        const [coursesRes, objectivesRes] = await Promise.all([
          fetch('http://localhost:4000/api/courses'),
          fetch('http://localhost:4000/api/objectives')
        ]);
        
        const coursesData = await coursesRes.json();
        const objectivesData = await objectivesRes.json();
        
        setCourses(coursesData);
        setObjectives(objectivesData);
      } catch (err) {
        console.error(err);
        setError('Could not load courses and objectives. Please make sure the backend is running.');
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
    if (!courseNo) {
      setError('Please select a course.');
      return;
    }

    if (!objectiveCode) {
      setError('Please select a learning objective.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/course-objectives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_no: courseNo,
          objective_code: objectiveCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to link course to objective. Please try again.');
        return;
      }

      // Get display names for success message
      const course = courses.find(c => c.course_no === courseNo);
      const objective = objectives.find(o => o.code === objectiveCode);

      // Success!
      setSuccess(`Successfully linked: ${courseNo} (${course?.course_name}) → ${objectiveCode} (${objective?.title})`);
      setCourseNo('');
      setObjectiveCode('');

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
        <h1>Link Course to Objective</h1>
        <p className="subtitle">Associate a course with a learning objective it addresses</p>
      </div>

      {loadingData ? (
        <div className="data-form" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading courses and objectives...</p>
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

          {/* Warning if no courses or objectives */}
          {courses.length === 0 && (
            <div className="message error-message">
              No courses found. Please <Link to="/add/course">add a course</Link> first.
            </div>
          )}

          {objectives.length === 0 && (
            <div className="message error-message">
              No learning objectives found. Please <Link to="/add/learning-objective">add a learning objective</Link> first.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="co-course">
              Course <span className="required">*</span>
            </label>
            <select
              id="co-course"
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
            <span className="help-text">Which course addresses this objective?</span>
          </div>

          <div className="form-group">
            <label htmlFor="co-objective">
              Learning Objective <span className="required">*</span>
            </label>
            <select
              id="co-objective"
              value={objectiveCode}
              onChange={(e) => setObjectiveCode(e.target.value)}
              disabled={loading || objectives.length === 0}
            >
              <option value="">-- Select Learning Objective --</option>
              {objectives.map((obj) => (
                <option key={obj.code} value={obj.code}>
                  {obj.code} - {obj.title}
                </option>
              ))}
            </select>
            <span className="help-text">Which objective does this course address?</span>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || courses.length === 0 || objectives.length === 0}
            >
              {loading ? 'Linking...' : 'Link Course to Objective'}
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


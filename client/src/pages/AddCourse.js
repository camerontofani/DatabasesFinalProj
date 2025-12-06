import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddForm.css';

export default function AddCourse() {
  const navigate = useNavigate();
  const [courseNo, setCourseNo] = useState('');
  const [courseName, setCourseName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Normalize course number: remove special chars, uppercase, no spaces
  // Only keep letters and numbers
  const normalizeCourseNo = (str) => {
    return str
      .replace(/[^a-zA-Z0-9]/g, '') // Remove anything that's not a letter or number
      .toUpperCase();
  };

  // Validate course number format: 2-4 letters followed by 4 digits
  const isValidCourseNo = (str) => {
    const normalized = normalizeCourseNo(str);
    const pattern = /^[A-Z]{2,4}[0-9]{4}$/;
    return pattern.test(normalized);
  };

  // Sanitize and normalize course name:
  // 1. Remove special characters (keep only letters, numbers, spaces)
  // 2. Title Case
  const sanitizeCourseName = (str) => {
    return str
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!courseNo.trim()) {
      setError('Course number is required.');
      return;
    }

    if (!isValidCourseNo(courseNo)) {
      setError('Course number must be 2-4 letters followed by 4 digits (e.g., CS5330, MATH1309).');
      return;
    }

    if (!courseName.trim()) {
      setError('Course name is required.');
      return;
    }

    // Normalize values
    const normalizedCourseNo = normalizeCourseNo(courseNo);
    const normalizedCourseName = sanitizeCourseName(courseName);

    // Check if name is empty after sanitization
    if (!normalizedCourseName) {
      setError('Course name must contain letters or numbers.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_no: normalizedCourseNo,
          course_name: normalizedCourseName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error) {
          setError(data.error);
        } else {
          setError('Failed to add course. Please try again.');
        }
        return;
      }

      // Success!
      setSuccess(`Successfully added: ${normalizedCourseNo} - ${normalizedCourseName}`);
      setCourseNo('');
      setCourseName('');

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
        <h1>Add Course</h1>
        <p className="subtitle">Create a new course in the system</p>
      </div>

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

        <div className="form-group">
          <label htmlFor="course-no">
            Course Number <span className="required">*</span>
          </label>
          <input
            type="text"
            id="course-no"
            value={courseNo}
            onChange={(e) => setCourseNo(e.target.value)}
            placeholder="e.g., CS5330"
            disabled={loading}
            maxLength={8}
          />
          <span className="help-text">Format: 2-4 letters + 4 digits (will be uppercased)</span>
        </div>

        <div className="form-group">
          <label htmlFor="course-name">
            Course Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="course-name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="e.g., Database Systems"
            disabled={loading}
          />
          <span className="help-text">Special characters removed, converted to Title Case</span>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Course'}
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
    </div>
  );
}


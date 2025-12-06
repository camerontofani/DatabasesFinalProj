import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddForm.css';

export default function AddSemester() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Valid terms (NO Winter per project requirements)
  const validTerms = ['Fall', 'Spring', 'Summer'];

  // Current year for reasonable defaults
  const currentYear = new Date().getFullYear();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!term) {
      setError('Please select a term.');
      return;
    }

    if (!year) {
      setError('Year is required.');
      return;
    }

    const yearNum = parseInt(year, 10);

    if (isNaN(yearNum)) {
      setError('Year must be a valid number.');
      return;
    }

    if (yearNum < 1900) {
      setError('Year must be 1900 or later.');
      return;
    }

    if (yearNum > 2100) {
      setError('Year must be 2100 or earlier.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/semesters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term: term,
          year: yearNum,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add semester. Please try again.');
        return;
      }

      // Success!
      setSuccess(`Successfully added: ${term} ${yearNum}`);
      setTerm('');
      setYear('');

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
        <h1>Add Semester</h1>
        <p className="subtitle">Create a new semester for course sections</p>
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
          <label htmlFor="semester-term">
            Term <span className="required">*</span>
          </label>
          <select
            id="semester-term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Select Term --</option>
            {validTerms.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="help-text">Fall, Spring, or Summer only</span>
        </div>

        <div className="form-group">
          <label htmlFor="semester-year">
            Year <span className="required">*</span>
          </label>
          <input
            type="number"
            id="semester-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder={`e.g., ${currentYear}`}
            disabled={loading}
            min="1900"
            max="2100"
          />
          <span className="help-text">Enter the year (e.g., 2025)</span>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Semester'}
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


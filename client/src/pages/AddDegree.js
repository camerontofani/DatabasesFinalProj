import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddForm.css';

export default function AddDegree() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Valid degree levels from the project requirements
  const validLevels = ['BA', 'BS', 'MS', 'Ph.D.', 'Cert'];

  // Sanitize and normalize name:
  // 1. Remove special characters (keep only letters, numbers, spaces)
  // 2. Remove extra spaces
  // 3. Convert to Title Case
  const sanitizeName = (str) => {
    return str
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .toLowerCase()
      .trim()
      .split(/\s+/) // Split on any whitespace (handles multiple spaces)
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!name.trim()) {
      setError('Degree name is required.');
      return;
    }

    if (!level) {
      setError('Please select a degree level.');
      return;
    }

    // Sanitize and normalize the name
    const normalizedName = sanitizeName(name);
    
    // Check if name is empty after sanitization (was only special characters)
    if (!normalizedName) {
      setError('Degree name must contain letters or numbers.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/degrees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizedName,
          level: level,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error && data.error.includes('Duplicate')) {
          setError(`The degree "${normalizedName}" with level "${level}" already exists.`);
        } else {
          setError(data.error || 'Failed to add degree. Please try again.');
        }
        return;
      }

      // Success!
      setSuccess(`Successfully added: ${normalizedName} (${level})`);
      setName('');
      setLevel('');

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
        <h1>Add Degree</h1>
        <p className="subtitle">Create a new degree program</p>
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
          <label htmlFor="degree-name">
            Degree Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="degree-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Computer Science"
            disabled={loading}
          />
          <span className="help-text">Special characters will be removed and converted to Title Case</span>
        </div>

        <div className="form-group">
          <label htmlFor="degree-level">
            Degree Level <span className="required">*</span>
          </label>
          <select
            id="degree-level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Select Level --</option>
            {validLevels.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Degree'}
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


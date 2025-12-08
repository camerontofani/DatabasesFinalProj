import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddForm.css';

export default function AddDegree() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Objectives state
  const [objectives, setObjectives] = useState([]);
  const [selectedObjectives, setSelectedObjectives] = useState([]);
  const [loadingObjectives, setLoadingObjectives] = useState(true);

  // Valid degree levels from the project requirements
  const validLevels = ['BA', 'BS', 'MS', 'Ph.D.', 'Cert'];

  // Fetch available objectives on mount
  useEffect(() => {
    async function fetchObjectives() {
      setLoadingObjectives(true);
      try {
        const response = await fetch('http://localhost:4000/api/objectives');
        const data = await response.json();
        setObjectives(data);
      } catch (err) {
        console.error('Could not load objectives:', err);
      }
      setLoadingObjectives(false);
    }
    fetchObjectives();
  }, []);

  // Sanitize and normalize name
  const sanitizeName = (str) => {
    return str
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle objective checkbox toggle
  const toggleObjective = (code) => {
    setSelectedObjectives(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code) 
        : [...prev, code]
    );
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

    const normalizedName = sanitizeName(name);
    
    if (!normalizedName) {
      setError('Degree name must contain letters or numbers.');
      return;
    }

    // Warning if no objectives selected (but don't block)
    if (selectedObjectives.length === 0) {
      const proceed = window.confirm(
        'No learning objectives selected. Each degree should have objectives for evaluation purposes.\n\nDo you want to continue without objectives? (You can add them later)'
      );
      if (!proceed) return;
    }

    setLoading(true);

    try {
      // Step 1: Create the degree
      const response = await fetch('http://localhost:4000/api/degrees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: normalizedName, level: level }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error && data.error.includes('Duplicate')) {
          setError(`The degree "${normalizedName}" with level "${level}" already exists.`);
        } else {
          setError(data.error || 'Failed to add degree. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Step 2: If objectives selected, assign them to the degree
      if (selectedObjectives.length > 0) {
        await fetch('http://localhost:4000/api/degree-objectives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            degree_name: normalizedName,
            degree_level: level,
            objective_codes: selectedObjectives
          }),
        });
      }

      // Success!
      let successMsg = `Successfully added: ${normalizedName} (${level})`;
      if (selectedObjectives.length > 0) {
        successMsg += ` with ${selectedObjectives.length} learning objective(s)`;
      }
      setSuccess(successMsg);
      setName('');
      setLevel('');
      setSelectedObjectives([]);

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
        <p className="subtitle">Create a new degree program with its learning objectives</p>
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

        {/* Learning Objectives Section */}
        <div className="form-group">
          <label>
            Learning Objectives
            <span className="optional-label">(select which objectives this degree aims to achieve)</span>
          </label>
          
          {loadingObjectives ? (
            <p className="loading-text">Loading objectives...</p>
          ) : objectives.length === 0 ? (
            <div className="info-box warning">
              No learning objectives exist yet. 
              <Link to="/add/learning-objective" style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                Add some first →
              </Link>
            </div>
          ) : (
            <div className="checkbox-group">
              {objectives.map((obj) => (
                <label key={obj.code} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedObjectives.includes(obj.code)}
                    onChange={() => toggleObjective(obj.code)}
                    disabled={loading}
                  />
                  <span className="checkbox-label">
                    <strong>{obj.code}</strong> - {obj.title}
                  </span>
                </label>
              ))}
            </div>
          )}
          
          {selectedObjectives.length > 0 && (
            <span className="help-text">
              {selectedObjectives.length} objective(s) selected
            </span>
          )}
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

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddForm.css';

export default function AddLearningObjective() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Normalize code: uppercase, remove spaces and special chars
  const normalizeCode = (str) => {
    return str
      .replace(/[^a-zA-Z0-9]/g, '') // Only letters and numbers
      .toUpperCase();
  };

  // Sanitize title: remove special chars, Title Case
  const sanitizeTitle = (str) => {
    return str
      .replace(/[^a-zA-Z0-9\s]/g, '')
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
    if (!code.trim()) {
      setError('Objective code is required.');
      return;
    }

    const normalizedCode = normalizeCode(code);
    
    if (!normalizedCode) {
      setError('Code must contain letters or numbers.');
      return;
    }

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    const sanitizedTitle = sanitizeTitle(title);

    if (!sanitizedTitle) {
      setError('Title must contain letters or numbers.');
      return;
    }

    if (sanitizedTitle.length > 120) {
      setError('Title must be 120 characters or less.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/objectives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: normalizedCode,
          title: sanitizedTitle,
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add learning objective. Please try again.');
        return;
      }

      // Success!
      setSuccess(`Successfully added: ${normalizedCode} - ${sanitizedTitle}`);
      setCode('');
      setTitle('');
      setDescription('');

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
        <h1>Add Learning Objective</h1>
        <p className="subtitle">Create a new learning objective for course evaluation</p>
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
          <label htmlFor="objective-code">
            Objective Code <span className="required">*</span>
          </label>
          <input
            type="text"
            id="objective-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., LO1, LO2, OBJ1"
            disabled={loading}
            maxLength={20}
          />
          <span className="help-text">Will be uppercased (e.g., lo1 → LO1)</span>
        </div>

        <div className="form-group">
          <label htmlFor="objective-title">
            Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="objective-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Design relational schema"
            disabled={loading}
            maxLength={120}
          />
          <span className="help-text">Short name for the objective (max 120 characters)</span>
        </div>

        <div className="form-group">
          <label htmlFor="objective-description">
            Description <span style={{ color: '#6b7280', fontWeight: 'normal' }}>(optional)</span>
          </label>
          <textarea
            id="objective-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Students can design correct ER and relational models."
            disabled={loading}
            rows={4}
          />
          <span className="help-text">Detailed description of what students should learn</span>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Learning Objective'}
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


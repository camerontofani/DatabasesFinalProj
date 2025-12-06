import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddForm.css';

export default function AddInstructor() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Warning modal state
  const [showWarning, setShowWarning] = useState(false);
  const [existingInstructors, setExistingInstructors] = useState([]);
  const [pendingName, setPendingName] = useState('');

  // Sanitize and normalize name:
  const sanitizeName = (str) => {
    const cleaned = str
      .replace(/[^a-zA-Z0-9\s.\-]/g, '')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .join(' ');
    
    return cleaned
      .split(' ')
      .map(word => {
        if (word.toLowerCase() === 'dr.' || word.toLowerCase() === 'dr') {
          return 'Dr.';
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  // Check if instructor name already exists
  const checkDuplicateName = async (normalizedName) => {
    try {
      const response = await fetch('http://localhost:4000/api/instructors');
      const instructors = await response.json();
      
      // Find instructors with the same name (case-insensitive)
      const matches = instructors.filter(
        inst => inst.instructor_name.toLowerCase() === normalizedName.toLowerCase()
      );
      
      return matches;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // Actually add the instructor
  const addInstructor = async (normalizedName) => {
    setLoading(true);
    setShowWarning(false);

    try {
      const response = await fetch('http://localhost:4000/api/instructors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructor_name: normalizedName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add instructor. Please try again.');
        return;
      }

      setSuccess(`Successfully added: ${normalizedName} (ID: ${data.instructor_id})`);
      setName('');
      setPendingName('');

    } catch (err) {
      console.error(err);
      setError('Could not connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Instructor name is required.');
      return;
    }

    const normalizedName = sanitizeName(name);

    if (!normalizedName) {
      setError('Instructor name must contain letters.');
      return;
    }

    setLoading(true);

    // Check for duplicates first
    const duplicates = await checkDuplicateName(normalizedName);
    
    if (duplicates.length > 0) {
      // Show warning modal
      setExistingInstructors(duplicates);
      setPendingName(normalizedName);
      setShowWarning(true);
      setLoading(false);
    } else {
      // No duplicates, add directly
      await addInstructor(normalizedName);
    }
  };

  const handleConfirmAdd = () => {
    addInstructor(pendingName);
  };

  const handleCancelAdd = () => {
    setShowWarning(false);
    setPendingName('');
    setExistingInstructors([]);
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
        <h1>Add Instructor</h1>
        <p className="subtitle">Register a new instructor in the system</p>
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
          <label htmlFor="instructor-name">
            Instructor Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="instructor-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Dr. Smith"
            disabled={loading}
          />
          <span className="help-text">ID will be assigned automatically. Name will be normalized.</span>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Instructor'}
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

      {/* Duplicate Name Warning Modal */}
      {showWarning && (
        <div className="modal-overlay" onClick={handleCancelAdd}>
          <div className="modal warning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Instructor Already Exists</h2>
            </div>
            <div className="modal-body">
              <p>An instructor with the name <strong>"{pendingName}"</strong> already exists:</p>
              
              <div className="existing-list">
                {existingInstructors.map(inst => (
                  <div key={inst.instructor_id} className="existing-item">
                    {inst.instructor_name} (ID: {inst.instructor_id})
                  </div>
                ))}
              </div>
              
              <p className="warning-text">
                Only add if this is a <strong>different professor</strong> with the same name.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn" 
                onClick={handleCancelAdd}
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm-btn" 
                onClick={handleConfirmAdd}
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

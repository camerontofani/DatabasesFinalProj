import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Queries.css';

export default function Queries() {
  // Semester selection
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  
  // Query 1: Evaluation Status
  const [evalStatusResults, setEvalStatusResults] = useState(null);
  const [evalStatusLoading, setEvalStatusLoading] = useState(false);
  
  // Query 2: Pass Rate
  const [percentage, setPercentage] = useState(70);
  const [passRateResults, setPassRateResults] = useState(null);
  const [passRateLoading, setPassRateLoading] = useState(false);
  
  const [error, setError] = useState('');

  // Fetch semesters on mount
  useEffect(() => {
    async function fetchSemesters() {
      try {
        const response = await fetch('http://localhost:4000/api/semesters');
        const data = await response.json();
        setSemesters(data);
      } catch (err) {
        setError('Could not load semesters.');
      }
    }
    fetchSemesters();
  }, []);

  // Query 1: Get evaluation status for all sections in a semester
  const runEvaluationStatusQuery = async () => {
    if (!selectedSemester) {
      setError('Please select a semester.');
      return;
    }
    
    setEvalStatusLoading(true);
    setError('');
    setEvalStatusResults(null);
    
    try {
      const [term, year] = selectedSemester.split('|');
      const response = await fetch(
        `http://localhost:4000/api/queries/evaluation-status?term=${encodeURIComponent(term)}&year=${encodeURIComponent(year)}`
      );
      const data = await response.json();
      setEvalStatusResults(data);
    } catch (err) {
      setError('Could not run query.');
    }
    setEvalStatusLoading(false);
  };

  // Query 2: Get sections where non-F percentage meets threshold
  const runPassRateQuery = async () => {
    if (!selectedSemester) {
      setError('Please select a semester.');
      return;
    }
    if (percentage < 0 || percentage > 100) {
      setError('Percentage must be between 0 and 100.');
      return;
    }
    
    setPassRateLoading(true);
    setError('');
    setPassRateResults(null);
    
    try {
      const [term, year] = selectedSemester.split('|');
      const response = await fetch(
        `http://localhost:4000/api/queries/pass-rate?term=${encodeURIComponent(term)}&year=${encodeURIComponent(year)}&percentage=${percentage}`
      );
      const data = await response.json();
      setPassRateResults(data);
    } catch (err) {
      setError('Could not run query.');
    }
    setPassRateLoading(false);
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Complete': return 'status-complete';
      case 'Partial': return 'status-partial';
      case 'Not Entered': return 'status-none';
      default: return '';
    }
  };

  return (
    <div className="queries-container">
      <Link to="/" className="back-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </Link>

      <div className="queries-header">
        <h1>Queries</h1>
        <p className="subtitle">Run predefined queries on evaluation data</p>
      </div>

      {error && (
        <div className="query-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      )}

      {/* Semester Selection */}
      <div className="semester-selector">
        <label htmlFor="query-semester">Select Semester:</label>
        <select 
          id="query-semester"
          value={selectedSemester} 
          onChange={(e) => {
            setSelectedSemester(e.target.value);
            setEvalStatusResults(null);
            setPassRateResults(null);
          }}
        >
          <option value="">-- Select Semester --</option>
          {semesters.map((s) => (
            <option key={`${s.term}|${s.year}`} value={`${s.term}|${s.year}`}>
              {s.term} {s.year}
            </option>
          ))}
        </select>
      </div>

      {/* Query 1: Evaluation Status */}
      <div className="query-card">
        <div className="query-card-header">
          <h2>Query 1: Evaluation Status by Section</h2>
          <p>List all sections in a semester and show evaluation completion status</p>
        </div>
        
        <div className="query-card-body">
          <button 
            className="run-query-btn"
            onClick={runEvaluationStatusQuery}
            disabled={evalStatusLoading || !selectedSemester}
          >
            {evalStatusLoading ? 'Running...' : 'Run Query'}
          </button>

          {evalStatusResults && (
            <div className="query-results">
              <div className="results-summary">
                <span className="summary-item">
                  <strong>{evalStatusResults.length}</strong> sections found
                </span>
                <span className="summary-item complete">
                  <strong>{evalStatusResults.filter(r => r.status === 'Complete').length}</strong> complete
                </span>
                <span className="summary-item partial">
                  <strong>{evalStatusResults.filter(r => r.status === 'Partial').length}</strong> partial
                </span>
                <span className="summary-item none">
                  <strong>{evalStatusResults.filter(r => r.status === 'Not Entered').length}</strong> not entered
                </span>
              </div>

              {evalStatusResults.length > 0 ? (
                <table className="query-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Section</th>
                      <th>Students</th>
                      <th>Instructor</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Improvement Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evalStatusResults.map((row, i) => (
                      <tr key={i}>
                        <td><strong>{row.course_no}</strong><br/><span className="course-name">{row.course_name}</span></td>
                        <td>{row.section_no}</td>
                        <td>{row.student_count}</td>
                        <td>{row.instructor_name || <span className="null-value">—</span>}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <div className="progress-info">
                            {row.evaluations_entered} / {row.total_objectives} objectives
                            <div className="mini-progress">
                              <div 
                                className="mini-progress-fill" 
                                style={{ width: `${row.total_objectives > 0 ? (row.evaluations_entered / row.total_objectives) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          {row.has_improvement ? (
                            <span className="has-notes">Yes ({row.improvement_count})</span>
                          ) : (
                            <span className="no-notes">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-results">No sections found for this semester.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Query 2: Pass Rate */}
      <div className="query-card">
        <div className="query-card-header">
          <h2>Query 2: Sections Meeting Pass Rate</h2>
          <p>Find sections where the percentage of students NOT getting F reaches a threshold</p>
        </div>
        
        <div className="query-card-body">
          <div className="percentage-input">
            <label htmlFor="percentage">Minimum Pass Rate (%):</label>
            <input 
              type="number" 
              id="percentage"
              value={percentage} 
              onChange={(e) => setPercentage(parseInt(e.target.value) || 0)}
              min="0"
              max="100"
            />
            <span className="percentage-hint">Students with A, B, or C</span>
          </div>

          <button 
            className="run-query-btn"
            onClick={runPassRateQuery}
            disabled={passRateLoading || !selectedSemester}
          >
            {passRateLoading ? 'Running...' : 'Run Query'}
          </button>

          {passRateResults && (
            <div className="query-results">
              <div className="results-summary">
                <span className="summary-item">
                  <strong>{passRateResults.length}</strong> sections meet the {percentage}% threshold
                </span>
              </div>

              {passRateResults.length > 0 ? (
                <table className="query-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Section</th>
                      <th>Degree</th>
                      <th>Objective</th>
                      <th>Total Graded</th>
                      <th>Non-F Count</th>
                      <th>Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passRateResults.map((row, i) => (
                      <tr key={i}>
                        <td><strong>{row.course_no}</strong></td>
                        <td>{row.section_no}</td>
                        <td>{row.degree_name} ({row.degree_level})</td>
                        <td>{row.objective_code}</td>
                        <td>{row.total_graded}</td>
                        <td>{row.non_f_count}</td>
                        <td>
                          <span className={`pass-rate ${parseFloat(row.pass_rate) >= percentage ? 'good' : 'low'}`}>
                            {parseFloat(row.pass_rate).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-results">No evaluations meet the {percentage}% pass rate threshold.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


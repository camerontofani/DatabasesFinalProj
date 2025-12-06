import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ViewAllData.css';

function ViewAllData() {
  const [table, setTable] = useState("degrees");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const endpoints = {
    evaluations: "/api/evaluations",
    degrees: "/api/degrees",
    courses: "/api/courses",
    sections: "/api/sections",
    instructors: "/api/instructors",
  };

  const tableLabels = {
    evaluations: "Evaluations",
    degrees: "Degrees",
    courses: "Courses",
    sections: "Sections",
    instructors: "Instructors",
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:4000${endpoints[table]}`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }

    fetchData();
  }, [table]);

  // Get column headers from the first data item
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  // Format column names for display (e.g., "course_id" -> "Course ID")
  const formatColumnName = (name) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format cell values for display
  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="null-value">—</span>;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  return (
    <div className="view-data-container">
      <Link to="/" className="back-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </Link>

      <div className="view-data-header">
        <h1>View Data</h1>
        <p className="subtitle">Browse all records in your database</p>
      </div>

      <div className="controls">
        <label htmlFor="table-select">Select Table:</label>
        <select 
          id="table-select"
          value={table} 
          onChange={(e) => setTable(e.target.value)}
          className="table-select"
        >
          <option value="degrees">Degrees</option>
          <option value="courses">Courses</option>
          <option value="sections">Sections</option>
          <option value="instructors">Instructors</option>
          <option value="evaluations">Evaluations</option>
        </select>
      </div>

      <div className="table-info">
        <span className="table-name">{tableLabels[table]}</span>
        <span className="record-count">{data.length} records</span>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <p>No records found in this table.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{formatColumnName(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col) => (
                    <td key={col}>{formatCellValue(row[col])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ViewAllData;

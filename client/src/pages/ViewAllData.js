import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ViewAllData.css';

function ViewAllData() {
  const [table, setTable] = useState("degrees");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // View Details state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Semester range filter state
  const [semesters, setSemesters] = useState([]);
  const [fromSemester, setFromSemester] = useState('');
  const [toSemester, setToSemester] = useState('');

  const endpoints = {
    evaluations: "/api/evaluations",
    degrees: "/api/degrees",
    courses: "/api/courses",
    sections: "/api/sections",
    instructors: "/api/instructors",
    objectives: "/api/objectives",
    semesters: "/api/semesters",
    courseObjectives: "/api/course-objectives",
    degreeCourses: "/api/degree-courses",
    teaches: "/api/teaches",
  };

  const tableLabels = {
    evaluations: "Evaluations",
    degrees: "Degrees",
    courses: "Courses",
    sections: "Sections",
    instructors: "Instructors",
    objectives: "Learning Objectives",
    semesters: "Semesters",
    courseObjectives: "Course Objectives",
    degreeCourses: "Degree Courses",
    teaches: "Instructor Assignments",
  };

  // Tables that support "View Details"
  const tablesWithDetails = ['degrees', 'courses', 'instructors'];

  // Fetch semesters for filter dropdowns
  useEffect(() => {
    async function fetchSemesters() {
      try {
        const response = await fetch('http://localhost:4000/api/semesters');
        const result = await response.json();
        setSemesters(result);
      } catch (err) {
        console.error(err);
      }
    }
    fetchSemesters();
  }, []);

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
    // Close details when table changes
    setDetailsOpen(false);
    setDetailsData(null);
    // Reset filters
    setFromSemester('');
    setToSemester('');
  }, [table]);

  // Helper to convert semester to sortable number (e.g., "Fall|2025" -> 20253)
  const semesterToNumber = (term, year) => {
    const termOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
    return year * 10 + (termOrder[term] || 0);
  };

  // Filter sections by semester range
  const filterSectionsBySemester = (sections) => {
    if (!sections) return [];
    if (!fromSemester && !toSemester) return sections;
    
    let fromNum = 0;
    let toNum = 99999;
    
    if (fromSemester) {
      const [fromTerm, fromYear] = fromSemester.split('|');
      fromNum = semesterToNumber(fromTerm, parseInt(fromYear));
    }
    if (toSemester) {
      const [toTerm, toYear] = toSemester.split('|');
      toNum = semesterToNumber(toTerm, parseInt(toYear));
    }
    
    return sections.filter(s => {
      const sNum = semesterToNumber(s.term, s.year);
      return sNum >= fromNum && sNum <= toNum;
    });
  };

  // Fetch details for a specific item
  const fetchDetails = async (row) => {
    setDetailsLoading(true);
    setSelectedItem(row);
    setDetailsOpen(true);
    
    try {
      let url = '';
      if (table === 'degrees') {
        url = `http://localhost:4000/api/degrees/${encodeURIComponent(row.name)}/${encodeURIComponent(row.level)}/details`;
      } else if (table === 'courses') {
        url = `http://localhost:4000/api/courses/${encodeURIComponent(row.course_no)}/details`;
      } else if (table === 'instructors') {
        url = `http://localhost:4000/api/instructors/${row.instructor_id}/details`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      setDetailsData(result);
    } catch (err) {
      console.error(err);
      setDetailsData({ error: 'Could not load details' });
    }
    setDetailsLoading(false);
  };

  // Get column headers from the first data item
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  // Format column names for display
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

  // Render details panel content based on table type
  const renderDetailsContent = () => {
    if (detailsLoading) {
      return <div className="details-loading"><div className="spinner"></div><p>Loading details...</p></div>;
    }
    
    if (!detailsData) return null;
    
    if (detailsData.error) {
      return <div className="details-error">{detailsData.error}</div>;
    }

    if (table === 'degrees') {
      return (
        <div className="details-content">
          <h3>{selectedItem.name} ({selectedItem.level})</h3>
          
          <div className="details-section">
            <h4>Courses ({detailsData.courses?.length || 0})</h4>
            {detailsData.courses?.length > 0 ? (
              <table className="details-table">
                <thead>
                  <tr><th>Course No</th><th>Course Name</th><th>Type</th></tr>
                </thead>
                <tbody>
                  {detailsData.courses.map((c, i) => (
                    <tr key={i}>
                      <td>{c.course_no}</td>
                      <td>{c.course_name}</td>
                      <td><span className={`badge ${c.is_core ? 'core' : 'elective'}`}>{c.is_core ? 'Core' : 'Elective'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="no-data">No courses associated with this degree.</p>}
          </div>

          <div className="details-section">
            <h4>Sections ({detailsData.sections?.length || 0})</h4>
            {detailsData.sections?.length > 0 ? (
              <table className="details-table">
                <thead>
                  <tr><th>Course</th><th>Section</th><th>Semester</th><th>Students</th></tr>
                </thead>
                <tbody>
                  {detailsData.sections.map((s, i) => (
                    <tr key={i}>
                      <td>{s.course_no}</td>
                      <td>{s.section_no}</td>
                      <td>{s.term} {s.year}</td>
                      <td>{s.student_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="no-data">No sections found for this degree's courses.</p>}
          </div>

          <div className="details-section">
            <h4>Learning Objectives ({detailsData.objectives?.length || 0})</h4>
            {detailsData.objectives?.length > 0 ? (
              <table className="details-table">
                <thead>
                  <tr><th>Code</th><th>Title</th><th>Course</th></tr>
                </thead>
                <tbody>
                  {detailsData.objectives.map((o, i) => (
                    <tr key={i}>
                      <td>{o.objective_code}</td>
                      <td>{o.title}</td>
                      <td>{o.course_no}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="no-data">No learning objectives found for this degree's courses.</p>}
          </div>
        </div>
      );
    }

    if (table === 'courses') {
      const filteredSections = filterSectionsBySemester(detailsData.sections);
      return (
        <div className="details-content">
          <h3>{selectedItem.course_no} - {selectedItem.course_name}</h3>
          
          <div className="details-section">
            <h4>Sections</h4>
            
            {/* Semester Range Filter */}
            <div className="semester-filter">
              <label>Filter by Semester Range:</label>
              <div className="filter-row">
                <select value={fromSemester} onChange={(e) => setFromSemester(e.target.value)}>
                  <option value="">From (All)</option>
                  {semesters.map((s) => (
                    <option key={`${s.term}|${s.year}`} value={`${s.term}|${s.year}`}>{s.term} {s.year}</option>
                  ))}
                </select>
                <span className="filter-to">to</span>
                <select value={toSemester} onChange={(e) => setToSemester(e.target.value)}>
                  <option value="">To (All)</option>
                  {semesters.map((s) => (
                    <option key={`${s.term}|${s.year}`} value={`${s.term}|${s.year}`}>{s.term} {s.year}</option>
                  ))}
                </select>
                {(fromSemester || toSemester) && (
                  <button className="clear-filter" onClick={() => { setFromSemester(''); setToSemester(''); }}>Clear</button>
                )}
              </div>
            </div>

            <p className="filter-count">Showing {filteredSections.length} of {detailsData.sections?.length || 0} sections</p>
            
            {filteredSections.length > 0 ? (
              <table className="details-table">
                <thead>
                  <tr><th>Section</th><th>Semester</th><th>Students</th><th>Instructor</th></tr>
                </thead>
                <tbody>
                  {filteredSections.map((s, i) => (
                    <tr key={i}>
                      <td>{s.section_no}</td>
                      <td>{s.term} {s.year}</td>
                      <td>{s.student_count}</td>
                      <td>{s.instructor_name || <span className="null-value">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="no-data">No sections found for the selected range.</p>}
          </div>
        </div>
      );
    }

    if (table === 'instructors') {
      const filteredSections = filterSectionsBySemester(detailsData.sections);
      return (
        <div className="details-content">
          <h3>{selectedItem.instructor_name}</h3>
          
          <div className="details-section">
            <h4>Sections Taught</h4>
            
            {/* Semester Range Filter */}
            <div className="semester-filter">
              <label>Filter by Semester Range:</label>
              <div className="filter-row">
                <select value={fromSemester} onChange={(e) => setFromSemester(e.target.value)}>
                  <option value="">From (All)</option>
                  {semesters.map((s) => (
                    <option key={`${s.term}|${s.year}`} value={`${s.term}|${s.year}`}>{s.term} {s.year}</option>
                  ))}
                </select>
                <span className="filter-to">to</span>
                <select value={toSemester} onChange={(e) => setToSemester(e.target.value)}>
                  <option value="">To (All)</option>
                  {semesters.map((s) => (
                    <option key={`${s.term}|${s.year}`} value={`${s.term}|${s.year}`}>{s.term} {s.year}</option>
                  ))}
                </select>
                {(fromSemester || toSemester) && (
                  <button className="clear-filter" onClick={() => { setFromSemester(''); setToSemester(''); }}>Clear</button>
                )}
              </div>
            </div>

            <p className="filter-count">Showing {filteredSections.length} of {detailsData.sections?.length || 0} sections</p>
            
            {filteredSections.length > 0 ? (
              <table className="details-table">
                <thead>
                  <tr><th>Course</th><th>Section</th><th>Semester</th><th>Students</th></tr>
                </thead>
                <tbody>
                  {filteredSections.map((s, i) => (
                    <tr key={i}>
                      <td>{s.course_no} - {s.course_name}</td>
                      <td>{s.section_no}</td>
                      <td>{s.term} {s.year}</td>
                      <td>{s.student_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="no-data">No sections found for the selected range.</p>}
          </div>
        </div>
      );
    }

    return null;
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
          <option value="instructors">Instructors</option>
          <option value="objectives">Learning Objectives</option>
          <option value="semesters">Semesters</option>
          <option value="sections">Sections</option>
          <option value="courseObjectives">Course Objectives</option>
          <option value="degreeCourses">Degree Courses</option>
          <option value="teaches">Instructor Assignments</option>
          <option value="evaluations">Evaluations</option>
        </select>
      </div>

      <div className="table-info">
        <span className="table-name">{tableLabels[table]}</span>
        <span className="record-count">{data.length} records</span>
      </div>

      <div className="main-content">
        <div className={`table-section ${detailsOpen ? 'with-details' : ''}`}>
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
                    {tablesWithDetails.includes(table) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className={selectedItem === row ? 'selected-row' : ''}>
                      {columns.map((col) => (
                        <td key={col}>{formatCellValue(row[col])}</td>
                      ))}
                      {tablesWithDetails.includes(table) && (
                        <td>
                          <button 
                            className="details-btn"
                            onClick={() => fetchDetails(row)}
                          >
                            View Details
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Panel */}
        {detailsOpen && (
          <div className="details-panel">
            <div className="details-header">
              <h3>Details</h3>
              <button className="close-details" onClick={() => { setDetailsOpen(false); setSelectedItem(null); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            {renderDetailsContent()}
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewAllData;

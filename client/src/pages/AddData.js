import React from 'react';
import { Link } from 'react-router-dom';
import './AddData.css';

export default function AddData() {
  // Ordered to reflect the logical workflow for entering evaluations
  const entities = [
    {
      name: 'Learning Objective',
      path: '/add/learning-objective',
      description: '1. Create learning objectives first',
    },
    {
      name: 'Course',
      path: '/add/course',
      description: '2. Add courses to the system',
    },
    {
      name: 'Course Objective',
      path: '/add/course-objective',
      description: '3. Link courses to their learning objectives',
    },
    {
      name: 'Degree',
      path: '/add/degree',
      description: '4. Create degree programs with objectives',
    },
    {
      name: 'Degree Course',
      path: '/add/degree-course',
      description: '5. Link courses to degrees (mark core/elective)',
    },
    {
      name: 'Instructor',
      path: '/add/instructor',
      description: '6. Add instructors',
    },
    {
      name: 'Semester',
      path: '/add/semester',
      description: '7. Add semesters (Fall, Spring, Summer)',
    },
    {
      name: 'Section',
      path: '/add/section',
      description: '8. Create course sections for a semester',
    },
    {
      name: 'Instructor Assignment',
      path: '/add/teaches',
      description: '9. Assign instructors to sections',
    },
    {
      name: 'Evaluation',
      path: '/add/evaluation',
      description: '10. Enter evaluation data',
    },
  ];

  return (
    <div className="add-data-container">
      <Link to="/" className="back-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </Link>

      <div className="add-data-header">
        <h1>Add Data</h1>
        <p className="subtitle">Select what type of record you want to add</p>
      </div>

      <div className="entity-grid">
        {entities.map((entity) => (
          <Link to={entity.path} key={entity.name} className="entity-card">
            <h3>Add {entity.name}</h3>
            <p>{entity.description}</p>
            <span className="arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}


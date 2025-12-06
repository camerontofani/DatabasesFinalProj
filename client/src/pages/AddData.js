import React from 'react';
import { Link } from 'react-router-dom';
import './AddData.css';

export default function AddData() {
  const entities = [
    {
      name: 'Degree',
      path: '/add/degree',
      description: 'Add a new degree program',
    },
    {
      name: 'Course',
      path: '/add/course',
      description: 'Add a new course',
    },
    {
      name: 'Instructor',
      path: '/add/instructor',
      description: 'Add a new instructor',
    },
    {
      name: 'Learning Objective',
      path: '/add/learning-objective',
      description: 'Add a new learning objective',
    },
    {
      name: 'Section',
      path: '/add/section',
      description: 'Add a new course section',
    },
    {
      name: 'Evaluation',
      path: '/add/evaluation',
      description: 'Add a new evaluation',
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


-- Run this in MySQL to add the DegreeObjective table

USE assessment_db;

CREATE TABLE DegreeObjective (
  degree_name VARCHAR(100) NOT NULL,
  degree_level VARCHAR(50) NOT NULL,
  objective_code VARCHAR(20) NOT NULL,
  PRIMARY KEY (degree_name, degree_level, objective_code),
  CONSTRAINT fk_degobj_degree FOREIGN KEY (degree_name, degree_level) REFERENCES Degree(name, level),
  CONSTRAINT fk_degobj_objective FOREIGN KEY (objective_code) REFERENCES LearningObjective(code)
);

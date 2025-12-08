const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// 1) Create a pool of connections to your local MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',          // root password 
  database: 'assessment_db'
});

// 2) Simple test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ----------------------
//   GET ALL DEGREES
// ----------------------
app.get('/api/degrees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Degree;');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   ADD A NEW DEGREE
// ----------------------
app.post('/api/degrees', async (req, res) => {
  try {
    const { name, level } = req.body;

    // Server-side validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Degree name is required.' });
    }

    if (!level || !level.trim()) {
      return res.status(400).json({ error: 'Degree level is required.' });
    }

    // Valid levels
    const validLevels = ['BA', 'BS', 'MS', 'Ph.D.', 'Cert'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: `Invalid level. Must be one of: ${validLevels.join(', ')}` });
    }

    // Insert into database
    await pool.query(
      'INSERT INTO Degree (name, level) VALUES (?, ?)',
      [name.trim(), level]
    );

    res.status(201).json({ message: 'Degree added successfully', name: name.trim(), level });

  } catch (err) {
    console.error(err);
    
    // Handle duplicate entry error (MySQL error code 1062)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Duplicate entry: This degree already exists.' });
    }
    
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET ALL COURSES
// ----------------------
app.get('/api/courses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Course;');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   ADD A NEW COURSE
// ----------------------
app.post('/api/courses', async (req, res) => {
  try {
    const { course_no, course_name } = req.body;

    // Server-side validation
    if (!course_no || !course_no.trim()) {
      return res.status(400).json({ error: 'Course number is required.' });
    }

    if (!course_name || !course_name.trim()) {
      return res.status(400).json({ error: 'Course name is required.' });
    }

    // Validate course number format: 2-4 letters + 4 digits
    const courseNoPattern = /^[A-Za-z]{2,4}[0-9]{4}$/;
    if (!courseNoPattern.test(course_no.trim())) {
      return res.status(400).json({ error: 'Course number must be 2-4 letters followed by 4 digits (e.g., CS5330).' });
    }

    // Insert into database
    await pool.query(
      'INSERT INTO Course (course_no, course_name) VALUES (?, ?)',
      [course_no.trim().toUpperCase(), course_name.trim()]
    );

    res.status(201).json({ 
      message: 'Course added successfully', 
      course_no: course_no.trim().toUpperCase(), 
      course_name: course_name.trim() 
    });

  } catch (err) {
    console.error(err);
    
    // Handle duplicate entry errors
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('course_no') || err.message.includes('PRIMARY')) {
        return res.status(409).json({ error: 'A course with this course number already exists.' });
      }
      if (err.message.includes('course_name')) {
        return res.status(409).json({ error: 'A course with this name already exists.' });
      }
      return res.status(409).json({ error: 'Duplicate entry: This course already exists.' });
    }
    
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET ALL SECTIONS
// ----------------------
app.get('/api/sections', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Section ORDER BY year DESC, term, course_no, section_no;');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   ADD A NEW SECTION
// ----------------------
app.post('/api/sections', async (req, res) => {
  try {
    const { course_no, section_no, term, year, student_count } = req.body;

    // Server-side validation
    if (!course_no) {
      return res.status(400).json({ error: 'Course is required.' });
    }

    if (!section_no) {
      return res.status(400).json({ error: 'Section number is required.' });
    }

    if (!term) {
      return res.status(400).json({ error: 'Term is required.' });
    }

    if (!year) {
      return res.status(400).json({ error: 'Year is required.' });
    }

    if (!student_count || student_count < 1) {
      return res.status(400).json({ error: 'Student count must be at least 1.' });
    }

    if (student_count > 500) {
      return res.status(400).json({ error: 'Student count cannot exceed 500.' });
    }

    // Check if course exists
    const [courseCheck] = await pool.query('SELECT course_no FROM Course WHERE course_no = ?', [course_no]);
    if (courseCheck.length === 0) {
      return res.status(400).json({ error: 'Selected course does not exist.' });
    }

    // Check if semester exists
    const [semesterCheck] = await pool.query('SELECT term FROM Semester WHERE term = ? AND year = ?', [term, year]);
    if (semesterCheck.length === 0) {
      return res.status(400).json({ error: 'Selected semester does not exist.' });
    }

    // Insert into database
    await pool.query(
      'INSERT INTO Section (course_no, section_no, term, year, student_count) VALUES (?, ?, ?, ?, ?)',
      [course_no, section_no, term, year, student_count]
    );

    res.status(201).json({ 
      message: 'Section added successfully', 
      course_no,
      section_no,
      term,
      year,
      student_count
    });

  } catch (err) {
    console.error(err);
    
    // Handle duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This section already exists for this course and semester.' });
    }

    // Handle foreign key errors
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ error: 'Invalid course or semester reference.' });
    }
    
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET ALL SEMESTERS
// ----------------------
app.get('/api/semesters', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Semester ORDER BY year DESC, FIELD(term, "Fall", "Summer", "Spring");');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   ADD A NEW SEMESTER
// ----------------------
app.post('/api/semesters', async (req, res) => {
  try {
    const { term, year } = req.body;

    // Server-side validation
    if (!term) {
      return res.status(400).json({ error: 'Term is required.' });
    }

    // Valid terms (NO Winter!)
    const validTerms = ['Fall', 'Spring', 'Summer'];
    if (!validTerms.includes(term)) {
      return res.status(400).json({ error: `Invalid term. Must be one of: ${validTerms.join(', ')}` });
    }

    if (!year) {
      return res.status(400).json({ error: 'Year is required.' });
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return res.status(400).json({ error: 'Year must be between 1900 and 2100.' });
    }

    // Insert into database
    await pool.query(
      'INSERT INTO Semester (term, year) VALUES (?, ?)',
      [term, yearNum]
    );

    res.status(201).json({ 
      message: 'Semester added successfully', 
      term: term,
      year: yearNum
    });

  } catch (err) {
    console.error(err);
    
    // Handle duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This semester already exists.' });
    }
    
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET ALL INSTRUCTORS
// ----------------------
app.get('/api/instructors', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Instructor;');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   ADD A NEW INSTRUCTOR
// ----------------------
app.post('/api/instructors', async (req, res) => {
  try {
    const { instructor_name } = req.body;

    // Server-side validation
    if (!instructor_name || !instructor_name.trim()) {
      return res.status(400).json({ error: 'Instructor name is required.' });
    }

    // Insert into database (instructor_id is auto-generated)
    const [result] = await pool.query(
      'INSERT INTO Instructor (instructor_name) VALUES (?)',
      [instructor_name.trim()]
    );

    res.status(201).json({ 
      message: 'Instructor added successfully', 
      instructor_id: result.insertId,
      instructor_name: instructor_name.trim()
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET ALL LEARNING OBJECTIVES
// ----------------------
app.get('/api/objectives', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM LearningObjective;');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   ADD A NEW LEARNING OBJECTIVE
// ----------------------
app.post('/api/objectives', async (req, res) => {
  try {
    const { code, title, description } = req.body;

    // Server-side validation
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Objective code is required.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    if (title.trim().length > 120) {
      return res.status(400).json({ error: 'Title must be 120 characters or less.' });
    }

    // Insert into database
    await pool.query(
      'INSERT INTO LearningObjective (code, title, description) VALUES (?, ?, ?)',
      [code.trim().toUpperCase(), title.trim(), description || null]
    );

    res.status(201).json({ 
      message: 'Learning objective added successfully', 
      code: code.trim().toUpperCase(), 
      title: title.trim() 
    });

  } catch (err) {
    console.error(err);
    
    // Handle duplicate entry errors
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('code') || err.message.includes('PRIMARY')) {
        return res.status(409).json({ error: 'A learning objective with this code already exists.' });
      }
      if (err.message.includes('title')) {
        return res.status(409).json({ error: 'A learning objective with this title already exists.' });
      }
      return res.status(409).json({ error: 'Duplicate entry: This learning objective already exists.' });
    }
    
    res.status(500).json({ error: 'Database error' });
  }
});

// =====================================================
//   DEGREE OBJECTIVES (which objectives belong to which degree)
// =====================================================

// ----------------------
//   GET DEGREE OBJECTIVES
// ----------------------
app.get('/api/degree-objectives', async (req, res) => {
  try {
    const { degree_name, degree_level } = req.query;
    
    let query, params;
    if (degree_name && degree_level) {
      // Get objectives for a specific degree
      query = `
        SELECT do.degree_name, do.degree_level, do.objective_code, lo.title, lo.description
        FROM DegreeObjective do
        JOIN LearningObjective lo ON do.objective_code = lo.code
        WHERE do.degree_name = ? AND do.degree_level = ?
        ORDER BY do.objective_code
      `;
      params = [degree_name, degree_level];
    } else {
      // Get all degree objectives
      query = `
        SELECT do.degree_name, do.degree_level, do.objective_code, lo.title as objective_title
        FROM DegreeObjective do
        JOIN LearningObjective lo ON do.objective_code = lo.code
        ORDER BY do.degree_name, do.degree_level, do.objective_code
      `;
      params = [];
    }
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   ADD DEGREE OBJECTIVES (batch - used when creating/editing degree)
// ----------------------
app.post('/api/degree-objectives', async (req, res) => {
  try {
    const { degree_name, degree_level, objective_codes } = req.body;

    if (!degree_name || !degree_level) {
      return res.status(400).json({ error: 'Degree is required.' });
    }

    if (!objective_codes || !Array.isArray(objective_codes)) {
      return res.status(400).json({ error: 'Objective codes must be an array.' });
    }

    // Check if degree exists
    const [degreeCheck] = await pool.query(
      'SELECT name FROM Degree WHERE name = ? AND level = ?', 
      [degree_name, degree_level]
    );
    if (degreeCheck.length === 0) {
      return res.status(400).json({ error: 'Degree does not exist.' });
    }

    // Delete existing objectives for this degree (to replace with new selection)
    await pool.query(
      'DELETE FROM DegreeObjective WHERE degree_name = ? AND degree_level = ?',
      [degree_name, degree_level]
    );

    // Insert new objectives
    let added = 0;
    for (const code of objective_codes) {
      try {
        await pool.query(
          'INSERT INTO DegreeObjective (degree_name, degree_level, objective_code) VALUES (?, ?, ?)',
          [degree_name, degree_level, code]
        );
        added++;
      } catch (insertErr) {
        // Skip invalid codes silently
        console.error('Could not add objective:', code, insertErr.message);
      }
    }

    res.status(201).json({ 
      message: `${added} objective(s) assigned to degree.`,
      added
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   DELETE A DEGREE OBJECTIVE
// ----------------------
app.delete('/api/degree-objectives/:degree_name/:degree_level/:objective_code', async (req, res) => {
  try {
    const { degree_name, degree_level, objective_code } = req.params;
    const [result] = await pool.query(
      'DELETE FROM DegreeObjective WHERE degree_name = ? AND degree_level = ? AND objective_code = ?',
      [decodeURIComponent(degree_name), decodeURIComponent(degree_level), decodeURIComponent(objective_code)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Degree objective not found.' });
    }
    res.json({ message: 'Degree objective removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   ADD A COURSE OBJECTIVE LINK
// ----------------------
app.post('/api/course-objectives', async (req, res) => {
  try {
    const { course_no, objective_code } = req.body;

    // Server-side validation
    if (!course_no) {
      return res.status(400).json({ error: 'Course is required.' });
    }

    if (!objective_code) {
      return res.status(400).json({ error: 'Learning objective is required.' });
    }

    // Check if course exists
    const [courseCheck] = await pool.query('SELECT course_no FROM Course WHERE course_no = ?', [course_no]);
    if (courseCheck.length === 0) {
      return res.status(400).json({ error: 'Selected course does not exist.' });
    }

    // Check if objective exists
    const [objectiveCheck] = await pool.query('SELECT code FROM LearningObjective WHERE code = ?', [objective_code]);
    if (objectiveCheck.length === 0) {
      return res.status(400).json({ error: 'Selected learning objective does not exist.' });
    }

    // Insert into database
    await pool.query(
      'INSERT INTO CourseObjective (course_no, objective_code) VALUES (?, ?)',
      [course_no, objective_code]
    );

    res.status(201).json({ 
      message: 'Course linked to objective successfully', 
      course_no,
      objective_code
    });

  } catch (err) {
    console.error(err);
    
    // Handle duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This course is already linked to this objective.' });
    }

    // Handle foreign key errors
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ error: 'Invalid course or objective reference.' });
    }
    
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET ALL DEGREE COURSES
// ----------------------
app.get('/api/degree-courses', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT dc.degree_name, dc.degree_level, dc.course_no, c.course_name, dc.is_core
      FROM DegreeCourse dc
      JOIN Course c ON dc.course_no = c.course_no
      ORDER BY dc.degree_name, dc.degree_level, dc.is_core DESC, dc.course_no
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   ADD A DEGREE COURSE LINK
// ----------------------
app.post('/api/degree-courses', async (req, res) => {
  try {
    const { degree_name, degree_level, course_no, is_core } = req.body;

    // Server-side validation
    if (!degree_name || !degree_level) {
      return res.status(400).json({ error: 'Degree is required.' });
    }

    if (!course_no) {
      return res.status(400).json({ error: 'Course is required.' });
    }

    // Check if degree exists
    const [degreeCheck] = await pool.query(
      'SELECT name FROM Degree WHERE name = ? AND level = ?', 
      [degree_name, degree_level]
    );
    if (degreeCheck.length === 0) {
      return res.status(400).json({ error: 'Selected degree does not exist.' });
    }

    // Check if course exists
    const [courseCheck] = await pool.query('SELECT course_no FROM Course WHERE course_no = ?', [course_no]);
    if (courseCheck.length === 0) {
      return res.status(400).json({ error: 'Selected course does not exist.' });
    }

    // Insert into database
    await pool.query(
      'INSERT INTO DegreeCourse (degree_name, degree_level, course_no, is_core) VALUES (?, ?, ?, ?)',
      [degree_name, degree_level, course_no, is_core ? 1 : 0]
    );

    res.status(201).json({ 
      message: 'Degree linked to course successfully', 
      degree_name,
      degree_level,
      course_no,
      is_core
    });

  } catch (err) {
    console.error(err);
    
    // Handle duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This course is already linked to this degree.' });
    }

    // Handle foreign key errors
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ error: 'Invalid degree or course reference.' });
    }
    
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET DEGREE DETAILS (courses, sections, objectives)
// ----------------------
app.get('/api/degrees/:name/:level/details', async (req, res) => {
  try {
    const { name, level } = req.params;
    
    // Get courses for this degree (with is_core flag)
    const [courses] = await pool.query(`
      SELECT dc.course_no, c.course_name, dc.is_core
      FROM DegreeCourse dc
      JOIN Course c ON dc.course_no = c.course_no
      WHERE dc.degree_name = ? AND dc.degree_level = ?
      ORDER BY dc.is_core DESC, dc.course_no
    `, [name, level]);
    
    // Get sections for courses in this degree
    const [sections] = await pool.query(`
      SELECT s.course_no, s.section_no, s.term, s.year, s.student_count
      FROM Section s
      JOIN DegreeCourse dc ON s.course_no = dc.course_no
      WHERE dc.degree_name = ? AND dc.degree_level = ?
      ORDER BY s.year DESC, s.term, s.course_no, s.section_no
    `, [name, level]);
    
    // Get learning objectives for courses in this degree
    const [objectives] = await pool.query(`
      SELECT DISTINCT co.course_no, co.objective_code, lo.title
      FROM CourseObjective co
      JOIN LearningObjective lo ON co.objective_code = lo.code
      JOIN DegreeCourse dc ON co.course_no = dc.course_no
      WHERE dc.degree_name = ? AND dc.degree_level = ?
      ORDER BY co.course_no, co.objective_code
    `, [name, level]);
    
    res.json({ courses, sections, objectives });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET COURSE DETAILS (sections, objectives, degrees)
// ----------------------
app.get('/api/courses/:course_no/details', async (req, res) => {
  try {
    const { course_no } = req.params;
    
    // Get all sections with instructor info
    const [sections] = await pool.query(`
      SELECT s.section_no, s.term, s.year, s.student_count, i.instructor_name
      FROM Section s
      LEFT JOIN Teaches t ON s.course_no = t.course_no 
        AND s.section_no = t.section_no 
        AND s.term = t.term 
        AND s.year = t.year
      LEFT JOIN Instructor i ON t.instructor_id = i.instructor_id
      WHERE s.course_no = ?
      ORDER BY s.year DESC, s.term, s.section_no
    `, [course_no]);
    
    // Get learning objectives for this course
    const [objectives] = await pool.query(`
      SELECT co.objective_code, lo.title
      FROM CourseObjective co
      JOIN LearningObjective lo ON co.objective_code = lo.code
      WHERE co.course_no = ?
      ORDER BY co.objective_code
    `, [course_no]);
    
    // Get degrees that use this course
    const [degrees] = await pool.query(`
      SELECT degree_name, degree_level, is_core
      FROM DegreeCourse
      WHERE course_no = ?
      ORDER BY degree_name, degree_level
    `, [course_no]);
    
    res.json({ sections, objectives, degrees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET INSTRUCTOR DETAILS (sections taught)
// ----------------------
app.get('/api/instructors/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get all sections this instructor teaches
    const [sections] = await pool.query(`
      SELECT t.course_no, c.course_name, t.section_no, t.term, t.year, s.student_count
      FROM Teaches t
      JOIN Course c ON t.course_no = c.course_no
      JOIN Section s ON t.course_no = s.course_no 
        AND t.section_no = s.section_no 
        AND t.term = s.term 
        AND t.year = s.year
      WHERE t.instructor_id = ?
      ORDER BY t.year DESC, t.term, t.course_no
    `, [id]);
    
    res.json({ sections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET ALL TEACHES (instructor-section assignments)
// ----------------------
app.get('/api/teaches', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.instructor_id, i.instructor_name, t.course_no, c.course_name, 
             t.section_no, t.term, t.year
      FROM Teaches t
      JOIN Instructor i ON t.instructor_id = i.instructor_id
      JOIN Course c ON t.course_no = c.course_no
      ORDER BY t.year DESC, t.term, t.course_no, t.section_no
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   ADD A TEACHES RECORD (assign instructor to section)
// ----------------------
app.post('/api/teaches', async (req, res) => {
  try {
    const { instructor_id, course_no, section_no, term, year } = req.body;

    // Server-side validation
    if (!instructor_id) {
      return res.status(400).json({ error: 'Instructor is required.' });
    }
    if (!course_no || !section_no || !term || !year) {
      return res.status(400).json({ error: 'Section information is required.' });
    }

    // Check if instructor exists
    const [instCheck] = await pool.query('SELECT instructor_id FROM Instructor WHERE instructor_id = ?', [instructor_id]);
    if (instCheck.length === 0) {
      return res.status(400).json({ error: 'Selected instructor does not exist.' });
    }

    // Check if section exists
    const [secCheck] = await pool.query(
      'SELECT course_no FROM Section WHERE course_no = ? AND section_no = ? AND term = ? AND year = ?',
      [course_no, section_no, term, year]
    );
    if (secCheck.length === 0) {
      return res.status(400).json({ error: 'Selected section does not exist.' });
    }

    // Check if section already has an instructor (enforce one instructor per section)
    const [existingCheck] = await pool.query(
      'SELECT instructor_id FROM Teaches WHERE course_no = ? AND section_no = ? AND term = ? AND year = ?',
      [course_no, section_no, term, year]
    );
    if (existingCheck.length > 0) {
      return res.status(409).json({ error: 'This section already has an instructor assigned. Each section can only have one instructor.' });
    }

    // Insert into database
    await pool.query(
      'INSERT INTO Teaches (instructor_id, course_no, section_no, term, year) VALUES (?, ?, ?, ?, ?)',
      [instructor_id, course_no, section_no, term, year]
    );

    res.status(201).json({ 
      message: 'Instructor assigned to section successfully',
      instructor_id,
      course_no,
      section_no,
      term,
      year
    });

  } catch (err) {
    console.error(err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This instructor is already assigned to this section.' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ error: 'Invalid instructor or section reference.' });
    }
    
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET INSTRUCTOR SECTIONS (for evaluation form)
// ----------------------
app.get('/api/instructor-sections', async (req, res) => {
  try {
    const { degree_name, degree_level, term, year, instructor_id } = req.query;
    
    if (!degree_name || !degree_level || !term || !year || !instructor_id) {
      return res.status(400).json({ error: 'All parameters required.' });
    }

    // Get sections that:
    // 1. Are taught by this instructor (Teaches table)
    // 2. Are in this semester
    // 3. Belong to a course in this degree (DegreeCourse table)
    const [rows] = await pool.query(`
      SELECT DISTINCT s.course_no, s.section_no, s.term, s.year, s.student_count, c.course_name
      FROM Section s
      JOIN Course c ON s.course_no = c.course_no
      JOIN DegreeCourse dc ON s.course_no = dc.course_no
        AND dc.degree_name = ? AND dc.degree_level = ?
      JOIN Teaches t ON s.course_no = t.course_no
        AND s.section_no = t.section_no
        AND s.term = t.term
        AND s.year = t.year
        AND t.instructor_id = ?
      WHERE s.term = ? AND s.year = ?
      ORDER BY s.course_no, s.section_no
    `, [degree_name, degree_level, instructor_id, term, parseInt(year, 10)]);
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET OBJECTIVES FOR A SPECIFIC COURSE (for evaluation form)
// ----------------------
app.get('/api/course-objectives', async (req, res) => {
  try {
    const { course_no } = req.query;
    
    let query, params;
    if (course_no) {
      // Get objectives for specific course
      query = `
        SELECT co.course_no, co.objective_code, lo.title, lo.description
        FROM CourseObjective co
        JOIN LearningObjective lo ON co.objective_code = lo.code
        WHERE co.course_no = ?
        ORDER BY co.objective_code
      `;
      params = [course_no];
    } else {
      // Get all course objectives with joined data
      query = `
        SELECT co.course_no, c.course_name, co.objective_code, lo.title as objective_title
        FROM CourseObjective co
        JOIN Course c ON co.course_no = c.course_no
        JOIN LearningObjective lo ON co.objective_code = lo.code
        ORDER BY co.course_no, co.objective_code
      `;
      params = [];
    }
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET EVALUATIONS FOR A SPECIFIC SECTION (for evaluation form)
// ----------------------
app.get('/api/section-evaluations', async (req, res) => {
  try {
    const { degree_name, degree_level, course_no, section_no, term, year } = req.query;
    
    if (!degree_name || !degree_level || !course_no || !section_no || !term || !year) {
      return res.status(400).json({ error: 'All parameters required.' });
    }

    const [rows] = await pool.query(`
      SELECT * FROM Evaluation
      WHERE degree_name = ? AND degree_level = ?
        AND course_no = ? AND section_no = ?
        AND term = ? AND year = ?
    `, [degree_name, degree_level, course_no, section_no, term, parseInt(year, 10)]);
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET DEGREES FOR A SPECIFIC COURSE (for duplication feature)
// ----------------------
app.get('/api/course-degrees', async (req, res) => {
  try {
    const { course_no } = req.query;
    
    if (!course_no) {
      return res.status(400).json({ error: 'Course number required.' });
    }

    const [rows] = await pool.query(`
      SELECT degree_name, degree_level, is_core
      FROM DegreeCourse
      WHERE course_no = ?
      ORDER BY degree_name, degree_level
    `, [course_no]);
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   GET ALL EVALUATIONS
// ----------------------
app.get('/api/evaluations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Evaluation;');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   ADD A NEW EVALUATION
// ----------------------
app.post('/api/evaluations', async (req, res) => {
  try {
    const { 
      degree_name, degree_level, course_no, section_no, term, year,
      objective_code, eval_method, a_no, b_no, c_no, f_no, improvement_text,
      duplicate_to 
    } = req.body;

    // Server-side validation
    if (!degree_name || !degree_level) {
      return res.status(400).json({ error: 'Degree is required.' });
    }
    if (!course_no || !section_no || !term || !year) {
      return res.status(400).json({ error: 'Section information is required.' });
    }
    if (!objective_code) {
      return res.status(400).json({ error: 'Learning objective is required.' });
    }
    if (!eval_method) {
      return res.status(400).json({ error: 'Evaluation method is required.' });
    }
    if (a_no === undefined || b_no === undefined || c_no === undefined || f_no === undefined) {
      return res.status(400).json({ error: 'All grade counts are required.' });
    }
    if (a_no < 0 || b_no < 0 || c_no < 0 || f_no < 0) {
      return res.status(400).json({ error: 'Grade counts cannot be negative.' });
    }

    // Verify DegreeCourse exists
    const [dcCheck] = await pool.query(
      'SELECT 1 FROM DegreeCourse WHERE degree_name = ? AND degree_level = ? AND course_no = ?',
      [degree_name, degree_level, course_no]
    );
    if (dcCheck.length === 0) {
      return res.status(400).json({ error: 'This course is not associated with this degree.' });
    }

    // Verify Section exists
    const [secCheck] = await pool.query(
      'SELECT 1 FROM Section WHERE course_no = ? AND section_no = ? AND term = ? AND year = ?',
      [course_no, section_no, term, year]
    );
    if (secCheck.length === 0) {
      return res.status(400).json({ error: 'This section does not exist.' });
    }

    // Verify CourseObjective exists
    const [coCheck] = await pool.query(
      'SELECT 1 FROM CourseObjective WHERE course_no = ? AND objective_code = ?',
      [course_no, objective_code]
    );
    if (coCheck.length === 0) {
      return res.status(400).json({ error: 'This objective is not associated with this course.' });
    }

    // Insert the evaluation
    await pool.query(
      `INSERT INTO Evaluation 
       (degree_name, degree_level, course_no, section_no, term, year, objective_code, eval_method, a_no, b_no, c_no, f_no, improvement_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [degree_name, degree_level, course_no, section_no, term, year, objective_code, eval_method, a_no, b_no, c_no, f_no, improvement_text || null]
    );

    // Handle duplication to other degrees
    let duplicated = 0;
    if (duplicate_to && duplicate_to.length > 0) {
      for (const degKey of duplicate_to) {
        const [dn, dl] = degKey.split('|');
        // Check if DegreeCourse exists for this degree
        const [dupCheck] = await pool.query(
          'SELECT 1 FROM DegreeCourse WHERE degree_name = ? AND degree_level = ? AND course_no = ?',
          [dn, dl, course_no]
        );
        if (dupCheck.length > 0) {
          try {
            await pool.query(
              `INSERT INTO Evaluation 
               (degree_name, degree_level, course_no, section_no, term, year, objective_code, eval_method, a_no, b_no, c_no, f_no, improvement_text)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [dn, dl, course_no, section_no, term, year, objective_code, eval_method, a_no, b_no, c_no, f_no, improvement_text || null]
            );
            duplicated++;
          } catch (dupErr) {
            // Ignore duplicate errors for other degrees
            if (dupErr.code !== 'ER_DUP_ENTRY') throw dupErr;
          }
        }
      }
    }

    res.status(201).json({ 
      message: 'Evaluation added successfully',
      duplicated
    });

  } catch (err) {
    console.error(err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An evaluation for this degree, section, and objective already exists.' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ error: 'Invalid reference. Please check all selections.' });
    }
    
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   UPDATE AN EVALUATION
// ----------------------
app.put('/api/evaluations/update', async (req, res) => {
  try {
    const { 
      degree_name, degree_level, course_no, section_no, term, year,
      objective_code, eval_method, a_no, b_no, c_no, f_no, improvement_text
    } = req.body;

    // Validation
    if (!degree_name || !degree_level || !course_no || !section_no || !term || !year || !objective_code) {
      return res.status(400).json({ error: 'All key fields are required.' });
    }
    if (!eval_method) {
      return res.status(400).json({ error: 'Evaluation method is required.' });
    }
    if (a_no < 0 || b_no < 0 || c_no < 0 || f_no < 0) {
      return res.status(400).json({ error: 'Grade counts cannot be negative.' });
    }

    const [result] = await pool.query(
      `UPDATE Evaluation 
       SET eval_method = ?, a_no = ?, b_no = ?, c_no = ?, f_no = ?, improvement_text = ?
       WHERE degree_name = ? AND degree_level = ? AND course_no = ? AND section_no = ? AND term = ? AND year = ? AND objective_code = ?`,
      [eval_method, a_no, b_no, c_no, f_no, improvement_text || null, degree_name, degree_level, course_no, section_no, term, year, objective_code]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evaluation not found.' });
    }

    res.json({ message: 'Evaluation updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   QUERY: Evaluation Status by Section for a Semester
// ----------------------
app.get('/api/queries/evaluation-status', async (req, res) => {
  try {
    const { term, year } = req.query;
    
    if (!term || !year) {
      return res.status(400).json({ error: 'Term and year are required.' });
    }

    // Get all sections for this semester with their evaluation status
    const [sections] = await pool.query(`
      SELECT 
        s.course_no,
        c.course_name,
        s.section_no,
        s.student_count,
        i.instructor_name,
        (SELECT COUNT(DISTINCT co.objective_code) 
         FROM CourseObjective co 
         WHERE co.course_no = s.course_no) as total_objectives,
        (SELECT COUNT(DISTINCT e.objective_code) 
         FROM Evaluation e 
         WHERE e.course_no = s.course_no 
           AND e.section_no = s.section_no 
           AND e.term = s.term 
           AND e.year = s.year) as evaluations_entered,
        (SELECT COUNT(*) 
         FROM Evaluation e 
         WHERE e.course_no = s.course_no 
           AND e.section_no = s.section_no 
           AND e.term = s.term 
           AND e.year = s.year
           AND e.improvement_text IS NOT NULL 
           AND e.improvement_text != '') as improvement_count
      FROM Section s
      JOIN Course c ON s.course_no = c.course_no
      LEFT JOIN Teaches t ON s.course_no = t.course_no 
        AND s.section_no = t.section_no 
        AND s.term = t.term 
        AND s.year = t.year
      LEFT JOIN Instructor i ON t.instructor_id = i.instructor_id
      WHERE s.term = ? AND s.year = ?
      ORDER BY s.course_no, s.section_no
    `, [term, parseInt(year, 10)]);

    // Calculate status for each section
    const results = sections.map(sec => {
      let status;
      if (sec.total_objectives === 0) {
        status = 'Not Entered'; // No objectives linked to course
      } else if (sec.evaluations_entered === 0) {
        status = 'Not Entered';
      } else if (sec.evaluations_entered >= sec.total_objectives) {
        status = 'Complete';
      } else {
        status = 'Partial';
      }
      
      return {
        ...sec,
        status,
        has_improvement: sec.improvement_count > 0
      };
    });

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   QUERY: Sections Meeting Pass Rate Threshold
// ----------------------
app.get('/api/queries/pass-rate', async (req, res) => {
  try {
    const { term, year, percentage } = req.query;
    
    if (!term || !year || percentage === undefined) {
      return res.status(400).json({ error: 'Term, year, and percentage are required.' });
    }

    const pct = parseFloat(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ error: 'Percentage must be between 0 and 100.' });
    }

    // Get evaluations where non-F percentage meets threshold
    const [results] = await pool.query(`
      SELECT 
        e.course_no,
        e.section_no,
        e.degree_name,
        e.degree_level,
        e.objective_code,
        e.a_no,
        e.b_no,
        e.c_no,
        e.f_no,
        (e.a_no + e.b_no + e.c_no + e.f_no) as total_graded,
        (e.a_no + e.b_no + e.c_no) as non_f_count,
        CASE 
          WHEN (e.a_no + e.b_no + e.c_no + e.f_no) > 0 
          THEN ((e.a_no + e.b_no + e.c_no) * 100.0 / (e.a_no + e.b_no + e.c_no + e.f_no))
          ELSE 0 
        END as pass_rate
      FROM Evaluation e
      WHERE e.term = ? AND e.year = ?
      HAVING pass_rate >= ?
      ORDER BY pass_rate DESC, e.course_no, e.section_no
    `, [term, parseInt(year, 10), pct]);

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// =====================================================
//   DELETE ENDPOINTS
// =====================================================

// Helper function for user-friendly FK error messages
const getFKErrorMessage = (entityType) => {
  const messages = {
    'Degree': 'Cannot delete: This degree has courses or evaluations associated with it.',
    'Course': 'Cannot delete: This course has sections, objectives, or degree associations.',
    'Instructor': 'Cannot delete: This instructor is assigned to teach sections.',
    'LearningObjective': 'Cannot delete: This objective is linked to courses or evaluations.',
    'Semester': 'Cannot delete: This semester has sections associated with it.',
    'Section': 'Cannot delete: This section has instructor assignments or evaluations.',
    'CourseObjective': 'Cannot delete: This course-objective link is used in evaluations.',
    'DegreeCourse': 'Cannot delete: This degree-course link is used in evaluations.',
    'Teaches': 'Cannot delete: Evaluations exist for this instructor assignment.',
    'Evaluation': 'Evaluation deleted successfully.'
  };
  return messages[entityType] || 'Cannot delete: This record is referenced by other data.';
};

// ----------------------
//   DELETE A DEGREE
// ----------------------
app.delete('/api/degrees/:name/:level', async (req, res) => {
  try {
    const { name, level } = req.params;
    const [result] = await pool.query(
      'DELETE FROM Degree WHERE name = ? AND level = ?',
      [decodeURIComponent(name), decodeURIComponent(level)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Degree not found.' });
    }
    res.json({ message: 'Degree deleted successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ error: getFKErrorMessage('Degree') });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   DELETE A COURSE
// ----------------------
app.delete('/api/courses/:course_no', async (req, res) => {
  try {
    const { course_no } = req.params;
    const [result] = await pool.query(
      'DELETE FROM Course WHERE course_no = ?',
      [decodeURIComponent(course_no)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    res.json({ message: 'Course deleted successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ error: getFKErrorMessage('Course') });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   DELETE AN INSTRUCTOR
// ----------------------
app.delete('/api/instructors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      'DELETE FROM Instructor WHERE instructor_id = ?',
      [parseInt(id)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Instructor not found.' });
    }
    res.json({ message: 'Instructor deleted successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ error: getFKErrorMessage('Instructor') });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   DELETE A LEARNING OBJECTIVE
// ----------------------
app.delete('/api/objectives/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const [result] = await pool.query(
      'DELETE FROM LearningObjective WHERE code = ?',
      [decodeURIComponent(code)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Learning objective not found.' });
    }
    res.json({ message: 'Learning objective deleted successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ error: getFKErrorMessage('LearningObjective') });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   DELETE A SEMESTER
// ----------------------
app.delete('/api/semesters/:term/:year', async (req, res) => {
  try {
    const { term, year } = req.params;
    const [result] = await pool.query(
      'DELETE FROM Semester WHERE term = ? AND year = ?',
      [decodeURIComponent(term), parseInt(year)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Semester not found.' });
    }
    res.json({ message: 'Semester deleted successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ error: getFKErrorMessage('Semester') });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   DELETE A SECTION
// ----------------------
app.delete('/api/sections/:course_no/:section_no/:term/:year', async (req, res) => {
  try {
    const { course_no, section_no, term, year } = req.params;
    const [result] = await pool.query(
      'DELETE FROM Section WHERE course_no = ? AND section_no = ? AND term = ? AND year = ?',
      [decodeURIComponent(course_no), decodeURIComponent(section_no), decodeURIComponent(term), parseInt(year)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Section not found.' });
    }
    res.json({ message: 'Section deleted successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ error: getFKErrorMessage('Section') });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   DELETE A COURSE OBJECTIVE
// ----------------------
app.delete('/api/course-objectives/:course_no/:objective_code', async (req, res) => {
  try {
    const { course_no, objective_code } = req.params;
    const [result] = await pool.query(
      'DELETE FROM CourseObjective WHERE course_no = ? AND objective_code = ?',
      [decodeURIComponent(course_no), decodeURIComponent(objective_code)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Course objective link not found.' });
    }
    res.json({ message: 'Course objective link deleted successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ error: getFKErrorMessage('CourseObjective') });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   DELETE A DEGREE COURSE
// ----------------------
app.delete('/api/degree-courses/:degree_name/:degree_level/:course_no', async (req, res) => {
  try {
    const { degree_name, degree_level, course_no } = req.params;
    const [result] = await pool.query(
      'DELETE FROM DegreeCourse WHERE degree_name = ? AND degree_level = ? AND course_no = ?',
      [decodeURIComponent(degree_name), decodeURIComponent(degree_level), decodeURIComponent(course_no)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Degree course link not found.' });
    }
    res.json({ message: 'Degree course link deleted successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return res.status(409).json({ error: getFKErrorMessage('DegreeCourse') });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   DELETE A TEACHES RECORD (with evaluation check)
// ----------------------
app.delete('/api/teaches/:instructor_id/:course_no/:section_no/:term/:year', async (req, res) => {
  try {
    const { instructor_id, course_no, section_no, term, year } = req.params;
    const courseNoDecoded = decodeURIComponent(course_no);
    const sectionNoDecoded = decodeURIComponent(section_no);
    const termDecoded = decodeURIComponent(term);
    const yearParsed = parseInt(year);

    // Check if evaluations exist for this section
    // If so, don't allow deleting the instructor assignment
    const [evalCheck] = await pool.query(
      'SELECT COUNT(*) as count FROM Evaluation WHERE course_no = ? AND section_no = ? AND term = ? AND year = ?',
      [courseNoDecoded, sectionNoDecoded, termDecoded, yearParsed]
    );
    
    if (evalCheck[0].count > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete: Evaluations have been entered for this section. The instructor assignment must remain to maintain data integrity.' 
      });
    }

    const [result] = await pool.query(
      'DELETE FROM Teaches WHERE instructor_id = ? AND course_no = ? AND section_no = ? AND term = ? AND year = ?',
      [parseInt(instructor_id), courseNoDecoded, sectionNoDecoded, termDecoded, yearParsed]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Instructor assignment not found.' });
    }
    res.json({ message: 'Instructor assignment deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   DELETE AN EVALUATION
// ----------------------
app.delete('/api/evaluations/:degree_name/:degree_level/:course_no/:section_no/:term/:year/:objective_code', async (req, res) => {
  try {
    const { degree_name, degree_level, course_no, section_no, term, year, objective_code } = req.params;
    const [result] = await pool.query(
      `DELETE FROM Evaluation 
       WHERE degree_name = ? AND degree_level = ? AND course_no = ? AND section_no = ? 
       AND term = ? AND year = ? AND objective_code = ?`,
      [
        decodeURIComponent(degree_name), 
        decodeURIComponent(degree_level), 
        decodeURIComponent(course_no), 
        decodeURIComponent(section_no), 
        decodeURIComponent(term), 
        parseInt(year), 
        decodeURIComponent(objective_code)
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evaluation not found.' });
    }
    res.json({ message: 'Evaluation deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// =====================================================
//   UPDATE (PUT) ENDPOINTS
// =====================================================

// ----------------------
//   UPDATE AN INSTRUCTOR
// ----------------------
app.put('/api/instructors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { instructor_name } = req.body;

    if (!instructor_name || !instructor_name.trim()) {
      return res.status(400).json({ error: 'Instructor name is required.' });
    }

    const [result] = await pool.query(
      'UPDATE Instructor SET instructor_name = ? WHERE instructor_id = ?',
      [instructor_name.trim(), parseInt(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Instructor not found.' });
    }

    res.json({ message: 'Instructor updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   UPDATE A LEARNING OBJECTIVE
// ----------------------
app.put('/api/objectives/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const [result] = await pool.query(
      'UPDATE LearningObjective SET title = ?, description = ? WHERE code = ?',
      [title.trim(), description?.trim() || null, decodeURIComponent(code)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Learning objective not found.' });
    }

    res.json({ message: 'Learning objective updated successfully.' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A learning objective with this title already exists.' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   UPDATE A SECTION
// ----------------------
app.put('/api/sections/:course_no/:section_no/:term/:year', async (req, res) => {
  try {
    const { course_no, section_no, term, year } = req.params;
    const { student_count } = req.body;

    if (student_count === undefined || student_count === null) {
      return res.status(400).json({ error: 'Student count is required.' });
    }

    const count = parseInt(student_count);
    if (isNaN(count) || count < 0) {
      return res.status(400).json({ error: 'Student count must be a non-negative number.' });
    }

    const [result] = await pool.query(
      'UPDATE Section SET student_count = ? WHERE course_no = ? AND section_no = ? AND term = ? AND year = ?',
      [count, decodeURIComponent(course_no), decodeURIComponent(section_no), decodeURIComponent(term), parseInt(year)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Section not found.' });
    }

    res.json({ message: 'Section updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ----------------------
//   UPDATE AN EVALUATION
// ----------------------
app.put('/api/evaluations/update', async (req, res) => {
  try {
    const { 
      degree_name, degree_level, course_no, section_no, term, year,
      objective_code, eval_method, a_no, b_no, c_no, f_no, improvement_text,
      duplicate_to
    } = req.body;

    // Validation
    if (!degree_name || !degree_level || !course_no || !section_no || !term || !year || !objective_code) {
      return res.status(400).json({ error: 'All key fields are required.' });
    }

    if (!eval_method || !eval_method.trim()) {
      return res.status(400).json({ error: 'Evaluation method is required.' });
    }

    const grades = [a_no, b_no, c_no, f_no];
    for (const g of grades) {
      if (g === undefined || g === null) {
        return res.status(400).json({ error: 'All grade counts are required.' });
      }
      const num = parseInt(g);
      if (isNaN(num) || num < 0) {
        return res.status(400).json({ error: 'Grade counts must be non-negative numbers.' });
      }
    }

    const [result] = await pool.query(
      `UPDATE Evaluation 
       SET eval_method = ?, a_no = ?, b_no = ?, c_no = ?, f_no = ?, improvement_text = ?
       WHERE degree_name = ? AND degree_level = ? AND course_no = ? AND section_no = ? 
       AND term = ? AND year = ? AND objective_code = ?`,
      [
        eval_method.trim(), 
        parseInt(a_no), parseInt(b_no), parseInt(c_no), parseInt(f_no),
        improvement_text?.trim() || null,
        degree_name, degree_level, course_no, section_no, term, parseInt(year), objective_code
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evaluation not found.' });
    }

    // Handle duplication to other degrees
    let duplicated = 0;
    if (duplicate_to && duplicate_to.length > 0) {
      for (const degKey of duplicate_to) {
        const [dn, dl] = degKey.split('|');
        const [dupCheck] = await pool.query(
          'SELECT 1 FROM DegreeCourse WHERE degree_name = ? AND degree_level = ? AND course_no = ?',
          [dn, dl, course_no]
        );
        if (dupCheck.length > 0) {
          try {
            // Try to update existing, or insert new
            await pool.query(
              `INSERT INTO Evaluation 
               (degree_name, degree_level, course_no, section_no, term, year, objective_code, eval_method, a_no, b_no, c_no, f_no, improvement_text)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE 
               eval_method = VALUES(eval_method), a_no = VALUES(a_no), b_no = VALUES(b_no), 
               c_no = VALUES(c_no), f_no = VALUES(f_no), improvement_text = VALUES(improvement_text)`,
              [dn, dl, course_no, section_no, term, parseInt(year), objective_code, 
               eval_method.trim(), parseInt(a_no), parseInt(b_no), parseInt(c_no), parseInt(f_no), 
               improvement_text?.trim() || null]
            );
            duplicated++;
          } catch (dupErr) {
            console.error('Duplication error:', dupErr);
          }
        }
      }
    }

    res.json({ message: 'Evaluation updated successfully.', duplicated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 3) Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

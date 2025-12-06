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
    const [rows] = await pool.query('SELECT * FROM Section;');
    res.json(rows);
  } catch (err) {
    console.error(err);
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

// 3) Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

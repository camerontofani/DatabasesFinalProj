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

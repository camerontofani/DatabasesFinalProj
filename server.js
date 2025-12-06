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
  password: '',          //root password 
  database: 'assessment_db'
});

// 2) Simple test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 3) Example route: get all evaluations
app.get('/api/evaluations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Evaluation;');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 4) Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

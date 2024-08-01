const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

// Create a MySQL pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Commission Calculator API');
});

// API route to calculate commission
app.post('/api/calculate-commission', async (req, res) => {
  const { policyId, premiumAmount } = req.body;
  
  try {
    // Fetch the commission rate from the database
    const [rows] = await pool.query('SELECT rate FROM commission_rates WHERE id = ?', [1]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Commission rate not found' });
    }

    const rate = rows[0].rate;
    const commissionAmount = premiumAmount * rate;

    res.json({
      policyId,
      commissionAmount,
      rateUsed: rate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;

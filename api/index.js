const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

app.use(express.json());

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: {
        rejectUnauthorized: false
    }
});

app.get('/api/tenants', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT TenantID, Name FROM Tenant');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching tenants' });
    }
});

app.get('/api/coverage-types', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT DISTINCT CoverageType FROM Coverage_Item');
        res.json(rows.map(row => row.CoverageType));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching coverage types' });
    }
});

// ... (keep other existing endpoints) ...

module.exports = app;

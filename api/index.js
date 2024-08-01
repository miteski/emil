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

app.post('/api/agents', async (req, res) => {
    const { fullname, email, tenantId } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO Agent (Fullname, Email, TenantID) VALUES (?, ?, ?)',
            [fullname, email, tenantId]
        );
        res.status(201).json({ message: 'Agent added successfully', agentId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding agent' });
    }
});

module.exports = app;

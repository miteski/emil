const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const { parse } = require('csv-parse');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const upload = multer({ storage: multer.memoryStorage() });

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Fetch tenants
app.get('/api/tenants', async (req, res) => {
    try {
        console.log('Fetching tenants...');
        const [rows] = await pool.query('SELECT TenantID, Name FROM Tenant');
        console.log('Tenants fetched:', rows);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ error: 'Error fetching tenants', details: error.message });
    }
});

// Fetch agents
app.get('/api/agents', async (req, res) => {
    console.log('Fetching agents...');
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * pageSize;

    try {
        let query = `
            SELECT a.AgentID, a.Fullname, a.Email, t.Name AS TenantName
            FROM Agent a
            LEFT JOIN Tenant t ON a.TenantID = t.TenantID
            WHERE a.Fullname LIKE ? OR a.Email LIKE ?
            LIMIT ? OFFSET ?
        `;
        let countQuery = `
            SELECT COUNT(*) AS total
            FROM Agent a
            WHERE a.Fullname LIKE ? OR a.Email LIKE ?
        `;

        const searchParam = `%${search}%`;
        const [agents] = await pool.query(query, [searc

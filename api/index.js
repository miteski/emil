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

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Fetch tenants
app.get('/api/tenants', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT TenantID, Name FROM Tenant');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ error: 'Error fetching tenants', details: error.message });
    }
});

// Fetch coverage types
app.get('/api/coverage-types', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT DISTINCT CoverageType FROM Coverage_Item');
        res.json(rows.map(row => row.CoverageType));
    } catch (error) {
        console.error('Error fetching coverage types:', error);
        res.status(500).json({ error: 'Error fetching coverage types', details: error.message });
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
            JOIN Tenant t ON a.TenantID = t.TenantID
            WHERE a.Fullname LIKE ? OR a.Email LIKE ?
            LIMIT ? OFFSET ?
        `;
        let countQuery = `
            SELECT COUNT(*) AS total
            FROM Agent a
            WHERE a.Fullname LIKE ? OR a.Email LIKE ?
        `;

        const searchParam = `%${search}%`;
        const [agents] = await pool.query(query, [searchParam, searchParam, pageSize, offset]);
        const [countResult] = await pool.query(countQuery, [searchParam, searchParam]);

        const totalAgents = countResult[0].total;
        const totalPages = Math.ceil(totalAgents / pageSize);

        console.log('Agents fetched:', agents);
        res.json({
            agents,
            currentPage: page,
            totalPages,
            totalAgents
        });
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ error: 'Error fetching agents', details: error.message });
    }
});

// Add new agent
app.post('/api/agents', async (req, res) => {
    const { fullname, email, tenantId, bankName, iban, bic, accountHolderName, paymentMethod, commissionRates } = req.body;
    
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Insert payment details
        const [paymentResult] = await conn.query(
            'INSERT INTO Agent_Payment_Details (BankName, IBAN, BIC, AccountHolderName, PaymentMethod) VALUES (?, ?, ?, ?, ?)',
            [bankName, iban, bic, accountHolderName, paymentMethod]
        );
        const paymentDetailsId = paymentResult.insertId;

        // Insert agent
        const [agentResult] = await conn.query(
            'INSERT INTO Agent (Fullname, Email, TenantID, Agent_Payment_Details_ID) VALUES (?, ?, ?, ?)',
            [fullname, email, tenantId, paymentDetailsId]
        );
        const agentId = agentResult.insertId;

        // Insert commission rates
        for (const [coverageType, rate] of Object.entries(commissionRates)) {
            await conn.query(
                'INSERT INTO Agent_Coverage_Commission (AgentID, CoverageType, CommissionPercentage, StartDate) VALUES (?, ?, ?, CURDATE())',
                [agentId, coverageType, rate]
            );
        }

        await conn.commit();
        res.status(201).json({ message: 'Agent added successfully', agentId: agentId });
    } catch (error) {
        await conn.rollback();
        console.error('Error adding agent:', error);
        res.status(500).json({ error: 'Error adding agent', details: error.message });
    } finally {
        conn.release();
    }
});

module.exports = app;

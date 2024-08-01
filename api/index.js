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
        console.error(error);
        res.status(500).json({ error: 'Error adding agent' });
    } finally {
        conn.release();
    }
});

module.exports = app;

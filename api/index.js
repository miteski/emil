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
    ssl: {
        rejectUnauthorized: false
    }
});

const upload = multer({ storage: multer.memoryStorage() });

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

// CSV upload, virus scan, parse, and store endpoint
app.post('/api/upload-csv', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Virus scan
        const scanResult = await virusScan(req.file.buffer);
        if (!scanResult.isClean) {
            return res.status(400).json({ error: 'File may be infected with a virus' });
        }

        // Parse CSV
        const { headers, rows } = await parseCSV(req.file.buffer);

        // Store in database
        await storeCSVData(req.file.originalname, headers, rows);

        res.json({ message: 'File uploaded, scanned, and stored successfully', headers, rows });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'Error processing file', details: error.message });
    }
});

// Test virus scan endpoint
app.get('/api/test-virus-scan/:hash', async (req, res) => {
    try {
        const result = await virusScan(Buffer.from('test'), req.params.hash);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function virusScan(fileBuffer, testHash = null) {
    const hash = testHash || crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    try {
        const response = await axios.get(`https://www.virustotal.com/api/v3/files/${hash}`, {
            headers: {
                'x-apikey': process.env.VIRUSTOTAL_API_KEY
            }
        });

        const stats = response.data.data.attributes.last_analysis_stats;
        const isClean = stats.malicious === 0 && stats.suspicious === 0;

        return { isClean, hash };
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // File not previously scanned, consider it clean
            return { isClean: true, hash };
        }
        console.error('Virus scan error:', error);
        throw new Error('Virus scan failed');
    }
}

async function parseCSV(csvBuffer) {
    return new Promise((resolve, reject) => {
        parse(csvBuffer.toString(), {
            columns: true,
            skip_empty_lines: true
        }, (err, records) => {
            if (err) {
                reject(err);
            } else {
                const headers = Object.keys(records[0]);
                const rows = records.map(record => Object.values(record));
                resolve({ headers, rows });
            }
        });
    });
}

async function storeCSVData(filename, headers, rows) {
    const data = JSON.stringify({ headers, rows });
    const query = 'INSERT INTO csv_uploads (filename, data) VALUES (?, ?)';
    await pool.query(query, [filename, data]);
}

module.exports = app;

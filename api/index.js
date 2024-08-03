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

// API Routes
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

app.get('/api/tenants', getTenants);
app.get('/api/agents', getAgents);
app.post('/api/agents', addAgent);
app.post('/api/payment-details', addPaymentDetails);
app.post('/api/upload-csv', upload.single('file'), uploadCSV);

// Route Handlers
async function getTenants(req, res) {
    try {
        console.log('Fetching tenants...');
        const [rows] = await pool.query('SELECT TenantID, Name FROM Tenant');
        console.log('Tenants fetched:', rows);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ error: 'Error fetching tenants', details: error.message });
    }
}

async function getAgents(req, res) {
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
}

async function addAgent(req, res) {
    const { fullname, email, tenantId } = req.body;
    
    try {
        const [result] = await pool.query(
            'INSERT INTO Agent (Fullname, Email, TenantID) VALUES (?, ?, ?)',
            [fullname, email, tenantId]
        );
        const agentId = result.insertId;

        res.status(201).json({ message: 'Agent added successfully', agentId: agentId });
    } catch (error) {
        console.error('Error adding agent:', error);
        res.status(500).json({ error: 'Error adding agent', details: error.message });
    }
}

async function addPaymentDetails(req, res) {
    const { agentId, bankName, iban, bic, accountHolderName, paymentMethod } = req.body;
    
    try {
        const [result] = await pool.query(
            'INSERT INTO Agent_Payment_Details (BankName, IBAN, BIC, AccountHolderName, PaymentMethod) VALUES (?, ?, ?, ?, ?)',
            [bankName, iban, bic, accountHolderName, paymentMethod]
        );
        const paymentDetailsId = result.insertId;

        await pool.query(
            'UPDATE Agent SET Agent_Payment_Details_ID = ? WHERE AgentID = ?',
            [paymentDetailsId, agentId]
        );

        res.status(201).json({ message: 'Payment details added successfully', paymentDetailsId: paymentDetailsId });
    } catch (error) {
        console.error('Error adding payment details:', error);
        res.status(500).json({ error: 'Error adding payment details', details: error.message });
    }
}

async function uploadCSV(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const scanResult = await virusScan(req.file.buffer);
        if (!scanResult.isClean) {
            return res.status(400).json({ error: 'File may be infected with a virus' });
        }

        const { headers, rows } = await parseCSV(req.file.buffer);

        res.json({ message: 'File uploaded, scanned, and parsed successfully', headers, rows });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'Error processing file', details: error.message });
    }
}

// Helper Functions
async function virusScan(fileBuffer) {
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
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
            return { isClean: true, hash };
        }
        console.error('Virus scan error:', error);
        throw new Error('Virus scan failed');
    }
}

function parseCSV(csvBuffer) {
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

// Debugging Information
console.log('Environment Variables:');
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('MYSQL_USER:', process.env.MYSQL_USER);
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE);
console.log('VIRUSTOTAL_API_KEY:', process.env.VIRUSTOTAL_API_KEY ? 'Set' : 'Not Set');

module.exports = app;

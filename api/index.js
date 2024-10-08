require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const { parse } = require('csv-parse');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { login, logout, authenticateSession, register, verifyToken } = require('./auth');
const { generatePDF } = require('./generate-pdf');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(cors());

// Set up SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.get('/api/test-email/:agentId', authenticateSession, async (req, res) => {
    try {
        const agentId = req.params.agentId;
        
        // Fetch agent details
        const [agents] = await pool.query('SELECT * FROM Agent WHERE AgentID = ?', [agentId]);
        
        if (agents.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        const agent = agents[0];
        
        if (!agent.Email) {
            return res.status(400).json({ error: 'There is no email for this agent, please set an email before sending a test email' });
        }

        const testPdfBuffer = Buffer.from('This is a test PDF content');

        const msg = {
            to: agent.Email,
            from: process.env.SENDGRID_VERIFIED_SENDER,
            subject: 'Test Email from Insurance Management System',
            text: `This is a test email for agent ${agent.Fullname} from the insurance management system.`,
            attachments: [
                {
                    content: testPdfBuffer.toString('base64'),
                    filename: 'test.pdf',
                    type: 'application/pdf',
                    disposition: 'attachment'
                }
            ]
        };

        await sgMail.send(msg);
        res.json({ message: 'Test email sent successfully', sentTo: agent.Email });
    } catch (error) {
        console.error('Error sending test email:', error);
        let errorDetails = error.message;
        if (error.response) {
            console.error(error.response.body);
            errorDetails = JSON.stringify(error.response.body);
        }
        res.status(500).json({ error: 'Failed to send test email', details: errorDetails });
    }
});

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log("Database connected successfully");
        connection.release();
    })
    .catch(error => {
        console.error("Database connection failed:", error);
    });

const upload = multer({ storage: multer.memoryStorage() });

// Authentication routes
app.post('/api/login', login);
app.post('/api/logout', logout);
app.post('/api/register', register);

app.get('/api/protected', authenticateSession, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

app.get('/api/check-auth', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  // Bearer TOKEN
    if (!token) {
        return res.json({ isAuthenticated: false });
    }
    const payload = verifyToken(token);
    if (!payload) {
        return res.json({ isAuthenticated: false });
    }
    res.json({ isAuthenticated: true, user: payload });
});

// API Routes
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

app.get('/api/tenants', getTenants);
app.get('/api/agents', authenticateSession, getAgents);
app.post('/api/agents', authenticateSession, addAgent);
app.get('/api/agents/:id', authenticateSession, getAgent);
app.put('/api/agents/:id', authenticateSession, updateAgent);
app.delete('/api/agents/:id', authenticateSession, deleteAgent);
app.post('/api/agents/bulk-delete', authenticateSession, bulkDeleteAgents);
app.get('/api/agents/:id/banking-info', authenticateSession, getBankingInfo);
app.put('/api/agents/:id/banking-info', authenticateSession, updateBankingInfo);
app.get('/api/agents/:id/commission-rules', authenticateSession, getCommissionRules);
app.put('/api/agents/:id/commission-rules', authenticateSession, updateCommissionRules);
app.get('/api/coverages', authenticateSession, getCoverages);
app.post('/api/upload-csv', authenticateSession, upload.single('file'), uploadCSV);

// New route for sending commission statement
app.post('/api/send-commission-statement/:agentId', authenticateSession, async (req, res) => {
    const agentId = req.params.agentId;
    
    try {
        // Fetch agent details
        const [agent] = await pool.query('SELECT * FROM Agent WHERE AgentID = ?', [agentId]);
        
        if (agent.length === 0) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        if (!agent[0].Email) {
            return res.status(400).json({ error: 'There is no email for this user set, please set an email before triggering sending emails' });
        }
        
        // Generate PDF
        const statementData = await generateStatementData(agentId);
        const pdfBuffer = await generatePDF(statementData);
        
        // Send email
        await sendEmail(agent[0].Email, pdfBuffer);
        
        res.json({ message: 'Commission statement sent successfully' });
    } catch (error) {
        console.error('Error sending commission statement:', error);
        res.status(500).json({ error: 'Error sending commission statement', details: error.message });
    }
});

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
    console.log('Query params:', req.query);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * pageSize;

    try {
        let query = `
            SELECT a.AgentID, a.Fullname, a.Email, t.Name AS TenantName,
                   CASE WHEN apd.Agent_Payment_Details_ID IS NOT NULL THEN 1 ELSE 0 END AS hasBankingInfo,
                   CASE WHEN acc.Agent_Coverage_CommissionID IS NOT NULL THEN 1 ELSE 0 END AS hasCommissionRules
            FROM Agent a
            LEFT JOIN Tenant t ON a.TenantID = t.TenantID
            LEFT JOIN Agent_Payment_Details apd ON a.Agent_Payment_Details_ID = apd.Agent_Payment_Details_ID
            LEFT JOIN Agent_Coverage_Commission acc ON a.AgentID = acc.AgentID
            WHERE a.Fullname LIKE ? OR a.Email LIKE ?
            GROUP BY a.AgentID
            ORDER BY a.AgentID DESC  -- Add this line to sort by AgentID in descending order
            LIMIT ? OFFSET ?
        `;
        let countQuery = `
            SELECT COUNT(DISTINCT a.AgentID) AS total
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

async function getAgent(req, res) {
    const agentId = req.params.id;
    try {
        const [rows] = await pool.query('SELECT * FROM Agent WHERE AgentID = ?', [agentId]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Agent not found' });
        } else {
            res.json(rows[0]);
        }
    } catch (error) {
        console.error('Error fetching agent:', error);
        res.status(500).json({ error: 'Error fetching agent', details: error.message });
    }
}

async function updateAgent(req, res) {
    const agentId = req.params.id;
    const { fullname, email, tenantId } = req.body;
    try {
        await pool.query(
            'UPDATE Agent SET Fullname = ?, Email = ?, TenantID = ? WHERE AgentID = ?',
            [fullname, email, tenantId, agentId]
        );
        res.json({ message: 'Agent updated successfully' });
    } catch (error) {
        console.error('Error updating agent:', error);
        res.status(500).json({ error: 'Error updating agent', details: error.message });
    }
}

async function deleteAgent(req, res) {
    const agentId = req.params.id;
    try {
        await pool.query('DELETE FROM Agent WHERE AgentID = ?', [agentId]);
        res.json({ message: 'Agent deleted successfully' });
    } catch (error) {
        console.error('Error deleting agent:', error);
        res.status(500).json({ error: 'Error deleting agent', details: error.message });
    }
}

async function bulkDeleteAgents(req, res) {
    const { agentIds } = req.body;
    try {
        await pool.query('DELETE FROM Agent WHERE AgentID IN (?)', [agentIds]);
        res.json({ message: `${agentIds.length} agent(s) deleted successfully` });
    } catch (error) {
        console.error('Error deleting agents:', error);
        res.status(500).json({ error: 'Error deleting agents', details: error.message });
    }
}

async function getBankingInfo(req, res) {
    const agentId = req.params.id;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM Agent_Payment_Details WHERE Agent_Payment_Details_ID = (SELECT Agent_Payment_Details_ID FROM Agent WHERE AgentID = ?)',
            [agentId]
        );
        if (rows.length === 0) {
            res.json({}); // Return empty object if no banking info found
        } else {
            res.json(rows[0]);
        }
    } catch (error) {
        console.error('Error fetching banking info:', error);
        res.status(500).json({ error: 'Error fetching banking info', details: error.message });
    }
}

async function updateBankingInfo(req, res) {
    const agentId = req.params.id;
    const { bankName, iban, bic, accountHolderName, paymentMethod } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Check if banking info exists
        const [existingInfo] = await conn.query(
            'SELECT Agent_Payment_Details_ID FROM Agent WHERE AgentID = ?',
            [agentId]
        );

        if (existingInfo[0].Agent_Payment_Details_ID) {
            // Update existing banking info
            await conn.query(
                'UPDATE Agent_Payment_Details SET BankName = ?, IBAN = ?, BIC = ?, AccountHolderName = ?, PaymentMethod = ? WHERE Agent_Payment_Details_ID = ?',
                [bankName, iban, bic, accountHolderName, paymentMethod, existingInfo[0].Agent_Payment_Details_ID]
            );
        } else {
            // Insert new banking info
            const [result] = await conn.query(
                'INSERT INTO Agent_Payment_Details (BankName, IBAN, BIC, AccountHolderName, PaymentMethod) VALUES (?, ?, ?, ?, ?)',
                [bankName, iban, bic, accountHolderName, paymentMethod]
            );
            const newPaymentDetailsId = result.insertId;

            // Update agent with new payment details ID
            await conn.query(
                'UPDATE Agent SET Agent_Payment_Details_ID = ? WHERE AgentID = ?',
                [newPaymentDetailsId, agentId]
            );
        }

        await conn.commit();
        res.json({ message: 'Banking info updated successfully' });
    } catch (error) {
        await conn.rollback();
        console.error('Error updating banking info:', error);
        res.status(500).json({ error: 'Error updating banking info', details: error.message });
    } finally {
        conn.release();
    }
}

async function getCommissionRules(req, res) {
    const agentId = req.params.id;
    try {
        const [rows] = await pool.query(`
            SELECT acc.*, c.CoverageDescription
            FROM Agent_Coverage_Commission acc
            JOIN Coverages c ON acc.CoverageID = c.CoverageID
            WHERE acc.AgentID = ?
        `, [agentId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching commission rules:', error);
        res.status(500).json({ error: 'Error fetching commission rules', details: error.message });
    }
}

async function updateCommissionRules(req, res) {
    const agentId = req.params.id;
    const commissionRules = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Delete existing commission rules
        await conn.query('DELETE FROM Agent_Coverage_Commission WHERE AgentID = ?', [agentId]);

        // Insert new commission rules
        for (const rule of commissionRules) {
            await conn.query(`
                INSERT INTO Agent_Coverage_Commission 
                (AgentID, CoverageID, Premium_Commission_Percentage, Percentage_On_Installments, Percentage_In_Advance, StartDate, EndDate) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [agentId, rule.CoverageID, rule.Premium_Commission_Percentage, rule.Percentage_On_Installments, rule.Percentage_In_Advance, rule.StartDate, rule.EndDate]);
        }

        await conn.commit();
        res.json({ message: 'Commission rules updated successfully' });
    } catch (error) {
        await conn.rollback();
        console.error('Error updating commission rules:', error);
        res.status(500).json({ error: 'Error updating commission rules', details: error.message });
    } finally {
        conn.release();
    }
}

async function getCoverages(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM Coverages');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching coverages:', error);
        res.status(500).json({ error: 'Error fetching coverages', details: error.message });
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

async function generateStatementData(agentId) {
    // Fetch agent details
    const [agent] = await pool.query('SELECT * FROM Agent WHERE AgentID = ?', [agentId]);
    
    // Fetch commission rules
    const [commissionRules] = await pool.query(`
        SELECT acc.*, c.CoverageDescription
        FROM Agent_Coverage_Commission acc
        JOIN Coverages c ON acc.CoverageID = c.CoverageID
        WHERE acc.AgentID = ?
    `, [agentId]);
    
    // Define the date range for the statement (e.g., last month)
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
    
    // Fetch policies
    const [policies] = await pool.query(`
        SELECT * FROM Policies WHERE AgentID = ? AND PolicyDate BETWEEN ? AND ?
    `, [agentId, startDate, endDate]);
    
    // Calculate commissions
    const calculatedPolicies = policies.map(policy => {
        const rule = commissionRules.find(r => r.CoverageID === policy.CoverageID);
        const commission = policy.Premium * (rule.Premium_Commission_Percentage / 100);
        return {
            ...policy,
            commission
        };
    });
    
    const totalCommission = calculatedPolicies.reduce((sum, policy) => sum + policy.commission, 0);
    
    return {
        agentName: agent[0].Fullname,
        statementPeriod: `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
        policies: calculatedPolicies,
        totalCommission
    };
}

async function sendEmail(email, pdfBuffer) {
    const msg = {
        to: email,
        from: 'miteski.stefan@gmail.com', // Change to your verified sender
        subject: 'Your Monthly Commission Statement',
        text: 'Please find attached your monthly commission statement.',
        attachments: [
            {
                content: pdfBuffer.toString('base64'),
                filename: 'commission_statement.pdf',
                type: 'application/pdf',
                disposition: 'attachment'
            }
        ]
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        throw new Error('Failed to send email');
    }
}

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Handle view-agents.html route
app.get('/view-agents.html', (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token || !verifyToken(token)) {
        return res.redirect('/login.html?redirect=/view-agents.html');
    }
    next();
});

// Handle all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
        error: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;

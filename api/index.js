const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const { parse } = require('csv-parse');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// ... (keep your existing database connection code)

const upload = multer({ storage: multer.memoryStorage() });

// ... (keep your existing endpoints)

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

        return { isClean };
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // File not previously scanned, consider it clean
            return { isClean: true };
        }
        console.error('Virus scan error:', error);
        throw new Error('Virus scan failed');
    }
}

// ... (keep the parseCSV and storeCSVData functions as they were)

module.exports = app;

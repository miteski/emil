const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const { parse } = require('csv-parse');
const axios = require('axios');
const FormData = require('form-data');

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
            return res.status(400).json({ error: 'File is infected with a virus' });
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
    const form = new FormData();
    form.append('file', fileBuffer, { filename: 'scan_file' });

    try {
        const response = await axios.post('https://your-clamav-api-url/scan', form, {
            headers: form.getHeaders()
        });
        return { isClean: response.data.result === 'OK' };
    } catch (error) {
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

async function storeCSVData(filename, headers, rows) {
    const data = JSON.stringify({ headers, rows });
    const query = 'INSERT INTO csv_uploads (filename, data) VALUES (?, ?)';
    await pool.query(query, [filename, data]);
}

module.exports = app;

const crypto = require('crypto');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper function to hash passwords
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper function to generate a token
function generateToken(userId, role) {
    const payload = {
        userId: userId,
        role: role,
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Helper function to verify a token
function verifyToken(token) {
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }
        return payload;
    } catch (error) {
        return null;
    }
}

async function login(req, res) {
    console.log("Login attempt received");
    const { username, password } = req.body;
    console.log("Username:", username, "Password:", password ? "[REDACTED]" : "undefined");
    try {
        console.log("Querying database");
        const [users] = await pool.query('SELECT * FROM Users WHERE Username = ?', [username]);
        console.log("Query completed, users found:", users.length);
        if (users.length === 0) {
            console.log('No user found');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const user = users[0];

        const hashedPassword = hashPassword(password);
        console.log('Password comparison:', { 
            stored: user.PasswordHash.substring(0, 10) + '...', 
            provided: hashedPassword.substring(0, 10) + '...' 
        });
        if (hashedPassword !== user.PasswordHash) {
            console.log('Password mismatch');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user.UserID, user.Role);
        console.log('Generated token:', token.substring(0, 10) + '...');

        await pool.query('UPDATE Users SET LastLogin = CURRENT_TIMESTAMP WHERE UserID = ?', [user.UserID]);

        console.log('Login successful');
        res.json({ success: true, message: 'Login successful', token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred during login', 
            error: error.message,
            stack: error.stack
        });
    }
}

async function logout(req, res) {
    // Since we're not storing tokens server-side, logout is handled client-side
    // by removing the token. We'll just send a success response.
    res.json({ success: true, message: 'Logout successful' });
}

function authenticateSession(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const payload = verifyToken(token);
    if (!payload) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }

    req.user = payload;
    next();
}

async function register(req, res) {
    const { username, password, email, firstName, lastName, role } = req.body;
    try {
        const hashedPassword = hashPassword(password);
        const [result] = await pool.query(
            'INSERT INTO Users (Username, PasswordHash, Email, FirstName, LastName, Role) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, email, firstName, lastName, role]
        );
        res.status(201).json({ success: true, message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, message: 'Username or email already exists' });
        } else {
            res.status(500).json({ success: false, message: 'An error occurred during registration' });
        }
    }
}

module.exports = {
    login,
    logout,
    authenticateSession,
    register
};

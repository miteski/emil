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

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(userId, role) {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };
    const payload = {
        userId: userId,
        role: role,
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
    };
    const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET)
        .update(headerEncoded + '.' + payloadEncoded)
        .digest('base64url');
    return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

function verifyToken(token) {
    try {
        const [headerPart, payloadPart, signaturePart] = token.split('.');
        const payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString());
        
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        const verifySignature = crypto.createHmac('sha256', JWT_SECRET)
            .update(headerPart + '.' + payloadPart)
            .digest('base64url');

        if (signaturePart !== verifySignature) {
            return null;
        }

        return payload;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

async function login(req, res) {
    console.log("Login attempt received");
    const { username, password } = req.body;
    const redirectUrl = req.body.redirectUrl || '/view-agents.html';
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
        res.json({ success: true, message: 'Login successful', token, redirectUrl });
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
    res.json({ success: true, message: 'Logout successful' });
}

function authenticateSession(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const payload = verifyToken(token);
        if (!payload) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = payload;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ success: false, message: 'Token verification failed' });
    }
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
    register,
    verifyToken
};

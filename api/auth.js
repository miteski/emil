const crypto = require('crypto');

const sessions = {};

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function login(req, res) {
    const { username, password } = req.body;
    // This is still a mock authentication. 
    // In a real app, you'd check these credentials against your database.
    if (username === 'admin' && password === 'password') {
        const token = generateToken();
        sessions[token] = { username, loggedInAt: new Date() };
        res.json({ success: true, message: 'Login successful', token });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
}

function logout(req, res) {
    const token = req.headers['authorization'];
    if (token && sessions[token]) {
        delete sessions[token];
        res.json({ success: true, message: 'Logged out successfully' });
    } else {
        res.status(401).json({ success: false, message: 'No active session' });
    }
}

function authenticateSession(req, res, next) {
    const token = req.headers['authorization'];
    if (token && sessions[token]) {
        req.user = sessions[token];
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

module.exports = {
    login,
    logout,
    authenticateSession
};

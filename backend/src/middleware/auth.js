const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await db.query('SELECT id, name, email, role, is_active FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token. User not found.' });
    }

    if (!result.rows[0].is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to perform this action.' 
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };

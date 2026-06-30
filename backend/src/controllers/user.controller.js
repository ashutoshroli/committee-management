const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role, is_active, created_at',
      [name, email, hashedPassword, phone || null, role || 'manager']
    );

    res.status(201).json({ success: true, message: 'User created.', data: result.rows[0] });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, email, phone, role, is_active } = req.body;
    const result = await db.query(
      `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), 
       phone = COALESCE($3, phone), role = COALESCE($4, role), 
       is_active = COALESCE($5, is_active), updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 RETURNING id, name, email, phone, role, is_active`,
      [name, email, phone, role, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: 'User updated.', data: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: 'User deleted.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

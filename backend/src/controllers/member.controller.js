const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM members ORDER BY name ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM members WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Get member's active loans
    const loans = await db.query(
      'SELECT * FROM loans WHERE member_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );

    // Get member's instalment summary
    const instalments = await db.query(
      `SELECT status, COUNT(*) as count, SUM(amount) as total_amount, SUM(paid_amount) as total_paid 
       FROM instalments WHERE member_id = $1 GROUP BY status`,
      [req.params.id]
    );

    res.json({ 
      success: true, 
      data: {
        ...result.rows[0],
        loans: loans.rows,
        instalment_summary: instalments.rows
      }
    });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, email, address, committee_role, join_date } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    const result = await db.query(
      `INSERT INTO members (name, phone, email, address, committee_role, join_date) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, phone || null, email || null, address || null, committee_role || 'member', join_date || new Date()]
    );

    res.status(201).json({ success: true, message: 'Member added.', data: result.rows[0] });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, phone, email, address, committee_role, is_active } = req.body;
    
    const result = await db.query(
      `UPDATE members SET 
       name = COALESCE($1, name), phone = COALESCE($2, phone), 
       email = COALESCE($3, email), address = COALESCE($4, address), 
       committee_role = COALESCE($5, committee_role), is_active = COALESCE($6, is_active),
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 RETURNING *`,
      [name, phone, email, address, committee_role, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }
    res.json({ success: true, message: 'Member updated.', data: result.rows[0] });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.delete = async (req, res) => {
  try {
    // Check for active loans
    const activeLoans = await db.query(
      'SELECT id FROM loans WHERE member_id = $1 AND status = $2',
      [req.params.id, 'active']
    );

    if (activeLoans.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete member with active loans. Close loans first.' 
      });
    }

    const result = await db.query('DELETE FROM members WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }
    res.json({ success: true, message: 'Member deleted.' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const db = require('../config/db');

exports.get = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM committee_settings LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settings not found.' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, monthly_instalment, default_interest_rate, late_fine_per_day, late_fine_per_month, grace_period_days, payment_due_day } = req.body;

    const result = await db.query(
      `UPDATE committee_settings SET 
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       monthly_instalment = COALESCE($3, monthly_instalment),
       default_interest_rate = COALESCE($4, default_interest_rate),
       late_fine_per_day = COALESCE($5, late_fine_per_day),
       late_fine_per_month = COALESCE($6, late_fine_per_month),
       grace_period_days = COALESCE($7, grace_period_days),
       payment_due_day = COALESCE($8, payment_due_day),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = 1 RETURNING *`,
      [name, description, monthly_instalment, default_interest_rate, late_fine_per_day, late_fine_per_month, grace_period_days, payment_due_day]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settings not found.' });
    }

    res.json({ success: true, message: 'Settings updated.', data: result.rows[0] });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

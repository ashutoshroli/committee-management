const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { month, year, status } = req.query;
    let query = `SELECT i.*, m.name as member_name, m.phone as member_phone 
                 FROM instalments i JOIN members m ON i.member_id = m.id WHERE 1=1`;
    const params = [];

    if (month) {
      params.push(month);
      query += ` AND i.month = $${params.length}`;
    }
    if (year) {
      params.push(year);
      query += ` AND i.year = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND i.status = $${params.length}`;
    }

    query += ' ORDER BY i.due_date DESC, m.name ASC';

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get instalments error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getByMember = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM instalments WHERE member_id = $1 ORDER BY year DESC, month DESC`,
      [req.params.memberId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get member instalments error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.generateMonthly = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'month and year are required.' });
    }

    // Get committee settings
    const settings = await db.query('SELECT * FROM committee_settings LIMIT 1');
    if (settings.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Committee settings not configured.' });
    }

    const { monthly_instalment, payment_due_day } = settings.rows[0];

    // Get all active members
    const members = await db.query('SELECT id FROM members WHERE is_active = true');

    // Check if already generated
    const existing = await db.query(
      'SELECT id FROM instalments WHERE month = $1 AND year = $2 LIMIT 1',
      [month, year]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: `Instalments already generated for ${month}/${year}.` });
    }

    // Generate instalments for all active members
    const dueDate = new Date(year, month - 1, payment_due_day);
    let count = 0;

    for (const member of members.rows) {
      await db.query(
        `INSERT INTO instalments (member_id, amount, due_date, month, year) 
         VALUES ($1, $2, $3, $4, $5)`,
        [member.id, monthly_instalment, dueDate.toISOString().split('T')[0], month, year]
      );
      count++;
    }

    res.status(201).json({ 
      success: true, 
      message: `Generated ${count} instalments for ${month}/${year}`,
      data: { count, month, year, amount: monthly_instalment }
    });
  } catch (error) {
    console.error('Generate instalments error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const instalmentId = req.params.id;
    const { paid_amount, paid_date, remarks } = req.body;

    if (!paid_amount || paid_amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid paid_amount is required.' });
    }

    // Get instalment
    const instalment = await db.query('SELECT * FROM instalments WHERE id = $1', [instalmentId]);
    if (instalment.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Instalment not found.' });
    }

    const inst = instalment.rows[0];
    const newPaidAmount = parseFloat(inst.paid_amount) + parseFloat(paid_amount);
    const totalAmount = parseFloat(inst.amount);

    // Determine status
    let status = 'partial';
    if (newPaidAmount >= totalAmount) {
      status = 'paid';
    }

    // Calculate late fine
    let lateFine = 0;
    const pDate = paid_date ? new Date(paid_date) : new Date();
    const dueDate = new Date(inst.due_date);

    if (pDate > dueDate) {
      const settings = await db.query('SELECT late_fine_per_day, grace_period_days FROM committee_settings LIMIT 1');
      if (settings.rows.length > 0) {
        const { late_fine_per_day, grace_period_days } = settings.rows[0];
        const diffDays = Math.floor((pDate - dueDate) / (1000 * 60 * 60 * 24));
        const fineDays = Math.max(0, diffDays - (grace_period_days || 0));
        lateFine = fineDays * parseFloat(late_fine_per_day || 0);

        if (diffDays > grace_period_days && status !== 'paid') {
          status = 'late';
        }
      }
    }

    // Update instalment
    const result = await db.query(
      `UPDATE instalments SET 
       paid_amount = $1, status = $2, paid_date = $3, late_fine = late_fine + $4, 
       remarks = COALESCE($5, remarks), updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 RETURNING *`,
      [newPaidAmount, status, pDate.toISOString().split('T')[0], lateFine, remarks, instalmentId]
    );

    // Record in fund transactions
    await db.query(
      `INSERT INTO fund_transactions (transaction_type, amount, reference_id, description, transaction_date) 
       VALUES ('instalment_received', $1, $2, $3, $4)`,
      [paid_amount, instalmentId, `Instalment payment - ${inst.month}/${inst.year}`, pDate.toISOString().split('T')[0]]
    );

    if (lateFine > 0) {
      await db.query(
        `INSERT INTO fund_transactions (transaction_type, amount, reference_id, description, transaction_date) 
         VALUES ('fine_received', $1, $2, $3, $4)`,
        [lateFine, instalmentId, `Late fine - ${inst.month}/${inst.year}`, pDate.toISOString().split('T')[0]]
      );
    }

    res.json({
      success: true,
      message: 'Payment recorded.',
      data: {
        instalment: result.rows[0],
        late_fine_charged: lateFine,
        status
      }
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.params;

    const result = await db.query(
      `SELECT 
        COUNT(*) as total_members,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_count,
        SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(amount) as total_expected,
        SUM(paid_amount) as total_collected,
        SUM(late_fine) as total_fines
       FROM instalments WHERE month = $1 AND year = $2`,
      [month, year]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Monthly summary error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

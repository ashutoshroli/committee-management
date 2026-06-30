const db = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    // Total members
    const members = await db.query('SELECT COUNT(*) as total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active FROM members');

    // Total fund (sum of all incoming - outgoing)
    const fund = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type IN ('instalment_received', 'loan_payment_received', 'fine_received') THEN amount ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN transaction_type = 'loan_disbursed' THEN amount ELSE 0 END), 0) as total_out
      FROM fund_transactions
    `);

    const totalIn = parseFloat(fund.rows[0].total_in);
    const totalOut = parseFloat(fund.rows[0].total_out);
    const availableFund = totalIn - totalOut;

    // Active loans
    const loans = await db.query(`
      SELECT COUNT(*) as total_active, 
             COALESCE(SUM(remaining_principal), 0) as total_outstanding
      FROM loans WHERE status = 'active'
    `);

    // Current month collection
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const collection = await db.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as expected,
        COALESCE(SUM(paid_amount), 0) as collected,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid
      FROM instalments WHERE month = $1 AND year = $2
    `, [currentMonth, currentYear]);

    // Total interest earned
    const interest = await db.query(`
      SELECT COALESCE(SUM(total_interest_paid), 0) as total_interest FROM loans
    `);

    res.json({
      success: true,
      data: {
        members: {
          total: parseInt(members.rows[0].total),
          active: parseInt(members.rows[0].active)
        },
        fund: {
          total_in: totalIn,
          total_out: totalOut,
          available: availableFund
        },
        loans: {
          active_count: parseInt(loans.rows[0].total_active),
          total_outstanding: parseFloat(loans.rows[0].total_outstanding)
        },
        current_month_collection: {
          month: currentMonth,
          year: currentYear,
          expected: parseFloat(collection.rows[0].expected),
          collected: parseFloat(collection.rows[0].collected),
          total_members: parseInt(collection.rows[0].total),
          paid: parseInt(collection.rows[0].paid || 0),
          unpaid: parseInt(collection.rows[0].unpaid || 0)
        },
        total_interest_earned: parseFloat(interest.rows[0].total_interest)
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

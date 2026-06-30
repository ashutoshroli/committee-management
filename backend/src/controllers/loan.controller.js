const db = require('../config/db');

// ===== LOAN CALCULATION HELPERS =====

/**
 * Calculate monthly interest on reducing balance
 * Interest = Remaining Principal × (Monthly Rate / 100)
 */
function calculateMonthlyInterest(principal, monthlyRate) {
  return parseFloat((principal * (monthlyRate / 100)).toFixed(2));
}

/**
 * Calculate auto tenure based on monthly payment and interest
 * This uses iterative method for reducing balance
 */
function calculateTenure(principal, monthlyRate, monthlyPayment) {
  let remaining = principal;
  let months = 0;
  const maxMonths = 600; // 50 years max safety limit

  while (remaining > 0 && months < maxMonths) {
    const interest = calculateMonthlyInterest(remaining, monthlyRate);
    const principalPortion = monthlyPayment - interest;
    
    if (principalPortion <= 0) {
      return null; // Payment too low - will never close
    }
    
    remaining -= principalPortion;
    months++;
  }

  return months;
}

/**
 * Generate loan payment schedule (projected)
 */
function generateSchedule(principal, monthlyRate, monthlyPayment, startDate) {
  const schedule = [];
  let remaining = principal;
  let month = 0;
  const start = new Date(startDate);

  while (remaining > 0.01) {
    month++;
    const interest = calculateMonthlyInterest(remaining, monthlyRate);
    let principalPortion = monthlyPayment - interest;
    
    if (principalPortion > remaining) {
      principalPortion = remaining;
    }

    remaining -= principalPortion;
    if (remaining < 0) remaining = 0;

    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + month);

    schedule.push({
      month_number: month,
      due_date: dueDate.toISOString().split('T')[0],
      emi_amount: parseFloat((interest + principalPortion).toFixed(2)),
      interest_component: interest,
      principal_component: parseFloat(principalPortion.toFixed(2)),
      remaining_principal: parseFloat(remaining.toFixed(2))
    });

    if (month > 600) break; // safety
  }

  return schedule;
}

// ===== CONTROLLER METHODS =====

exports.getAll = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*, m.name as member_name, m.phone as member_phone
       FROM loans l 
       JOIN members m ON l.member_id = m.id 
       ORDER BY l.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l.*, m.name as member_name, m.phone as member_phone
       FROM loans l 
       JOIN members m ON l.member_id = m.id 
       WHERE l.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    // Get payment history
    const payments = await db.query(
      'SELECT * FROM loan_payments WHERE loan_id = $1 ORDER BY payment_date DESC',
      [req.params.id]
    );

    // Get interest log
    const interestLog = await db.query(
      'SELECT * FROM loan_interest_log WHERE loan_id = $1 ORDER BY year DESC, month DESC',
      [req.params.id]
    );

    const loan = result.rows[0];
    const currentInterest = calculateMonthlyInterest(
      parseFloat(loan.remaining_principal), 
      parseFloat(loan.interest_rate)
    );

    res.json({ 
      success: true, 
      data: {
        ...loan,
        current_month_interest: currentInterest,
        foreclosure_amount: parseFloat(loan.remaining_principal) + currentInterest,
        payments: payments.rows,
        interest_log: interestLog.rows
      }
    });
  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { member_id, principal_amount, interest_rate, monthly_payment_amount, tenure_months, start_date, remarks } = req.body;

    if (!member_id || !principal_amount || !interest_rate || !monthly_payment_amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'member_id, principal_amount, interest_rate, and monthly_payment_amount are required.' 
      });
    }

    // Verify member exists
    const member = await db.query('SELECT id, name FROM members WHERE id = $1 AND is_active = true', [member_id]);
    if (member.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Active member not found.' });
    }

    // Check if monthly payment covers at least some principal
    const firstMonthInterest = calculateMonthlyInterest(principal_amount, interest_rate);
    if (monthly_payment_amount <= firstMonthInterest) {
      // Allow it but warn - it's open-ended with possible compounding
    }

    // Calculate tenure if not provided
    let calculatedTenure = tenure_months;
    if (!tenure_months) {
      calculatedTenure = calculateTenure(principal_amount, interest_rate, monthly_payment_amount);
    }

    // Calculate end date if tenure exists
    let endDate = null;
    const loanStart = start_date || new Date().toISOString().split('T')[0];
    if (calculatedTenure) {
      const end = new Date(loanStart);
      end.setMonth(end.getMonth() + calculatedTenure);
      endDate = end.toISOString().split('T')[0];
    }

    const result = await db.query(
      `INSERT INTO loans (member_id, principal_amount, remaining_principal, interest_rate, 
       monthly_payment_amount, tenure_months, start_date, end_date, remarks) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [member_id, principal_amount, principal_amount, interest_rate, monthly_payment_amount, 
       calculatedTenure, loanStart, endDate, remarks || null]
    );

    // Record fund disbursement
    await db.query(
      `INSERT INTO fund_transactions (transaction_type, amount, reference_id, description, transaction_date) 
       VALUES ('loan_disbursed', $1, $2, $3, $4)`,
      [principal_amount, result.rows[0].id, `Loan disbursed to ${member.rows[0].name}`, loanStart]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Loan created successfully.', 
      data: {
        ...result.rows[0],
        calculated_tenure: calculatedTenure,
        first_month_interest: firstMonthInterest
      }
    });
  } catch (error) {
    console.error('Create loan error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.makePayment = async (req, res) => {
  try {
    const loanId = req.params.id;
    const { payment_amount, payment_date, remarks } = req.body;

    if (!payment_amount || payment_amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment_amount is required.' });
    }

    // Get loan details
    const loanResult = await db.query('SELECT * FROM loans WHERE id = $1 AND status = $2', [loanId, 'active']);
    if (loanResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Active loan not found.' });
    }

    const loan = loanResult.rows[0];
    const remainingPrincipal = parseFloat(loan.remaining_principal);
    const monthlyRate = parseFloat(loan.interest_rate);
    
    // Calculate current month interest
    const interest = calculateMonthlyInterest(remainingPrincipal, monthlyRate);
    
    let interestComponent = 0;
    let principalComponent = 0;
    let paymentType = 'partial';
    const payAmount = parseFloat(payment_amount);

    if (payAmount >= interest) {
      // Interest covered, rest goes to principal
      interestComponent = interest;
      principalComponent = Math.min(payAmount - interest, remainingPrincipal);
      
      if (principalComponent >= remainingPrincipal) {
        paymentType = 'emi'; // Full or more than enough
      } else if (payAmount === interest) {
        paymentType = 'interest_only';
      } else {
        paymentType = payAmount >= parseFloat(loan.monthly_payment_amount) ? 'emi' : 'partial';
      }
    } else {
      // Payment less than interest - partial interest payment
      interestComponent = payAmount;
      principalComponent = 0;
      paymentType = 'partial';
    }

    // Calculate new remaining principal
    let newRemainingPrincipal = remainingPrincipal - principalComponent;
    
    // Handle unpaid interest (compound - add to principal)
    const unpaidInterest = interest - interestComponent;
    if (unpaidInterest > 0) {
      newRemainingPrincipal += unpaidInterest; // Compound
    }

    if (newRemainingPrincipal < 0.01) newRemainingPrincipal = 0;

    const pDate = payment_date || new Date().toISOString().split('T')[0];
    const now = new Date(pDate);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Insert payment record
    const paymentResult = await db.query(
      `INSERT INTO loan_payments (loan_id, member_id, payment_amount, principal_component, 
       interest_component, remaining_principal_after, payment_type, payment_date, month, year, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [loanId, loan.member_id, payAmount, principalComponent, interestComponent,
       newRemainingPrincipal, paymentType, pDate, month, year, remarks || null]
    );

    // Update loan
    const newStatus = newRemainingPrincipal === 0 ? 'closed' : 'active';
    await db.query(
      `UPDATE loans SET 
       remaining_principal = $1, 
       total_interest_paid = total_interest_paid + $2, 
       total_principal_paid = total_principal_paid + $3,
       status = $4,
       closed_date = $5,
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6`,
      [newRemainingPrincipal, interestComponent, principalComponent, newStatus,
       newStatus === 'closed' ? pDate : null, loanId]
    );

    // Record in fund transactions
    await db.query(
      `INSERT INTO fund_transactions (transaction_type, amount, reference_id, description, transaction_date) 
       VALUES ('loan_payment_received', $1, $2, $3, $4)`,
      [payAmount, paymentResult.rows[0].id, `Loan payment - Type: ${paymentType}`, pDate]
    );

    // Log interest
    await db.query(
      `INSERT INTO loan_interest_log (loan_id, principal_at_start, interest_amount, is_compounded, month, year)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [loanId, remainingPrincipal, interest, unpaidInterest > 0, month, year]
    );

    res.json({
      success: true,
      message: newStatus === 'closed' ? 'Payment successful. Loan is now closed!' : 'Payment recorded successfully.',
      data: {
        payment: paymentResult.rows[0],
        breakdown: {
          total_paid: payAmount,
          interest_covered: interestComponent,
          principal_reduced: principalComponent,
          unpaid_interest_compounded: unpaidInterest > 0 ? unpaidInterest : 0,
          previous_principal: remainingPrincipal,
          new_remaining_principal: newRemainingPrincipal,
          loan_status: newStatus
        }
      }
    });
  } catch (error) {
    console.error('Make payment error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.foreclose = async (req, res) => {
  try {
    const loanId = req.params.id;
    const { payment_date } = req.body;

    const loanResult = await db.query('SELECT * FROM loans WHERE id = $1 AND status = $2', [loanId, 'active']);
    if (loanResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Active loan not found.' });
    }

    const loan = loanResult.rows[0];
    const remainingPrincipal = parseFloat(loan.remaining_principal);
    const interest = calculateMonthlyInterest(remainingPrincipal, parseFloat(loan.interest_rate));
    const foreclosureAmount = remainingPrincipal + interest;

    const pDate = payment_date || new Date().toISOString().split('T')[0];
    const now = new Date(pDate);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Record payment
    const paymentResult = await db.query(
      `INSERT INTO loan_payments (loan_id, member_id, payment_amount, principal_component, 
       interest_component, remaining_principal_after, payment_type, payment_date, month, year, remarks)
       VALUES ($1, $2, $3, $4, $5, 0, 'foreclosure', $6, $7, $8, 'Loan foreclosure - No penalty')
       RETURNING *`,
      [loanId, loan.member_id, foreclosureAmount, remainingPrincipal, interest, pDate, month, year]
    );

    // Close the loan
    await db.query(
      `UPDATE loans SET 
       remaining_principal = 0, 
       total_interest_paid = total_interest_paid + $1, 
       total_principal_paid = total_principal_paid + $2,
       status = 'foreclosed', 
       closed_date = $3, 
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4`,
      [interest, remainingPrincipal, pDate, loanId]
    );

    // Fund transaction
    await db.query(
      `INSERT INTO fund_transactions (transaction_type, amount, reference_id, description, transaction_date) 
       VALUES ('loan_payment_received', $1, $2, 'Loan foreclosure payment', $3)`,
      [foreclosureAmount, paymentResult.rows[0].id, pDate]
    );

    res.json({
      success: true,
      message: 'Loan foreclosed successfully. No penalty charged.',
      data: {
        foreclosure_amount: foreclosureAmount,
        principal_paid: remainingPrincipal,
        interest_paid: interest,
        payment: paymentResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Foreclose error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM loan_payments WHERE loan_id = $1 ORDER BY payment_date DESC',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM loans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    const loan = result.rows[0];
    const schedule = generateSchedule(
      parseFloat(loan.remaining_principal),
      parseFloat(loan.interest_rate),
      parseFloat(loan.monthly_payment_amount),
      new Date().toISOString().split('T')[0]
    );

    res.json({ 
      success: true, 
      data: {
        loan_id: loan.id,
        remaining_principal: loan.remaining_principal,
        monthly_payment: loan.monthly_payment_amount,
        interest_rate: loan.interest_rate,
        projected_schedule: schedule
      }
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.processMonthlyInterest = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'month and year are required.' });
    }

    // Get all active loans
    const loans = await db.query('SELECT * FROM loans WHERE status = $1', ['active']);
    const results = [];

    for (const loan of loans.rows) {
      const remainingPrincipal = parseFloat(loan.remaining_principal);
      const interest = calculateMonthlyInterest(remainingPrincipal, parseFloat(loan.interest_rate));

      // Check if payment was made this month
      const paymentCheck = await db.query(
        'SELECT SUM(interest_component) as total_interest_paid FROM loan_payments WHERE loan_id = $1 AND month = $2 AND year = $3',
        [loan.id, month, year]
      );

      const interestPaid = parseFloat(paymentCheck.rows[0].total_interest_paid || 0);
      const unpaidInterest = interest - interestPaid;

      if (unpaidInterest > 0) {
        // Compound: add unpaid interest to principal
        const newPrincipal = remainingPrincipal + unpaidInterest;
        
        await db.query(
          'UPDATE loans SET remaining_principal = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newPrincipal, loan.id]
        );

        await db.query(
          `INSERT INTO loan_interest_log (loan_id, principal_at_start, interest_amount, is_compounded, month, year)
           VALUES ($1, $2, $3, TRUE, $4, $5)`,
          [loan.id, remainingPrincipal, unpaidInterest, month, year]
        );

        results.push({
          loan_id: loan.id,
          member_id: loan.member_id,
          unpaid_interest: unpaidInterest,
          compounded: true,
          new_principal: newPrincipal
        });
      } else {
        results.push({
          loan_id: loan.id,
          member_id: loan.member_id,
          interest_fully_paid: true
        });
      }
    }

    res.json({
      success: true,
      message: `Monthly interest processed for ${month}/${year}`,
      data: results
    });
  } catch (error) {
    console.error('Process monthly interest error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

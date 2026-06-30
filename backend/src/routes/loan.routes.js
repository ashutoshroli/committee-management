const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Loan CRUD
router.get('/', loanController.getAll);
router.get('/:id', loanController.getById);
router.post('/', authorize('superadmin', 'admin', 'subadmin'), loanController.create);

// Loan Payments
router.post('/:id/payment', authorize('superadmin', 'admin', 'subadmin', 'manager'), loanController.makePayment);
router.get('/:id/payments', loanController.getPayments);
router.get('/:id/schedule', loanController.getSchedule);

// Foreclosure
router.post('/:id/foreclose', authorize('superadmin', 'admin'), loanController.foreclose);

// Monthly interest processing
router.post('/process-monthly-interest', authorize('superadmin', 'admin'), loanController.processMonthlyInterest);

module.exports = router;

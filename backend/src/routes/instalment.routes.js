const express = require('express');
const router = express.Router();
const instalmentController = require('../controllers/instalment.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', instalmentController.getAll);
router.get('/member/:memberId', instalmentController.getByMember);
router.post('/generate', authorize('superadmin', 'admin'), instalmentController.generateMonthly);
router.post('/:id/pay', authorize('superadmin', 'admin', 'subadmin', 'manager'), instalmentController.recordPayment);
router.get('/summary/:month/:year', instalmentController.getMonthlySummary);

module.exports = router;

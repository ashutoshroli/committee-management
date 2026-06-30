const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', settingsController.get);
router.put('/', authorize('superadmin', 'admin'), settingsController.update);

module.exports = router;

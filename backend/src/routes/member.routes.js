const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', memberController.getAll);
router.get('/:id', memberController.getById);
router.post('/', authorize('superadmin', 'admin', 'subadmin'), memberController.create);
router.put('/:id', authorize('superadmin', 'admin', 'subadmin'), memberController.update);
router.delete('/:id', authorize('superadmin', 'admin'), memberController.delete);

module.exports = router;

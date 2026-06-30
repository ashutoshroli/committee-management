const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('superadmin', 'admin'), userController.getAll);
router.get('/:id', authorize('superadmin', 'admin'), userController.getById);
router.post('/', authorize('superadmin', 'admin'), userController.create);
router.put('/:id', authorize('superadmin', 'admin'), userController.update);
router.delete('/:id', authorize('superadmin'), userController.delete);

module.exports = router;

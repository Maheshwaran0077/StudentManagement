const router = require('express').Router();
const { getUsers, changeUserRole, toggleUserActive, getDashboardStats } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id/role', changeUserRole);
router.put('/users/:id/toggle-active', toggleUserActive);

module.exports = router;

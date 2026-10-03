const router = require('express').Router();
const { createDepartment, getDepartments, updateDepartment } = require('../controllers/department.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getDepartments);
router.post('/', protect, authorize('admin'), createDepartment);
router.put('/:id', protect, authorize('admin'), updateDepartment);

module.exports = router;

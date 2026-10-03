const router = require('express').Router();
const {
  submitGrievance, getGrievances, getGrievanceById,
  updateStatus, deleteGrievance, getStats,
} = require('../controllers/grievance.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', authorize('admin', 'sensitive_officer'), getStats);
router.route('/')
  .get(getGrievances)
  .post(submitGrievance);

router.route('/:id')
  .get(getGrievanceById)
  .delete(authorize('admin'), deleteGrievance);

router.put('/:id/status', authorize('admin', 'sensitive_officer'), updateStatus);

module.exports = router;

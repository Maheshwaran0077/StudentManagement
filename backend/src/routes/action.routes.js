const router = require('express').Router();
const {
  generateActionRecommendation, getActions, getActionById,
  approveAction, rejectAction, addProgressUpdate,
} = require('../controllers/action.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.post('/recommend/:patternId', generateActionRecommendation);
router.get('/', getActions);
router.get('/:id', getActionById);
router.put('/:id/approve', approveAction);
router.put('/:id/reject', rejectAction);
router.put('/:id/progress', addProgressUpdate);

module.exports = router;

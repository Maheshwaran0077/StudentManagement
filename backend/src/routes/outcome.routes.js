const router = require('express').Router();
const { measureActionOutcome, getOutcomes, getOutcomeById } = require('../controllers/outcome.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/', getOutcomes);
router.get('/:id', getOutcomeById);
router.post('/measure/:actionId', measureActionOutcome);

module.exports = router;

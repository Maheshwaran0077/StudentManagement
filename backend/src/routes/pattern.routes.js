const router = require('express').Router();
const {
  runDiscovery, getPatterns, getPatternById,
  runDiagnosis, runPrediction,
} = require('../controllers/pattern.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.post('/discover', runDiscovery);
router.get('/', getPatterns);
router.get('/:id', getPatternById);
router.post('/:id/diagnose', runDiagnosis);
router.post('/:id/predict', runPrediction);

module.exports = router;

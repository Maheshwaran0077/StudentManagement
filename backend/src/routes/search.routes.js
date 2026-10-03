const router = require('express').Router();
const { semanticPatternSearch, searchGrievances } = require('../controllers/search.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/semantic', authorize('admin', 'sensitive_officer'), semanticPatternSearch);
router.get('/grievances', searchGrievances);

module.exports = router;

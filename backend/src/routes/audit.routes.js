const router = require('express').Router();
const { getAuditLogs } = require('../controllers/audit.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getAuditLogs);

module.exports = router;

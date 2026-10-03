const AuditLog = require('../models/AuditLog');

// GET /api/audit
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.performedBy = userId;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAuditLogs };

const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({ action, performedBy, targetResource, targetId, details, req }) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      targetResource,
      targetId,
      details,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };

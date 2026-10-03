const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'GRIEVANCE_SUBMITTED',
        'GRIEVANCE_STATUS_CHANGED',
        'GRIEVANCE_DELETED',
        'PATTERN_DISCOVERED',
        'PATTERN_UPDATED',
        'ACTION_CREATED',
        'ACTION_APPROVED',
        'ACTION_REJECTED',
        'ACTION_COMPLETED',
        'OUTCOME_MEASURED',
        'SENSITIVE_DATA_ACCESSED',
        'USER_REGISTERED',
        'USER_LOGIN',
        'USER_ROLE_CHANGED',
        'DEPARTMENT_CREATED',
        'DEPARTMENT_UPDATED',
        'ADMIN_ACTION',
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetResource: { type: String }, // e.g. 'Grievance', 'Pattern'
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

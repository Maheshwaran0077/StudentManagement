const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema(
  {
    actionId: { type: String, unique: true }, // e.g. ACT-001
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    // Source
    patternId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pattern' },
    grievanceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Grievance' }],

    // Recommendation details
    recommendation: {
      suggestedSteps: [String],
      targetDepartment: String,
      estimatedImpact: { type: String, enum: ['low', 'medium', 'high'] },
      priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      generatedAt: Date,
    },

    // Assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Admin approval workflow
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'edited_approved'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    adminNotes: { type: String, trim: true },

    // Execution status
    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'in_progress', 'completed', 'cancelled'],
      default: 'pending_approval',
    },

    deadline: Date,
    startedAt: Date,
    completedAt: Date,

    // Progress updates
    progressUpdates: [
      {
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Action', actionSchema);

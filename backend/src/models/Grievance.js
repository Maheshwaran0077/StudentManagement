const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema(
  {
    // Submitted by
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For sensitive anonymous submissions — stored separately, hidden by default
    sensitiveIdentity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      select: false,
    },
    isAnonymous: { type: Boolean, default: false },

    // Core content
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

    // Categorisation
    category: {
      type: String,
      required: true,
      enum: [
        'Infrastructure',
        'Academic',
        'Hostel',
        'Canteen',
        'Transport',
        'Administrative',
        'Safety',
        'IT/Network',
        'Library',
        'Sports',
        'Medical',
        'Harassment',
        'Financial',
        'Other',
      ],
    },
    subCategory: { type: String, trim: true },
    location: { type: String, trim: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },

    // Severity (user-provided)
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },

    // Status lifecycle
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected'],
      default: 'submitted',
    },

    // AI analysis results
    aiAnalysis: {
      preprocessedText: String,
      keywords: [String],
      sentiment: { type: String, enum: ['positive', 'negative', 'neutral'] },
      sentimentScore: Number,
      isSafetyConcern: { type: Boolean, default: false },
      isRecurrence: { type: Boolean, default: false },
      recurrenceSignals: [String],
      urgencyScore: { type: Number, min: 0, max: 10 },
      urgencyLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      embedding: { type: [Number], select: false }, // 384-D vector
      analyzedAt: Date,
    },

    // Pattern linkage
    patternId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pattern',
    },

    // Attachments
    attachments: [
      {
        filename: String,
        url: String,
        mimetype: String,
      },
    ],

    // Stakeholder
    stakeholderGroup: {
      type: String,
      enum: ['student', 'faculty', 'staff', 'all'],
      default: 'student',
    },

    // Admin notes
    adminNotes: { type: String, trim: true },
    resolvedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Index for search and pattern discovery
grievanceSchema.index({ category: 1, status: 1, createdAt: -1 });
grievanceSchema.index({ 'aiAnalysis.urgencyLevel': 1 });
grievanceSchema.index({ location: 1, category: 1 });

module.exports = mongoose.model('Grievance', grievanceSchema);

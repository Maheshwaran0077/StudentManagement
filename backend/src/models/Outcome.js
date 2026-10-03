const mongoose = require('mongoose');

const outcomeSchema = new mongoose.Schema(
  {
    actionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Action',
      required: true,
    },
    patternId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pattern',
    },

    // Before-action metrics (snapshot)
    before: {
      grievanceCount: Number,
      avgSeverityScore: Number,
      avgSentimentScore: Number,
      weeklyFrequency: Number,
      period: String,
    },

    // After-action metrics (snapshot)
    after: {
      grievanceCount: Number,
      avgSeverityScore: Number,
      avgSentimentScore: Number,
      weeklyFrequency: Number,
      period: String,
    },

    // Computed outcome
    improvementRate: Number, // % reduction in complaints
    sentimentImprovement: Number,
    effectivenessScore: { type: Number, min: 0, max: 100 },
    verdict: {
      type: String,
      enum: ['effective', 'partially_effective', 'ineffective', 'too_early'],
      default: 'too_early',
    },

    // Recurrence monitoring
    recurrenceDetected: { type: Boolean, default: false },
    recurrenceScore: { type: Number, min: 0, max: 1 },
    recurrenceGrievanceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Grievance' }],
    lastCheckedAt: Date,

    measuredAt: Date,
    measuredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Outcome', outcomeSchema);

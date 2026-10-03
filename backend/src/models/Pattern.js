const mongoose = require('mongoose');

const patternSchema = new mongoose.Schema(
  {
    // Identification
    patternId: { type: String, unique: true }, // e.g. PAT-001
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // Clustering info
    clusterId: { type: Number }, // HDBSCAN cluster label
    clusteringMethod: { type: String, enum: ['HDBSCAN', 'KMeans'], default: 'HDBSCAN' },
    silhouetteScore: { type: Number },

    // Pattern characteristics
    category: { type: String, required: true },
    subCategory: { type: String },
    location: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    sentiment: { type: String, enum: ['positive', 'negative', 'neutral'] },
    avgSentimentScore: { type: Number },
    keywords: [{ type: String }],
    stakeholderGroup: { type: String },

    // Temporal stats
    grievanceCount: { type: Number, default: 0 },
    grievanceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Grievance' }],
    firstOccurrence: { type: Date },
    lastOccurrence: { type: Date },
    peakPeriod: { type: String },
    weeklyTrend: [
      {
        week: String,
        count: Number,
      },
    ],

    // Embedding (centroid of cluster)
    embedding: { type: [Number], select: false },

    // Status
    status: {
      type: String,
      enum: ['active', 'resolved', 'monitoring', 'archived'],
      default: 'active',
    },

    // Diagnosis
    diagnosis: {
      possibleCauses: [String],
      evidenceSummary: String,
      confidenceLevel: { type: String, enum: ['low', 'medium', 'high'] },
      diagnosedAt: Date,
    },

    // Prediction
    prediction: {
      trend: { type: String, enum: ['increasing', 'decreasing', 'stable', 'emerging'] },
      slope: Number,
      rSquared: Number,
      growthRate: Number,
      forecast: [
        {
          week: String,
          predicted: Number,
          lower: Number,
          upper: Number,
        },
      ],
      predictedAt: Date,
    },

    // Linked action
    actionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Action' },
  },
  { timestamps: true }
);

patternSchema.index({ category: 1, status: 1 });
patternSchema.index({ location: 1 });

module.exports = mongoose.model('Pattern', patternSchema);

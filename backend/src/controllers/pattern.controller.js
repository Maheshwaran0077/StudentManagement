const Pattern = require('../models/Pattern');
const Grievance = require('../models/Grievance');
const { createAuditLog } = require('../middleware/audit');
const {
  discoverPatterns, diagnosePattern, predictPattern,
} = require('../services/aiService');

// POST /api/patterns/discover  (admin triggers pattern discovery)
const runDiscovery = async (req, res) => {
  try {
    // Fetch all grievances that have embeddings
    const grievances = await Grievance.find({
      'aiAnalysis.embedding': { $exists: true, $ne: [] },
    }).select('+aiAnalysis.embedding').lean();

    if (grievances.length < 10) {
      return res.status(400).json({ message: 'Not enough analyzed grievances for pattern discovery (minimum 10)' });
    }

    const payload = {
      grievances: grievances.map((g) => ({
        id: g._id.toString(),
        embedding: g.aiAnalysis.embedding,
        category: g.category,
        location: g.location,
        severity: g.severity,
        sentiment: g.aiAnalysis?.sentiment,
        sentiment_score: g.aiAnalysis?.sentimentScore,
        keywords: g.aiAnalysis?.keywords || [],
        stakeholder_group: g.stakeholderGroup,
        created_at: g.createdAt,
      })),
    };

    const result = await discoverPatterns(payload);

    // Persist patterns returned by AI
    const savedPatterns = [];
    for (const p of result.patterns || []) {
      const counter = await Pattern.countDocuments();
      const patternId = `PAT-${String(counter + 1).padStart(3, '0')}`;

      const existing = await Pattern.findOne({ clusterId: p.cluster_id, clusteringMethod: p.method });
      if (existing) {
        // Update existing pattern
        Object.assign(existing, {
          grievanceCount: p.grievance_ids.length,
          grievanceIds: p.grievance_ids,
          keywords: p.keywords,
          lastOccurrence: new Date(),
          weeklyTrend: p.weekly_trend,
        });
        await existing.save();
        savedPatterns.push(existing);
      } else {
        const pattern = await Pattern.create({
          patternId,
          clusterId: p.cluster_id,
          clusteringMethod: p.method || 'HDBSCAN',
          silhouetteScore: p.silhouette_score,
          title: p.title || `${p.category} issue at ${p.location || 'Campus'}`,
          description: p.description,
          category: p.category,
          subCategory: p.sub_category,
          location: p.location,
          severity: p.severity,
          sentiment: p.sentiment,
          avgSentimentScore: p.avg_sentiment_score,
          keywords: p.keywords,
          stakeholderGroup: p.stakeholder_group,
          grievanceCount: p.grievance_ids.length,
          grievanceIds: p.grievance_ids,
          firstOccurrence: p.first_occurrence ? new Date(p.first_occurrence) : new Date(),
          lastOccurrence: p.last_occurrence ? new Date(p.last_occurrence) : new Date(),
          peakPeriod: p.peak_period,
          weeklyTrend: p.weekly_trend,
          embedding: p.centroid_embedding,
        });
        savedPatterns.push(pattern);
      }
    }

    await createAuditLog({
      action: 'PATTERN_DISCOVERED',
      performedBy: req.user._id,
      targetResource: 'Pattern',
      details: { count: savedPatterns.length },
      req,
    });

    res.json({ message: `${savedPatterns.length} patterns discovered/updated`, patterns: savedPatterns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/patterns
const getPatterns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, location } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const total = await Pattern.countDocuments(filter);
    const patterns = await Pattern.find(filter)
      .populate('actionId', 'title status approvalStatus')
      .sort({ grievanceCount: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ patterns, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/patterns/:id
const getPatternById = async (req, res) => {
  try {
    const pattern = await Pattern.findById(req.params.id)
      .populate('actionId')
      .populate({ path: 'grievanceIds', select: 'title category status createdAt', options: { limit: 20 } });

    if (!pattern) return res.status(404).json({ message: 'Pattern not found' });
    res.json({ pattern });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/patterns/:id/diagnose
const runDiagnosis = async (req, res) => {
  try {
    const pattern = await Pattern.findById(req.params.id);
    if (!pattern) return res.status(404).json({ message: 'Pattern not found' });

    const result = await diagnosePattern({
      pattern_id: pattern._id.toString(),
      category: pattern.category,
      location: pattern.location,
      grievance_count: pattern.grievanceCount,
      keywords: pattern.keywords,
      weekly_trend: pattern.weeklyTrend,
      sentiment: pattern.sentiment,
      severity: pattern.severity,
      peak_period: pattern.peakPeriod,
    });

    pattern.diagnosis = {
      possibleCauses: result.possible_causes,
      evidenceSummary: result.evidence_summary,
      confidenceLevel: result.confidence_level,
      diagnosedAt: new Date(),
    };
    await pattern.save();

    res.json({ message: 'Diagnosis complete', diagnosis: pattern.diagnosis });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/patterns/:id/predict
const runPrediction = async (req, res) => {
  try {
    const pattern = await Pattern.findById(req.params.id);
    if (!pattern) return res.status(404).json({ message: 'Pattern not found' });

    const result = await predictPattern({
      pattern_id: pattern._id.toString(),
      weekly_trend: pattern.weeklyTrend,
      category: pattern.category,
    });

    pattern.prediction = {
      trend: result.trend,
      slope: result.slope,
      rSquared: result.r_squared,
      growthRate: result.growth_rate,
      forecast: result.forecast,
      predictedAt: new Date(),
    };
    await pattern.save();

    res.json({ message: 'Prediction complete', prediction: pattern.prediction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { runDiscovery, getPatterns, getPatternById, runDiagnosis, runPrediction };

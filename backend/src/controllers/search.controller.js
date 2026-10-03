const Pattern = require('../models/Pattern');
const Grievance = require('../models/Grievance');
const { semanticSearch } = require('../services/aiService');

// POST /api/search/semantic
const semanticPatternSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length < 3)
      return res.status(400).json({ message: 'Query must be at least 3 characters' });

    // Get all active patterns with embeddings
    const patterns = await Pattern.find({ status: { $ne: 'archived' } })
      .select('+embedding')
      .lean();

    if (!patterns.length) return res.json({ results: [] });

    const candidates = patterns.map((p) => ({
      id: p._id.toString(),
      text: `${p.title} ${p.description || ''} ${p.keywords?.join(' ')} ${p.category} ${p.location || ''}`,
      embedding: p.embedding,
    }));

    const searchResult = await semanticSearch(query, candidates);

    // Enrich results with full pattern data
    const resultIds = (searchResult.results || []).map((r) => r.id);
    const richPatterns = await Pattern.find({ _id: { $in: resultIds } });

    const enriched = (searchResult.results || []).map((r) => {
      const pattern = richPatterns.find((p) => p._id.toString() === r.id);
      return { ...r, pattern };
    });

    res.json({ results: enriched, query });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/search/grievances?q=...
const searchGrievances = async (req, res) => {
  try {
    const { q, category, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (!['admin', 'sensitive_officer'].includes(req.user.role)) {
      filter.submittedBy = req.user._id;
    }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'aiAnalysis.keywords': { $in: [new RegExp(q, 'i')] } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;

    const total = await Grievance.countDocuments(filter);
    const grievances = await Grievance.find(filter)
      .populate('submittedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ grievances, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { semanticPatternSearch, searchGrievances };

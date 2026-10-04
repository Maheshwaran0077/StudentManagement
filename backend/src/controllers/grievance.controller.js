const Grievance = require('../models/Grievance');
const { createAuditLog } = require('../middleware/audit');
const { analyzeGrievance } = require('../services/aiService');
const { getIO } = require('../config/socket');

// POST /api/grievances
const submitGrievance = async (req, res) => {
  try {
    const {
      title, description, category, subCategory,
      location, department, severity, isAnonymous, stakeholderGroup,
    } = req.body;

    const grievanceData = {
      title,
      description,
      category,
      subCategory: subCategory || undefined,
      location: location || undefined,
      // Only include department if a real ObjectId was provided — empty string causes BSONError
      ...(department && department.trim() !== '' && { department }),
      severity: severity || 'medium',
      isAnonymous: !!isAnonymous,
      stakeholderGroup: stakeholderGroup || req.user.role,
      submittedBy: req.user._id,
    };

    // For sensitive anonymous submissions store identity separately
    if (isAnonymous && ['Harassment', 'Safety'].includes(category)) {
      grievanceData.sensitiveIdentity = req.user._id;
      grievanceData.submittedBy = req.user._id;
    }

    const grievance = await Grievance.create(grievanceData);

    // Async AI analysis — fire and forget, update grievance on completion
    analyzeGrievance({
      grievance_id: grievance._id.toString(),
      title: grievance.title,
      description: grievance.description,
      category: grievance.category,
      severity: grievance.severity,
      location: grievance.location,
    }).then(async (analysis) => {
      await Grievance.findByIdAndUpdate(grievance._id, {
        aiAnalysis: {
          preprocessedText: analysis.preprocessed_text,
          keywords: analysis.keywords,
          sentiment: analysis.sentiment,
          sentimentScore: analysis.sentiment_score,
          isSafetyConcern: analysis.is_safety_concern,
          isRecurrence: analysis.is_recurrence,
          recurrenceSignals: analysis.recurrence_signals,
          urgencyScore: analysis.urgency_score,
          urgencyLevel: analysis.urgency_level,
          embedding: analysis.embedding,
          analyzedAt: new Date(),
        },
      });
      // Notify via Socket.IO
      try {
        getIO().emit('grievance_analyzed', { grievanceId: grievance._id });
      } catch (_) {}
    }).catch((err) => console.error('AI analysis failed:', err.message));

    await createAuditLog({
      action: 'GRIEVANCE_SUBMITTED',
      performedBy: req.user._id,
      targetResource: 'Grievance',
      targetId: grievance._id,
      req,
    });

    res.status(201).json({ message: 'Grievance submitted successfully', grievance });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/grievances  (admin sees all; user sees own)
const getGrievances = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, severity, search } = req.query;
    const filter = {};

    if (!['admin', 'sensitive_officer'].includes(req.user.role)) {
      filter.submittedBy = req.user._id;
    }
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Grievance.countDocuments(filter);
    const grievances = await Grievance.find(filter)
      .populate('submittedBy', 'name email role')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ grievances, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/grievances/:id
const getGrievanceById = async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('submittedBy', 'name email role')
      .populate('department', 'name code')
      .populate('patternId', 'title patternId');

    if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

    // Non-admin: only own grievances
    if (!['admin', 'sensitive_officer'].includes(req.user.role)) {
      if (grievance.submittedBy._id.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ grievance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/grievances/:id/status  (admin)
const updateStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
        ...(status === 'resolved' && { resolvedAt: new Date(), resolvedBy: req.user._id }),
      },
      { new: true }
    );
    if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

    await createAuditLog({
      action: 'GRIEVANCE_STATUS_CHANGED',
      performedBy: req.user._id,
      targetResource: 'Grievance',
      targetId: grievance._id,
      details: { newStatus: status },
      req,
    });

    try {
      getIO().to(grievance.submittedBy.toString()).emit('grievance_status_update', {
        grievanceId: grievance._id,
        newStatus: status,
      });
    } catch (_) {}

    res.json({ message: 'Status updated', grievance });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/grievances/:id (admin)
const deleteGrievance = async (req, res) => {
  try {
    const grievance = await Grievance.findByIdAndDelete(req.params.id);
    if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

    await createAuditLog({
      action: 'GRIEVANCE_DELETED',
      performedBy: req.user._id,
      targetResource: 'Grievance',
      targetId: grievance._id,
      req,
    });

    res.json({ message: 'Grievance deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/grievances/stats  (admin dashboard stats)
const getStats = async (req, res) => {
  try {
    const [total, submitted, inProgress, resolved, critical] = await Promise.all([
      Grievance.countDocuments(),
      Grievance.countDocuments({ status: 'submitted' }),
      Grievance.countDocuments({ status: 'in_progress' }),
      Grievance.countDocuments({ status: 'resolved' }),
      Grievance.countDocuments({ 'aiAnalysis.urgencyLevel': 'critical' }),
    ]);

    const byCategory = await Grievance.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byStatus = await Grievance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Weekly trend (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const weeklyTrend = await Grievance.aggregate([
      { $match: { createdAt: { $gte: eightWeeksAgo } } },
      {
        $group: {
          _id: { $week: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    res.json({ total, submitted, inProgress, resolved, critical, byCategory, byStatus, weeklyTrend });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submitGrievance, getGrievances, getGrievanceById, updateStatus, deleteGrievance, getStats };

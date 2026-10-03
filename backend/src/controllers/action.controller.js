const Action = require('../models/Action');
const Pattern = require('../models/Pattern');
const { createAuditLog } = require('../middleware/audit');
const { generateRecommendation, coordinateAction } = require('../services/aiService');
const { getIO } = require('../config/socket');

// POST /api/actions/recommend/:patternId
const generateActionRecommendation = async (req, res) => {
  try {
    const pattern = await Pattern.findById(req.params.patternId);
    if (!pattern) return res.status(404).json({ message: 'Pattern not found' });

    const recPayload = {
      pattern_id: pattern._id.toString(),
      category: pattern.category,
      location: pattern.location,
      grievance_count: pattern.grievanceCount,
      severity: pattern.severity,
      sentiment: pattern.sentiment,
      keywords: pattern.keywords,
      diagnosis: pattern.diagnosis,
      prediction: pattern.prediction,
    };

    const recommendation = await generateRecommendation(recPayload);
    const actionDraft = await coordinateAction({ ...recPayload, recommendation });

    const counter = await Action.countDocuments();
    const actionId = `ACT-${String(counter + 1).padStart(3, '0')}`;

    const action = await Action.create({
      actionId,
      title: actionDraft.title,
      description: actionDraft.description,
      patternId: pattern._id,
      grievanceIds: pattern.grievanceIds,
      recommendation: {
        suggestedSteps: recommendation.suggested_steps,
        targetDepartment: recommendation.target_department,
        estimatedImpact: recommendation.estimated_impact,
        priority: recommendation.priority,
        generatedAt: new Date(),
      },
      status: 'pending_approval',
      approvalStatus: 'pending',
    });

    // Link action to pattern
    pattern.actionId = action._id;
    await pattern.save();

    await createAuditLog({
      action: 'ACTION_CREATED',
      performedBy: req.user._id,
      targetResource: 'Action',
      targetId: action._id,
      req,
    });

    res.status(201).json({ message: 'Action recommendation generated', action });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/actions
const getActions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, approvalStatus } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    const total = await Action.countDocuments(filter);
    const actions = await Action.find(filter)
      .populate('patternId', 'title category location')
      .populate('assignedTo', 'name code')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ actions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/actions/:id
const getActionById = async (req, res) => {
  try {
    const action = await Action.findById(req.params.id)
      .populate('patternId')
      .populate('assignedTo')
      .populate('assignedUser', 'name email')
      .populate('reviewedBy', 'name email');
    if (!action) return res.status(404).json({ message: 'Action not found' });
    res.json({ action });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/actions/:id/approve
const approveAction = async (req, res) => {
  try {
    const { adminNotes, assignedTo, deadline } = req.body;
    const action = await Action.findById(req.params.id);
    if (!action) return res.status(404).json({ message: 'Action not found' });

    action.approvalStatus = 'approved';
    action.status = 'approved';
    action.reviewedBy = req.user._id;
    action.reviewedAt = new Date();
    if (adminNotes) action.adminNotes = adminNotes;
    if (assignedTo) action.assignedTo = assignedTo;
    if (deadline) action.deadline = new Date(deadline);
    await action.save();

    await createAuditLog({
      action: 'ACTION_APPROVED',
      performedBy: req.user._id,
      targetResource: 'Action',
      targetId: action._id,
      req,
    });

    try { getIO().emit('action_approved', { actionId: action._id }); } catch (_) {}

    res.json({ message: 'Action approved', action });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/actions/:id/reject
const rejectAction = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const action = await Action.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'rejected', status: 'cancelled', reviewedBy: req.user._id, reviewedAt: new Date(), adminNotes },
      { new: true }
    );
    if (!action) return res.status(404).json({ message: 'Action not found' });

    await createAuditLog({
      action: 'ACTION_REJECTED',
      performedBy: req.user._id,
      targetResource: 'Action',
      targetId: action._id,
      req,
    });

    res.json({ message: 'Action rejected', action });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/actions/:id/progress
const addProgressUpdate = async (req, res) => {
  try {
    const { note, status } = req.body;
    const action = await Action.findById(req.params.id);
    if (!action) return res.status(404).json({ message: 'Action not found' });

    action.progressUpdates.push({ note, updatedBy: req.user._id });
    if (status) {
      action.status = status;
      if (status === 'in_progress' && !action.startedAt) action.startedAt = new Date();
      if (status === 'completed') action.completedAt = new Date();
    }
    await action.save();

    if (status === 'completed') {
      await createAuditLog({
        action: 'ACTION_COMPLETED',
        performedBy: req.user._id,
        targetResource: 'Action',
        targetId: action._id,
        req,
      });
    }

    res.json({ message: 'Progress updated', action });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  generateActionRecommendation, getActions, getActionById,
  approveAction, rejectAction, addProgressUpdate,
};

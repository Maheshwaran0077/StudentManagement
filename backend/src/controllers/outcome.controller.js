const Outcome = require('../models/Outcome');
const Action = require('../models/Action');
const Pattern = require('../models/Pattern');
const { createAuditLog } = require('../middleware/audit');
const { measureOutcome } = require('../services/aiService');

// POST /api/outcomes/measure/:actionId
const measureActionOutcome = async (req, res) => {
  try {
    const action = await Action.findById(req.params.actionId).populate('patternId');
    if (!action) return res.status(404).json({ message: 'Action not found' });

    const pattern = action.patternId;

    const result = await measureOutcome({
      action_id: action._id.toString(),
      pattern_id: pattern?._id?.toString(),
      action_completed_at: action.completedAt || new Date(),
      category: pattern?.category,
      location: pattern?.location,
      grievance_ids: action.grievanceIds?.map((g) => g.toString()),
    });

    const existing = await Outcome.findOne({ actionId: action._id });

    const outcomeData = {
      actionId: action._id,
      patternId: pattern?._id,
      before: result.before,
      after: result.after,
      improvementRate: result.improvement_rate,
      sentimentImprovement: result.sentiment_improvement,
      effectivenessScore: result.effectiveness_score,
      verdict: result.verdict,
      recurrenceDetected: result.recurrence_detected,
      recurrenceScore: result.recurrence_score,
      recurrenceGrievanceIds: result.recurrence_grievance_ids || [],
      measuredAt: new Date(),
      measuredBy: req.user._id,
      notes: req.body.notes,
      lastCheckedAt: new Date(),
    };

    let outcome;
    if (existing) {
      outcome = await Outcome.findByIdAndUpdate(existing._id, outcomeData, { new: true });
    } else {
      outcome = await Outcome.create(outcomeData);
    }

    await createAuditLog({
      action: 'OUTCOME_MEASURED',
      performedBy: req.user._id,
      targetResource: 'Outcome',
      targetId: outcome._id,
      req,
    });

    res.json({ message: 'Outcome measured', outcome });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/outcomes
const getOutcomes = async (req, res) => {
  try {
    const outcomes = await Outcome.find()
      .populate('actionId', 'title actionId status')
      .populate('patternId', 'title category')
      .sort({ measuredAt: -1 });
    res.json({ outcomes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/outcomes/:id
const getOutcomeById = async (req, res) => {
  try {
    const outcome = await Outcome.findById(req.params.id)
      .populate('actionId')
      .populate('patternId');
    if (!outcome) return res.status(404).json({ message: 'Outcome not found' });
    res.json({ outcome });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { measureActionOutcome, getOutcomes, getOutcomeById };

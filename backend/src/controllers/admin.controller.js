const User = require('../models/User');
const Grievance = require('../models/Grievance');
const Pattern = require('../models/Pattern');
const Action = require('../models/Action');
const Outcome = require('../models/Outcome');
const { createAuditLog } = require('../middleware/audit');

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 30, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/role
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await createAuditLog({
      action: 'USER_ROLE_CHANGED',
      performedBy: req.user._id,
      targetResource: 'User',
      targetId: user._id,
      details: { newRole: role },
      req,
    });

    res.json({ message: 'Role updated', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/admin/users/:id/toggle-active
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, totalGrievances, openGrievances, resolvedGrievances,
      totalPatterns, pendingActions, completedActions, recurrenceCount,
    ] = await Promise.all([
      User.countDocuments(),
      Grievance.countDocuments(),
      Grievance.countDocuments({ status: { $in: ['submitted', 'under_review', 'in_progress'] } }),
      Grievance.countDocuments({ status: 'resolved' }),
      Pattern.countDocuments({ status: 'active' }),
      Action.countDocuments({ approvalStatus: 'pending' }),
      Action.countDocuments({ status: 'completed' }),
      Outcome.countDocuments({ recurrenceDetected: true }),
    ]);

    res.json({
      totalUsers, totalGrievances, openGrievances, resolvedGrievances,
      totalPatterns, pendingActions, completedActions, recurrenceCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUsers, changeUserRole, toggleUserActive, getDashboardStats };

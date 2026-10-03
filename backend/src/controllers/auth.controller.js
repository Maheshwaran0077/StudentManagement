const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/audit');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, rollNumber, employeeId, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    // Only allow non-admin roles through self-registration
    const allowedRoles = ['student', 'faculty', 'staff'];
    const assignedRole = allowedRoles.includes(role) ? role : 'student';

    const user = await User.create({
      name, email, password,
      role: assignedRole,
      department, rollNumber, employeeId, phone,
    });

    await createAuditLog({
      action: 'USER_REGISTERED',
      performedBy: user._id,
      targetResource: 'User',
      targetId: user._id,
      req,
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isActive)
      return res.status(403).json({ message: 'Account deactivated. Contact administrator.' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      action: 'USER_LOGIN',
      performedBy: user._id,
      targetResource: 'User',
      targetId: user._id,
      req,
    });

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name code');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, rollNumber, employeeId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, rollNumber, employeeId },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };

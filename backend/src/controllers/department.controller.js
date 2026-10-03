const Department = require('../models/Department');
const { createAuditLog } = require('../middleware/audit');

const createDepartment = async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    await createAuditLog({ action: 'DEPARTMENT_CREATED', performedBy: req.user._id, targetResource: 'Department', targetId: dept._id, req });
    res.status(201).json({ department: dept });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).populate('head', 'name email');
    res.json({ departments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    await createAuditLog({ action: 'DEPARTMENT_UPDATED', performedBy: req.user._id, targetResource: 'Department', targetId: dept._id, req });
    res.json({ department: dept });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { createDepartment, getDepartments, updateDepartment };

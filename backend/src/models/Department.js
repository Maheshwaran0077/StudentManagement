const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    description: { type: String, trim: true },
    categories: [{ type: String }], // grievance categories this dept handles
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);

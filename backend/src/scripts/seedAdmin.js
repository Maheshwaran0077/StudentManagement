require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const ADMIN_NAME  = 'Super Admin';
const ADMIN_EMAIL = 'admin@campusguardian.com';
const ADMIN_PASS  = 'Admin@123';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'campus_guardian_360' });
  console.log('Connected to MongoDB');

  // Dynamic import of model (avoids duplicate model registration)
  const User = require('../models/User');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name:     ADMIN_NAME,
    email:    ADMIN_EMAIL,
    password: ADMIN_PASS,   // model pre-save hook hashes this automatically
    role:     'admin',
    isActive: true,
  });

  console.log('✅ Admin user created successfully');
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASS}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });

require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../models/Department');

const DEPARTMENTS = [
  {
    name: 'Electrical and Electronics Engineering',
    code: 'EEE',
    description: 'Handles electrical systems, power, and electronics infrastructure',
    categories: ['Infrastructure', 'IT/Network', 'Safety'],
  },
  {
    name: 'Electronics and Communication Engineering',
    code: 'ECE',
    description: 'Handles communication systems, labs, and electronic equipment',
    categories: ['Infrastructure', 'IT/Network', 'Academic'],
  },
  {
    name: 'Artificial Intelligence and Machine Learning',
    code: 'AIML',
    description: 'Handles AI/ML labs, GPU clusters, and software infrastructure',
    categories: ['IT/Network', 'Academic', 'Infrastructure'],
  },
  {
    name: 'Artificial Intelligence and Data Science',
    code: 'AIDS',
    description: 'Handles data science labs, analytics tools, and academic operations',
    categories: ['IT/Network', 'Academic', 'Administrative'],
  },
  {
    name: 'Mechanical Engineering',
    code: 'MECH',
    description: 'Handles workshops, mechanical labs, and manufacturing facilities',
    categories: ['Infrastructure', 'Safety', 'Administrative'],
  },
  {
    name: 'Robotics Engineering',
    code: 'ROBOTICS',
    description: 'Handles robotics labs, automation systems, and research equipment',
    categories: ['Infrastructure', 'IT/Network', 'Academic', 'Safety'],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'campus_guardian_360' });
  console.log('Connected to MongoDB\n');

  let created = 0;
  let skipped = 0;

  for (const dept of DEPARTMENTS) {
    const existing = await Department.findOne({ code: dept.code });
    if (existing) {
      console.log(`⏭  Skipped (already exists): ${dept.code} — ${dept.name}`);
      skipped++;
    } else {
      await Department.create({ ...dept, isActive: true });
      console.log(`✅ Created: ${dept.code} — ${dept.name}`);
      created++;
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err.message); process.exit(1); });

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connected to MongoDB for seeding...');

    const existing = await User.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
    if (existing) {
      console.log('✅ Admin user already exists. Skipping seed.');
      process.exit(0);
    }

    const admin = await User.create({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
    });

    console.log(`✅ Admin user created: ${admin.username}`);
    console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();

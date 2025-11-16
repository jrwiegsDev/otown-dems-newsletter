// backend/utils/setSuperAdmin.js
// Run this script to set a user as super admin
// Usage: node utils/setSuperAdmin.js <username>

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/userModel');

const setSuperAdmin = async () => {
  try {
    const username = process.argv[2];

    if (!username) {
      console.log('❌ Usage: node utils/setSuperAdmin.js <username>');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      console.log(`❌ User "${username}" not found`);
      process.exit(1);
    }

    // Update role
    user.role = 'superadmin';
    await user.save();

    console.log(`✅ User "${username}" is now a Super Admin`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Full Name: ${user.fullName}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

setSuperAdmin();

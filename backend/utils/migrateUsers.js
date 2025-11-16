// backend/utils/migrateUsers.js
// Run this script once to add role, email, and fullName fields to existing users

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/userModel');

const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`\n📊 Found ${users.length} users to migrate`);

    if (users.length === 0) {
      console.log('⚠️  No users found in database');
      process.exit(0);
    }

    // Update each user
    for (const user of users) {
      const updates = {};
      let needsUpdate = false;

      // Add role if missing (default to admin)
      if (!user.role) {
        updates.role = 'admin';
        needsUpdate = true;
      }

      // Add email if missing (prompt for input or use username@example.com)
      if (!user.email) {
        updates.email = `${user.username}@example.com`;
        needsUpdate = true;
        console.log(`⚠️  User "${user.username}" missing email, setting to: ${updates.email}`);
        console.log(`   Please update this email address manually!`);
      }

      // Add fullName if missing (use username as placeholder)
      if (!user.fullName) {
        updates.fullName = user.username;
        needsUpdate = true;
        console.log(`⚠️  User "${user.username}" missing full name, setting to: ${updates.fullName}`);
        console.log(`   Please update this full name manually!`);
      }

      if (needsUpdate) {
        await User.findByIdAndUpdate(user._id, updates);
        console.log(`✅ Updated user: ${user.username}`);
      } else {
        console.log(`✓ User "${user.username}" already has all required fields`);
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update placeholder emails and full names for your users');
    console.log('   2. Set one user as superadmin:');
    console.log('      - Run: node utils/setSuperAdmin.js <username>');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateUsers();

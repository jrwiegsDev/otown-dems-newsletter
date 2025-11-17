// Fix Week 46 ending date (should be Sunday, not Saturday)
require('dotenv').config();
const mongoose = require('mongoose');
const PollAnalytics = require('../models/pollAnalyticsModel');

async function fixWeek46Date() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const week46 = await PollAnalytics.findOne({ weekIdentifier: '2025-W46' });
    
    if (!week46) {
      console.log('❌ No Week 46 record found');
      process.exit(1);
    }

    console.log('Current Week 46 ending:', week46.weekEnding);

    // The correct Sunday for Week 46 should be November 16, 2025
    // ISO week 46 of 2025 runs from Monday Nov 10 - Sunday Nov 16
    const correctWeekEnding = new Date('2025-11-16T23:59:59.999Z');

    week46.weekEnding = correctWeekEnding;
    await week46.save();

    console.log('✅ Updated Week 46 ending to:', correctWeekEnding);
    console.log('   Display:', correctWeekEnding.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'America/Chicago'
    }));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWeek46Date();

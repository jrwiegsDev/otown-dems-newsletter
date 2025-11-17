// Utility to check and fix Week 46 analytics entry
require('dotenv').config();
const mongoose = require('mongoose');
const PollAnalytics = require('../models/pollAnalyticsModel');

async function fixWeek46() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find Week 46 record
    const week46 = await PollAnalytics.findOne({ weekIdentifier: '2025-W46' });
    
    if (!week46) {
      console.log('❌ No Week 46 record found in database');
      process.exit(0);
    }

    console.log('\n📊 Current Week 46 Record:');
    console.log('  Week Identifier:', week46.weekIdentifier);
    console.log('  Week Ending:', week46.weekEnding);
    console.log('  Total Votes:', week46.totalVotes);
    console.log('  Archived At:', week46.archivedAt);

    // Calculate the CORRECT Sunday for Week 46
    const year = 2025;
    const weekNumber = 46;
    const jan1 = new Date(year, 0, 1);
    const daysToAdd = (weekNumber - 1) * 7 + (7 - jan1.getDay());
    const correctWeekEnding = new Date(year, 0, daysToAdd);
    correctWeekEnding.setHours(23, 59, 59, 999);

    console.log('\n✨ Correct Week 46 Ending Date should be:', correctWeekEnding);

    // Check if it matches
    const currentDate = new Date(week46.weekEnding).toDateString();
    const correctDate = correctWeekEnding.toDateString();

    if (currentDate === correctDate) {
      console.log('✅ Week 46 has the correct ending date. No fix needed.');
    } else {
      console.log('⚠️  Week 46 has the WRONG ending date!');
      console.log('   Current:', currentDate);
      console.log('   Should be:', correctDate);
      
      // Update the record
      week46.weekEnding = correctWeekEnding;
      await week46.save();
      
      console.log('✅ Week 46 record updated with correct ending date');
    }

    // Get all analytics records sorted by date
    console.log('\n📅 All Analytics Records:');
    const allRecords = await PollAnalytics.find({}).sort({ weekEnding: 1 });
    allRecords.forEach(record => {
      const weekStart = new Date(record.weekEnding);
      weekStart.setDate(record.weekEnding.getDate() - 6);
      console.log(`  ${record.weekIdentifier}: ${weekStart.toLocaleDateString()} - ${record.weekEnding.toLocaleDateString()} (${record.totalVotes} votes)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWeek46();

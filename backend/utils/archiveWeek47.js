// backend/utils/archiveWeek47.js
// Safely archive ONLY week 47, leaving current week (W48) untouched

const mongoose = require('mongoose');
const PollVote = require('../models/pollVoteModel');
const PollAnalytics = require('../models/pollAnalyticsModel');
require('dotenv').config();

const VALID_ISSUES = [
  'Government Corruption',
  'Cost of Living / Inflation',
  'The Economy',
  'State of US Democracy',
  'Disruption of Federal Government Services',
  'Government Shutdown',
  'Treatment of Immigrants by ICE',
  'Climate Change',
  'Crime',
  'Personal Financial Situation',
  'Releasing the Epstein Files'
];

async function archiveWeek47() {
  try {
    console.log('🔄 Archiving Week 47 ONLY (W48 current votes will NOT be touched)...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const targetWeek = '2025-W47';
    
    // Find votes for W47 ONLY
    const w47Votes = await PollVote.find({ weekIdentifier: targetWeek });
    
    console.log(`📊 Found ${w47Votes.length} votes for ${targetWeek}`);
    
    if (w47Votes.length === 0) {
      console.log(`ℹ️  No votes found for ${targetWeek}, nothing to archive.`);
      await mongoose.connection.close();
      return;
    }

    // Calculate issue counts
    const issueCounts = {};
    VALID_ISSUES.forEach(issue => {
      issueCounts[issue] = 0;
    });

    w47Votes.forEach(vote => {
      vote.selectedIssues.forEach(issue => {
        if (issueCounts[issue] !== undefined) {
          issueCounts[issue]++;
        }
      });
    });

    console.log('\nIssue counts for W47:');
    Object.entries(issueCounts).forEach(([issue, count]) => {
      if (count > 0) {
        console.log(`   ${issue}: ${count}`);
      }
    });

    // Calculate the Sunday that ended week 47
    // W47 = week 47 of 2025
    const weekNumber = 47;
    const year = 2025;
    
    const jan1 = new Date(year, 0, 1);
    const daysToAdd = (weekNumber - 1) * 7 + (7 - jan1.getDay());
    const weekEnding = new Date(year, 0, daysToAdd);
    weekEnding.setHours(23, 59, 59, 999);

    console.log(`\n📅 Week ending date: ${weekEnding.toLocaleDateString()}`);

    // Check if analytics already exist for this week
    const existingAnalytics = await PollAnalytics.findOne({ weekIdentifier: targetWeek });
    
    if (existingAnalytics) {
      console.log(`\n⚠️  Analytics already exist for ${targetWeek}, updating...`);
      existingAnalytics.totalVotes = w47Votes.length;
      existingAnalytics.issueCounts = issueCounts;
      existingAnalytics.archivedAt = new Date();
      existingAnalytics.weekEnding = weekEnding;
      await existingAnalytics.save();
      console.log(`✅ Updated existing analytics for ${targetWeek}`);
    } else {
      // Create new analytics entry
      await PollAnalytics.create({
        weekIdentifier: targetWeek,
        weekEnding: weekEnding,
        totalVotes: w47Votes.length,
        issueCounts: issueCounts,
        archivedAt: new Date()
      });
      console.log(`✅ Created new analytics entry for ${targetWeek}`);
    }

    // Delete ONLY W47 votes
    const deleteResult = await PollVote.deleteMany({ weekIdentifier: targetWeek });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} vote records for ${targetWeek}`);

    // Verify W48 votes are still there
    const w48Votes = await PollVote.find({ weekIdentifier: '2025-W48' });
    console.log(`\n✅ Verified: W48 still has ${w48Votes.length} votes (untouched)`);

    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('\n✨ Week 47 archived successfully!');
    console.log(`   Archived ${w47Votes.length} votes from W47`);
    console.log(`   Current W48 votes remain safe: ${w48Votes.length} votes\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

archiveWeek47()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

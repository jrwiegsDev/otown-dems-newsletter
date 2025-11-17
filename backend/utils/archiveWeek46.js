// Utility to manually archive Week 46
require('dotenv').config();
const mongoose = require('mongoose');
const PollAnalytics = require('../models/pollAnalyticsModel');
const PollVote = require('../models/pollVoteModel');

// Same valid issues as in your pollRoutes.js
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

async function archiveWeek46() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const weekIdentifier = '2025-W46';
    
    // Get Week 46 votes
    const week46Votes = await PollVote.find({ weekIdentifier });
    
    console.log(`\n📊 Found ${week46Votes.length} votes for Week 46`);
    
    if (week46Votes.length === 0) {
      console.log('❌ No Week 46 votes to archive');
      process.exit(0);
    }

    // Calculate issue counts
    const issueCounts = {};
    VALID_ISSUES.forEach(issue => {
      issueCounts[issue] = 0;
    });

    week46Votes.forEach(vote => {
      console.log(`  Vote: ${vote.selectedIssues.join(', ')}`);
      vote.selectedIssues.forEach(issue => {
        if (issueCounts[issue] !== undefined) {
          issueCounts[issue]++;
        }
      });
    });

    console.log('\n📈 Issue Counts:');
    Object.entries(issueCounts).forEach(([issue, count]) => {
      if (count > 0) {
        console.log(`  ${issue}: ${count}`);
      }
    });

    // Calculate the correct Sunday for Week 46
    const year = 2025;
    const weekNumber = 46;
    const jan1 = new Date(year, 0, 1);
    const daysToAdd = (weekNumber - 1) * 7 + (7 - jan1.getDay());
    const weekEnding = new Date(year, 0, daysToAdd);
    weekEnding.setHours(23, 59, 59, 999);

    console.log('\n📅 Week 46 Ending Date:', weekEnding.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }));

    // Create analytics record
    await PollAnalytics.create({
      weekIdentifier,
      weekEnding,
      totalVotes: week46Votes.length,
      issueCounts
    });

    console.log('✅ Created analytics record for Week 46');

    // Delete the Week 46 votes
    const deleteResult = await PollVote.deleteMany({ weekIdentifier });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} Week 46 votes from active poll`);

    console.log('\n✨ Week 46 successfully archived!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

archiveWeek46();

// Utility to check all analytics records
require('dotenv').config();
const mongoose = require('mongoose');
const PollAnalytics = require('../models/pollAnalyticsModel');
const PollVote = require('../models/pollVoteModel');

async function checkAnalytics() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all analytics records
    const analytics = await PollAnalytics.find({}).sort({ weekEnding: 1 });
    
    console.log(`\n📊 Total Analytics Records: ${analytics.length}\n`);
    
    analytics.forEach(record => {
      const weekStart = new Date(record.weekEnding);
      weekStart.setDate(record.weekEnding.getDate() - 6);
      const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = record.weekEnding.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      console.log(`${record.weekIdentifier}:`);
      console.log(`  Date Range: ${startStr} - ${endStr}`);
      console.log(`  Total Votes: ${record.totalVotes}`);
      console.log(`  Archived At: ${record.archivedAt.toLocaleString()}`);
      
      // Get top issue
      const issueCounts = record.issueCounts;
      let topIssue = '';
      let topCount = 0;
      Object.entries(issueCounts).forEach(([issue, count]) => {
        if (count > topCount) {
          topCount = count;
          topIssue = issue;
        }
      });
      console.log(`  Top Issue: ${topIssue} (${topCount} votes)`);
      console.log('');
    });

    // Check current votes
    const currentVotes = await PollVote.find({});
    console.log(`📝 Current Active Votes: ${currentVotes.length}`);
    
    if (currentVotes.length > 0) {
      const weekGroups = {};
      currentVotes.forEach(vote => {
        if (!weekGroups[vote.weekIdentifier]) {
          weekGroups[vote.weekIdentifier] = 0;
        }
        weekGroups[vote.weekIdentifier]++;
      });
      
      console.log('\nVotes by week:');
      Object.entries(weekGroups).forEach(([week, count]) => {
        console.log(`  ${week}: ${count} votes`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAnalytics();

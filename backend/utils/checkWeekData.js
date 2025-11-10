// backend/utils/checkWeekData.js
// Script to check what data exists for different weeks

const mongoose = require('mongoose');
const PollVote = require('../models/pollVoteModel');
const PollAnalytics = require('../models/pollAnalyticsModel');
require('dotenv').config();

async function checkWeekData() {
  try {
    console.log('🔍 Checking week data...\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check all votes
    console.log('📊 PollVote Documents:');
    const votes = await PollVote.find({}).sort({ weekIdentifier: 1 });
    
    const votesByWeek = {};
    votes.forEach(vote => {
      if (!votesByWeek[vote.weekIdentifier]) {
        votesByWeek[vote.weekIdentifier] = [];
      }
      votesByWeek[vote.weekIdentifier].push(vote);
    });

    if (Object.keys(votesByWeek).length === 0) {
      console.log('   No votes found in PollVote collection');
    } else {
      for (const [week, weekVotes] of Object.entries(votesByWeek)) {
        console.log(`   Week ${week}: ${weekVotes.length} votes`);
        weekVotes.forEach((vote, i) => {
          console.log(`      Vote ${i+1}: ${vote.selectedIssues.join(', ')}`);
        });
      }
    }

    // Check analytics
    console.log('\n📈 PollAnalytics Documents:');
    const analytics = await PollAnalytics.find({}).sort({ weekIdentifier: 1 });
    
    if (analytics.length === 0) {
      console.log('   No analytics found');
    } else {
      analytics.forEach(analytic => {
        console.log(`   Week ${analytic.weekIdentifier}:`);
        console.log(`      Total votes: ${analytic.totalVotes}`);
        console.log(`      Archived at: ${analytic.archivedAt}`);
        console.log(`      Issue counts:`, analytic.issueCounts);
      });
    }

    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkWeekData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

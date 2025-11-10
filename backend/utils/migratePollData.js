// backend/utils/migratePollData.js
// Migration script to update poll issue names from "U.S." to "US"

const mongoose = require('mongoose');
const PollVote = require('../models/pollVoteModel');
const PollAnalytics = require('../models/pollAnalyticsModel');
require('dotenv').config();

const OLD_TO_NEW_MAPPING = {
  'State of U.S. Democracy': 'State of US Democracy'
};

async function migratePollData() {
  try {
    console.log('🔄 Starting poll data migration...');
    console.log('   Updating "State of U.S. Democracy" → "State of US Democracy"\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Update PollVote documents
    console.log('\n📊 Migrating PollVote documents...');
    const votes = await PollVote.find({});
    console.log(`   Found ${votes.length} vote documents`);

    let votesUpdated = 0;
    for (const vote of votes) {
      let updated = false;
      const newSelectedIssues = vote.selectedIssues.map(issue => {
        if (OLD_TO_NEW_MAPPING[issue]) {
          updated = true;
          return OLD_TO_NEW_MAPPING[issue];
        }
        return issue;
      });

      if (updated) {
        vote.selectedIssues = newSelectedIssues;
        await vote.save();
        votesUpdated++;
      }
    }
    console.log(`✅ Updated ${votesUpdated} vote documents`);

    // Step 2: Update PollAnalytics documents
    console.log('\n📈 Migrating PollAnalytics documents...');
    const analytics = await PollAnalytics.find({});
    console.log(`   Found ${analytics.length} analytics documents`);

    let analyticsUpdated = 0;
    for (const analytic of analytics) {
      let updated = false;
      const newIssueCounts = {};

      for (const [issue, count] of Object.entries(analytic.issueCounts)) {
        const newIssue = OLD_TO_NEW_MAPPING[issue] || issue;
        newIssueCounts[newIssue] = count;
        if (OLD_TO_NEW_MAPPING[issue]) {
          updated = true;
        }
      }

      if (updated) {
        analytic.issueCounts = newIssueCounts;
        analytic.markModified('issueCounts'); // Required for Mixed type
        await analytic.save();
        analyticsUpdated++;
      }
    }
    console.log(`✅ Updated ${analyticsUpdated} analytics documents`);

    console.log('\n✨ Migration completed successfully!');
    console.log(`   Total votes updated: ${votesUpdated}`);
    console.log(`   Total analytics updated: ${analyticsUpdated}`);

    // Disconnect
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migratePollData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = migratePollData;

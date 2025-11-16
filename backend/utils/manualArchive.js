// backend/utils/manualArchive.js
// Manually run the archive function to catch up on missed weeks
// This bypasses the time safety check for manual execution

const mongoose = require('mongoose');
const PollVote = require('../models/pollVoteModel');
const PollAnalytics = require('../models/pollAnalyticsModel');
require('dotenv').config();

// Valid issues list (must match pollRoutes.js)
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
  'Personal Financial Situation'
];

// Helper function to get current week identifier
function getCurrentWeekIdentifier() {
  const nowUTC = new Date();
  const chicagoTime = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  
  const thursday = new Date(chicagoTime);
  thursday.setDate(chicagoTime.getDate() + (4 - (chicagoTime.getDay() || 7)));
  
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
  
  return `${thursday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

async function runManualArchive() {
  try {
    console.log('🔄 Manually running poll archive (bypassing time checks)...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const currentWeekId = getCurrentWeekIdentifier();
    
    // Find ALL votes that are NOT from the current week
    const allVotes = await PollVote.find({});
    
    console.log(`📊 Found ${allVotes.length} total votes in database`);
    console.log(`📅 Current week: ${currentWeekId}\n`);
    
    // Group votes by week identifier
    const votesByWeek = new Map();
    allVotes.forEach(vote => {
      if (vote.weekIdentifier !== currentWeekId) {
        if (!votesByWeek.has(vote.weekIdentifier)) {
          votesByWeek.set(vote.weekIdentifier, []);
        }
        votesByWeek.get(vote.weekIdentifier).push(vote);
      }
    });

    console.log(`📦 Found ${votesByWeek.size} old week(s) to archive\n`);

    if (votesByWeek.size === 0) {
      console.log(`ℹ️  No old weeks to archive. Current week ${currentWeekId} is still active.`);
    }

    // Archive each week's votes
    for (const [weekId, votes] of votesByWeek) {
      if (votes.length === 0) continue;

      console.log(`📊 Archiving week ${weekId} (${votes.length} votes)...`);

      // Calculate issue counts
      const issueCounts = new Map();
      VALID_ISSUES.forEach(issue => {
        issueCounts.set(issue, 0);
      });

      votes.forEach(vote => {
        vote.selectedIssues.forEach(issue => {
          if (issueCounts.has(issue)) {
            issueCounts.set(issue, issueCounts.get(issue) + 1);
          }
        });
      });

      // Calculate the Sunday that ended this week
      const weekNumber = parseInt(weekId.split('-W')[1]);
      const year = parseInt(weekId.split('-W')[0]);
      
      const jan1 = new Date(year, 0, 1);
      const daysToAdd = (weekNumber - 1) * 7 + (7 - jan1.getDay());
      const weekEnding = new Date(year, 0, daysToAdd);
      weekEnding.setHours(23, 59, 59, 999);

      // Check if analytics already exist for this week
      const existingAnalytics = await PollAnalytics.findOne({ weekIdentifier: weekId });
      
      // Convert Map to plain object for Mongoose
      const issueCountsObject = Object.fromEntries(issueCounts);
      
      if (existingAnalytics) {
        console.log(`   ⚠️  Analytics already exist for ${weekId}, updating...`);
        existingAnalytics.totalVotes = votes.length;
        existingAnalytics.issueCounts = issueCountsObject;
        existingAnalytics.archivedAt = new Date();
        await existingAnalytics.save();
      } else {
        // Save to analytics
        await PollAnalytics.create({
          weekIdentifier: weekId,
          weekEnding: weekEnding,
          totalVotes: votes.length,
          issueCounts: issueCountsObject,
          archivedAt: new Date()
        });
      }

      console.log(`   ✅ Archived ${votes.length} votes for week ${weekId}`);

      // Delete the archived votes for this specific week
      const deleteResult = await PollVote.deleteMany({ weekIdentifier: weekId });
      console.log(`   🗑️  Deleted ${deleteResult.deletedCount} vote records\n`);
    }

    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    console.log('\n✨ Manual archive completed successfully!');
    console.log(`   Weeks archived: ${votesByWeek.size}`);
    console.log(`   Current active week: ${currentWeekId}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runManualArchive()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

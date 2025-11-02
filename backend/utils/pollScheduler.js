// backend/utils/pollScheduler.js

const cron = require('node-cron');
const PollVote = require('../models/pollVoteModel');
const PollAnalytics = require('../models/pollAnalyticsModel');

// Valid issues list (must match pollRoutes.js)
const VALID_ISSUES = [
  'Government Corruption',
  'Cost of Living / Inflation',
  'The Economy',
  'State of U.S. Democracy',
  'Disruption of Federal Government Services',
  'Government Shutdown',
  'Treatment of Immigrants by ICE',
  'Climate Change',
  'Crime',
  'Personal Financial Situation'
];

// Helper function to get current week identifier (ISO week)
function getCurrentWeekIdentifier() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Helper function to get previous week identifier
function getPreviousWeekIdentifier() {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfYear = new Date(lastWeek.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((lastWeek - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
  return `${lastWeek.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Archive last week's poll results and clear old votes
async function archiveAndResetPoll() {
  try {
    console.log('🗳️  Starting weekly poll reset and archival...');

    const now = new Date();
    const currentWeekId = getCurrentWeekIdentifier();
    
    // Important: When this runs on Monday at midnight (start of new week),
    // we want to archive the week that JUST ENDED (which is still technically "last week")
    // We'll find ALL votes that are NOT from the current week
    const allVotes = await PollVote.find({});
    
    console.log(`📊 Found ${allVotes.length} total votes in database`);
    
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

    console.log(`📅 Current week: ${currentWeekId}`);
    console.log(`📦 Found ${votesByWeek.size} week(s) to archive`);

    // Archive each week's votes
    for (const [weekId, votes] of votesByWeek) {
      if (votes.length === 0) continue;

      console.log(`\n📊 Archiving week ${weekId} (${votes.length} votes)...`);

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
      // Extract week number from identifier (e.g., "2025-W44" -> 44)
      const weekNumber = parseInt(weekId.split('-W')[1]);
      const year = parseInt(weekId.split('-W')[0]);
      
      // Calculate the date of Sunday for that week
      const jan1 = new Date(year, 0, 1);
      const daysToAdd = (weekNumber - 1) * 7 + (7 - jan1.getDay());
      const weekEnding = new Date(year, 0, daysToAdd);
      weekEnding.setHours(23, 59, 59, 999);

      // Check if analytics already exist for this week
      const existingAnalytics = await PollAnalytics.findOne({ weekIdentifier: weekId });
      
      if (existingAnalytics) {
        console.log(`⚠️  Analytics already exist for ${weekId}, updating...`);
        existingAnalytics.totalVotes = votes.length;
        existingAnalytics.issueCounts = issueCounts;
        existingAnalytics.archivedAt = new Date();
        await existingAnalytics.save();
      } else {
        // Save to analytics
        await PollAnalytics.create({
          weekIdentifier: weekId,
          weekEnding: weekEnding,
          totalVotes: votes.length,
          issueCounts: issueCounts,
          archivedAt: new Date()
        });
      }

      console.log(`✅ Archived ${votes.length} votes for week ${weekId}`);

      // Delete the archived votes for this specific week
      const deleteResult = await PollVote.deleteMany({ weekIdentifier: weekId });
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} vote records for week ${weekId}`);
    }

    if (votesByWeek.size === 0) {
      console.log(`ℹ️  No old weeks to archive. Current week ${currentWeekId} is still active.`);
    }

    // Broadcast reset notification if available
    if (global.broadcastPollResults) {
      global.broadcastPollResults({
        weekIdentifier: currentWeekId,
        totalVotes: 0,
        issueCounts: Object.fromEntries(VALID_ISSUES.map(issue => [issue, 0])),
        issues: VALID_ISSUES,
        reset: true
      });
    }

    console.log('\n✨ Weekly poll reset completed successfully!');
    console.log(`📅 New active week: ${currentWeekId}\n`);

  } catch (error) {
    console.error('❌ Error during poll reset and archival:', error);
  }
}

// Schedule the job to run every Sunday at 23:59 (just before midnight)
// Cron format: minute hour day month weekday
// '59 23 * * 0' = At 23:59 on Sunday (day 0)
function startPollScheduler() {
  // Run every Sunday at 11:59 PM to archive the week and reset for Monday
  cron.schedule('59 23 * * 0', () => {
    console.log('⏰ Cron job triggered: Sunday 11:59 PM poll reset');
    archiveAndResetPoll();
  }, {
    timezone: 'America/Chicago' // Adjust to your timezone
  });

  console.log('📅 Poll scheduler initialized - Weekly reset every Sunday at 23:59 CST');
}

module.exports = { startPollScheduler, archiveAndResetPoll };

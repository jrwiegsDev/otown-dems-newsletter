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

    const previousWeekId = getPreviousWeekIdentifier();
    const currentWeekId = getCurrentWeekIdentifier();

    // Get all votes from previous week
    const previousVotes = await PollVote.find({ weekIdentifier: previousWeekId });

    if (previousVotes.length > 0) {
      // Calculate issue counts
      const issueCounts = new Map();
      VALID_ISSUES.forEach(issue => {
        issueCounts.set(issue, 0);
      });

      previousVotes.forEach(vote => {
        vote.selectedIssues.forEach(issue => {
          if (issueCounts.has(issue)) {
            issueCounts.set(issue, issueCounts.get(issue) + 1);
          }
        });
      });

      // Get the Sunday that ended the previous week
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek; // If today is Monday (1), go back 1 day to Sunday
      const weekEnding = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
      weekEnding.setHours(23, 59, 59, 999);

      // Save to analytics
      const analytics = await PollAnalytics.findOneAndUpdate(
        { weekIdentifier: previousWeekId },
        {
          weekIdentifier: previousWeekId,
          weekEnding: weekEnding,
          totalVotes: previousVotes.length,
          issueCounts: issueCounts,
          archivedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Archived ${previousVotes.length} votes for week ${previousWeekId}`);

      // Delete old votes (keep last 2 weeks for safety)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const deleteResult = await PollVote.deleteMany({
        votedAt: { $lt: twoWeeksAgo }
      });

      console.log(`🗑️  Deleted ${deleteResult.deletedCount} old vote records`);
    } else {
      console.log(`ℹ️  No votes to archive for week ${previousWeekId}`);
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

    console.log('✨ Weekly poll reset completed successfully!');

  } catch (error) {
    console.error('❌ Error during poll reset and archival:', error);
  }
}

// Schedule the job to run every Monday at 00:00 (midnight)
// Cron format: second minute hour day month weekday
// '0 0 * * 1' = At 00:00 on Monday
function startPollScheduler() {
  // Run every Monday at midnight
  cron.schedule('0 0 * * 1', () => {
    console.log('⏰ Cron job triggered: Monday midnight poll reset');
    archiveAndResetPoll();
  }, {
    timezone: 'America/Chicago' // Adjust to your timezone
  });

  console.log('📅 Poll scheduler initialized - Weekly reset every Monday at 00:00 CST');
}

module.exports = { startPollScheduler, archiveAndResetPoll };

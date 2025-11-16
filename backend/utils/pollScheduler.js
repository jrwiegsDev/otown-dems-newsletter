// backend/utils/pollScheduler.js

const cron = require('node-cron');
const PollVote = require('../models/pollVoteModel');
const PollAnalytics = require('../models/pollAnalyticsModel');

// VALID ISSUES: Complete list for historical data validation and archiving
// NEVER remove items from this list - only add new ones as they become relevant
// This ensures historical analytics preserve exact vote counts for all issues,
// even when issues rotate out of active voting
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

// Helper function to get current week identifier (ISO week)
// ISO 8601: Week starts on Monday, Week 1 contains Jan 4th
// Uses America/Chicago timezone for consistency
function getCurrentWeekIdentifier() {
  // Get current time in Chicago timezone
  const nowUTC = new Date();
  const chicagoTime = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  
  // Get the Thursday of the current week (ISO week date system uses Thursday)
  const thursday = new Date(chicagoTime);
  thursday.setDate(chicagoTime.getDate() + (4 - (chicagoTime.getDay() || 7)));
  
  // Get January 1st of the Thursday's year
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  
  // Calculate week number
  const weekNumber = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
  
  return `${thursday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Helper function to get previous week identifier
// ISO 8601: Week starts on Monday, Week 1 contains Jan 4th
// Uses America/Chicago timezone for consistency
function getPreviousWeekIdentifier() {
  // Get current time in Chicago timezone, then go back 7 days
  const nowUTC = new Date();
  const chicagoTime = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const lastWeek = new Date(chicagoTime);
  lastWeek.setDate(chicagoTime.getDate() - 7);
  
  // Get the Thursday of the previous week
  const thursday = new Date(lastWeek);
  thursday.setDate(lastWeek.getDate() + (4 - (lastWeek.getDay() || 7)));
  
  // Get January 1st of the Thursday's year
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  
  // Calculate week number
  const weekNumber = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
  
  return `${thursday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Archive last week's poll results and clear old votes
async function archiveAndResetPoll() {
  try {
    console.log('🗳️  Starting weekly poll reset and archival...');

    const now = new Date();
    
    // Safety check: Only allow reset on Sunday or Monday at specific times
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
    const hour = now.getHours();
    
    // Only run if it's Sunday night (23:00-23:59) or Monday early morning (00:00-01:00)
    const isSundayNight = dayOfWeek === 0 && hour === 23;
    const isMondayMorning = dayOfWeek === 1 && hour <= 1;
    
    if (!isSundayNight && !isMondayMorning) {
      console.log(`⚠️  Reset attempted at wrong time: ${now.toLocaleString()}`);
      console.log(`   Day: ${dayOfWeek}, Hour: ${hour}`);
      console.log(`   Resets only allowed Sunday 23:00-23:59 or Monday 00:00-01:00`);
      return;
    }
    
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
      
      // Convert Map to plain object for Mongoose
      const issueCountsObject = Object.fromEntries(issueCounts);
      
      if (existingAnalytics) {
        console.log(`⚠️  Analytics already exist for ${weekId}, updating...`);
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

// backend/utils/eventScheduler.js

const cron = require('node-cron');
const Event = require('../models/eventModel');

// Delete events older than 33 days
// This runs daily at 2 AM (Chicago time) to clean up old events
// Images stored with events are automatically deleted when the event is removed

async function cleanupOldEvents() {
  try {
    console.log('🗓️  Starting daily event cleanup...');

    // Calculate the cutoff date (33 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 33);
    cutoffDate.setHours(0, 0, 0, 0);

    // Find and delete events older than 33 days
    const result = await Event.deleteMany({
      eventDate: { $lt: cutoffDate }
    });

    if (result.deletedCount > 0) {
      console.log(`✅ Deleted ${result.deletedCount} event(s) older than 33 days`);
    } else {
      console.log('ℹ️  No events older than 33 days to delete');
    }

    return result;
  } catch (error) {
    console.error('❌ Error during event cleanup:', error);
    throw error;
  }
}

// Schedule the cleanup to run daily at 2:00 AM Chicago time
// Cron expression: minute hour day-of-month month day-of-week
function startEventScheduler() {
  // Run at 2:00 AM every day
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Running scheduled event cleanup...');
    await cleanupOldEvents();
  }, {
    timezone: 'America/Chicago'
  });

  console.log('📅 Event cleanup scheduler started - runs daily at 2:00 AM Chicago time');
}

module.exports = {
  startEventScheduler,
  cleanupOldEvents
};

// backend/routes/pollRoutes.js

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const validator = require('validator');
const PollVote = require('../models/pollVoteModel');
const PollAnalytics = require('../models/pollAnalyticsModel');
const PollConfig = require('../models/pollConfigModel');
const { protect } = require('../middleware/authMiddleware');
const { 
  publicFormLimiter, 
  validateHoneypot, 
  validateSubmissionTiming, 
  sanitizeRequestBody 
} = require('../middleware/spamProtection');

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

// Helper function to hash email (SHA-256)
function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// Default issues (used for initial setup only)
const DEFAULT_ACTIVE_ISSUES = [
  'Government Corruption',
  'Cost of Living / Inflation',
  'The Economy',
  'State of US Democracy',
  'Treatment of Immigrants by ICE',
  'Climate Change',
  'Crime',
  'Personal Financial Situation',
  'Releasing the Epstein Files'
];

const DEFAULT_VALID_ISSUES = [
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

// In-memory cache (loaded from database on startup)
let ACTIVE_ISSUES = [...DEFAULT_ACTIVE_ISSUES];
let VALID_ISSUES = [...DEFAULT_VALID_ISSUES];

// Load configuration from database
async function loadPollConfig() {
  try {
    let config = await PollConfig.findOne({ configName: 'default' });
    
    if (!config) {
      // Create initial config in database
      config = await PollConfig.create({
        configName: 'default',
        activeIssues: DEFAULT_ACTIVE_ISSUES,
        allValidIssues: DEFAULT_VALID_ISSUES
      });
      console.log('✅ Created initial poll configuration in database');
    }
    
    // Load into memory
    ACTIVE_ISSUES = [...config.activeIssues];
    VALID_ISSUES = [...config.allValidIssues];
    
    console.log(`✅ Loaded poll config: ${ACTIVE_ISSUES.length} active, ${VALID_ISSUES.length} total issues`);
  } catch (error) {
    console.error('❌ Error loading poll configuration:', error);
    // Fall back to defaults
    ACTIVE_ISSUES = [...DEFAULT_ACTIVE_ISSUES];
    VALID_ISSUES = [...DEFAULT_VALID_ISSUES];
  }
}

// Save configuration to database
async function savePollConfig() {
  try {
    await PollConfig.findOneAndUpdate(
      { configName: 'default' },
      {
        activeIssues: ACTIVE_ISSUES,
        allValidIssues: VALID_ISSUES
      },
      { upsert: true, new: true }
    );
    console.log('✅ Saved poll configuration to database');
  } catch (error) {
    console.error('❌ Error saving poll configuration:', error);
    throw error;
  }
}

// Initialize on module load (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  loadPollConfig();
}

// @desc   Check if email has already voted this week
// @route  POST /api/poll/check-email
// @access Public
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const emailHash = hashEmail(email);
    const weekIdentifier = getCurrentWeekIdentifier();

    const existingVote = await PollVote.findOne({ emailHash, weekIdentifier });

    res.status(200).json({
      hasVoted: !!existingVote,
      selectedIssues: existingVote ? existingVote.selectedIssues : null
    });

  } catch (error) {
    res.status(500).json({ message: 'Error checking email', error: error.message });
  }
});

// @desc   Submit or update vote
// @route  POST /api/poll/vote
// @access Public
router.post('/vote', publicFormLimiter, sanitizeRequestBody, validateHoneypot, validateSubmissionTiming, async (req, res) => {
  try {
    const { email, selectedIssues } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!selectedIssues || !Array.isArray(selectedIssues)) {
      return res.status(400).json({ message: 'Please select your issues' });
    }

    if (selectedIssues.length < 1 || selectedIssues.length > 3) {
      return res.status(400).json({ message: 'Please select between 1 and 3 issues' });
    }

    // Validate that all selected issues are currently active
    const invalidIssues = selectedIssues.filter(issue => !ACTIVE_ISSUES.includes(issue));
    if (invalidIssues.length > 0) {
      return res.status(400).json({ message: 'Invalid issue selection' });
    }

    const emailHash = hashEmail(email);
    const weekIdentifier = getCurrentWeekIdentifier();

    // Update or create vote
    const vote = await PollVote.findOneAndUpdate(
      { emailHash, weekIdentifier },
      { 
        emailHash,
        selectedIssues,
        weekIdentifier,
        votedAt: new Date()
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    );

    // Broadcast updated results to all connected clients
    if (global.broadcastPollResults) {
      // Fetch current results
      const votes = await PollVote.find({ weekIdentifier });
      const issueCounts = {};
      ACTIVE_ISSUES.forEach(issue => {
        issueCounts[issue] = 0;
      });
      votes.forEach(v => {
        v.selectedIssues.forEach(issue => {
          if (issueCounts[issue] !== undefined) {
            issueCounts[issue]++;
          }
        });
      });

      global.broadcastPollResults({
        weekIdentifier,
        totalVotes: votes.length,
        issueCounts,
        issues: ACTIVE_ISSUES
      });
    }

    res.status(200).json({
      message: 'Vote submitted successfully!',
      vote: {
        selectedIssues: vote.selectedIssues,
        votedAt: vote.votedAt
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already voted this week' });
    }
    res.status(500).json({ message: 'Error submitting vote', error: error.message });
  }
});

// @desc   Get current week's poll results
// @route  GET /api/poll/results
// @access Public
router.get('/results', async (req, res) => {
  try {
    const weekIdentifier = getCurrentWeekIdentifier();

    // Get all votes for current week
    const votes = await PollVote.find({ weekIdentifier });

    // Calculate issue counts (only for active issues)
    const issueCounts = {};
    ACTIVE_ISSUES.forEach(issue => {
      issueCounts[issue] = 0;
    });

    votes.forEach(vote => {
      vote.selectedIssues.forEach(issue => {
        if (issueCounts[issue] !== undefined) {
          issueCounts[issue]++;
        }
      });
    });

    // Sort issues by vote count (descending)
    const sortedIssues = ACTIVE_ISSUES.slice().sort((a, b) => {
      return issueCounts[b] - issueCounts[a];
    });

    res.status(200).json({
      weekIdentifier,
      totalVotes: votes.length,
      issueCounts,
      issues: sortedIssues
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching results', error: error.message });
  }
});

// @desc   Get historical poll analytics
// @route  GET /api/poll/analytics
// @access Public
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await PollAnalytics.find({})
      .sort({ weekEnding: -1 })
      .limit(52); // Last year of data

    res.status(200).json(analytics);

  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// @desc   Get active poll issues (currently available for voting)
// @route  GET /api/poll/active-issues
// @access Public
router.get('/active-issues', async (req, res) => {
  try {
    res.status(200).json({
      issues: ACTIVE_ISSUES,
      count: ACTIVE_ISSUES.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active issues', error: error.message });
  }
});

// @desc   Get all valid issues (for admin management)
// @route  GET /api/poll/all-issues
// @access Private
router.get('/all-issues', protect, async (req, res) => {
  try {
    res.status(200).json({
      issues: VALID_ISSUES,
      activeIssues: ACTIVE_ISSUES,
      count: VALID_ISSUES.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all issues', error: error.message });
  }
});

// @desc   Update active issues
// @route  POST /api/poll/update-active-issues
// @access Private
router.post('/update-active-issues', protect, async (req, res) => {
  try {
    const { activeIssues } = req.body;

    if (!Array.isArray(activeIssues)) {
      return res.status(400).json({ message: 'activeIssues must be an array' });
    }

    // Validate that all active issues are in VALID_ISSUES
    const invalidIssues = activeIssues.filter(issue => !VALID_ISSUES.includes(issue));
    if (invalidIssues.length > 0) {
      return res.status(400).json({ 
        message: 'Invalid issues provided', 
        invalidIssues 
      });
    }

    // Update the ACTIVE_ISSUES array in memory
    ACTIVE_ISSUES.length = 0;
    ACTIVE_ISSUES.push(...activeIssues);

    // Save to database
    await savePollConfig();

    res.status(200).json({
      message: 'Active issues updated successfully',
      activeIssues: ACTIVE_ISSUES,
      count: ACTIVE_ISSUES.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating active issues', error: error.message });
  }
});

// @desc   Add a new issue to the poll
// @route  POST /api/poll/add-issue
// @access Private
router.post('/add-issue', protect, async (req, res) => {
  try {
    const { issueName } = req.body;

    if (!issueName || typeof issueName !== 'string') {
      return res.status(400).json({ message: 'Issue name is required' });
    }

    const trimmedName = issueName.trim();

    if (VALID_ISSUES.includes(trimmedName)) {
      return res.status(400).json({ message: 'Issue already exists' });
    }

    // Add to both arrays
    VALID_ISSUES.push(trimmedName);
    ACTIVE_ISSUES.push(trimmedName);

    // Save to database
    await savePollConfig();

    res.status(201).json({
      message: 'Issue added successfully',
      issue: trimmedName,
      allIssues: VALID_ISSUES,
      activeIssues: ACTIVE_ISSUES
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding issue', error: error.message });
  }
});

// POST /api/poll/reset-week - Emergency reset current week's poll (Protected)
router.post('/reset-week', protect, async (req, res) => {
  try {
    const weekIdentifier = getCurrentWeekIdentifier();
    
    // Get current week's votes before deletion
    const currentVotes = await PollVote.find({ weekIdentifier });
    
    if (currentVotes.length > 0) {
      // Archive current week's data
      const issueCounts = new Map();
      VALID_ISSUES.forEach(issue => {
        issueCounts.set(issue, 0);
      });
      
      currentVotes.forEach(vote => {
        vote.selectedIssues.forEach(issue => {
          if (issueCounts.has(issue)) {
            issueCounts.set(issue, issueCounts.get(issue) + 1);
          }
        });
      });
      
      // Calculate the Sunday that ENDED this week (not the upcoming Sunday)
      // Extract week number from identifier (e.g., "2025-W46" -> 46)
      const weekNumber = parseInt(weekIdentifier.split('-W')[1]);
      const year = parseInt(weekIdentifier.split('-W')[0]);
      
      // Calculate the date of Sunday for that week
      const jan1 = new Date(year, 0, 1);
      const daysToAdd = (weekNumber - 1) * 7 + (7 - jan1.getDay());
      const weekEnding = new Date(year, 0, daysToAdd);
      weekEnding.setHours(23, 59, 59, 999);
      
      // Check if analytics already exist for this week
      const existingAnalytics = await PollAnalytics.findOne({ weekIdentifier });
      
      // Convert Map to plain object for Mongoose
      const issueCountsObject = Object.fromEntries(issueCounts);
      
      if (existingAnalytics) {
        // Update existing analytics
        existingAnalytics.totalVotes = currentVotes.length;
        existingAnalytics.issueCounts = issueCountsObject;
        existingAnalytics.weekEnding = weekEnding; // Update the weekEnding date
        await existingAnalytics.save();
      } else {
        // Create new analytics entry
        await PollAnalytics.create({
          weekIdentifier,
          weekEnding,
          totalVotes: currentVotes.length,
          issueCounts: issueCountsObject
        });
      }
    }
    
    // Delete all votes for current week
    const deleteResult = await PollVote.deleteMany({ weekIdentifier });
    
    // Broadcast poll reset to all connected clients
    if (global.broadcastPollResults) {
      global.broadcastPollResults({
        weekIdentifier,
        totalVotes: 0,
        results: ACTIVE_ISSUES.map(issue => ({ issue, count: 0, percentage: 0 })),
        reset: true
      });
    }
    
    res.status(200).json({ 
      message: 'Poll reset successfully',
      weekIdentifier,
      votesDeleted: deleteResult.deletedCount,
      archived: currentVotes.length > 0
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error resetting poll', error: error.message });
  }
});

// GET /api/poll/monthly-export/:year/:month - Export monthly poll data as CSV (Protected)
router.get('/monthly-export/:year/:month', protect, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Invalid year or month' });
    }
    
    // Calculate date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    
    // Fetch analytics for the month
    const analytics = await PollAnalytics.find({
      weekEnding: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ weekEnding: 1 });
    
    if (analytics.length === 0) {
      return res.status(404).json({ message: 'No poll data found for this month' });
    }
    
    // Build CSV headers
    let csvContent = 'Week,Date Range,Total Votes';
    VALID_ISSUES.forEach(issue => {
      csvContent += `,${issue}`;
    });
    csvContent += '\n';
    
    // Add data rows
    analytics.forEach(record => {
      const weekEnding = new Date(record.weekEnding);
      const weekStart = new Date(weekEnding);
      weekStart.setDate(weekEnding.getDate() - 6);
      
      const dateRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnding.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      
      csvContent += `${record.weekIdentifier},"${dateRange}",${record.totalVotes}`;
      
      VALID_ISSUES.forEach(issue => {
        const count = record.issueCounts.get(issue) || 0;
        csvContent += `,${count}`;
      });
      
      csvContent += '\n';
    });
    
    // Add totals row
    const totalVotes = analytics.reduce((sum, record) => sum + record.totalVotes, 0);
    csvContent += `TOTAL,,${totalVotes}`;
    
    VALID_ISSUES.forEach(issue => {
      const totalCount = analytics.reduce((sum, record) => {
        return sum + (record.issueCounts.get(issue) || 0);
      }, 0);
      csvContent += `,${totalCount}`;
    });
    
    csvContent += '\n';
    
    // Send CSV file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="poll-data-${year}-${String(monthNum).padStart(2, '0')}.csv"`);
    res.status(200).send(csvContent);
    
  } catch (error) {
    res.status(500).json({ message: 'Error exporting poll data', error: error.message });
  }
});

// PUT /api/poll/edit-issue - Edit an existing issue name (Protected)
router.put('/edit-issue', protect, async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    
    if (!oldName || !newName) {
      return res.status(400).json({ message: 'Both oldName and newName are required' });
    }
    
    const trimmedOldName = oldName.trim();
    const trimmedNewName = newName.trim();
    
    if (!trimmedOldName || !trimmedNewName) {
      return res.status(400).json({ message: 'Issue names cannot be empty' });
    }
    
    // Check if old name exists
    if (!VALID_ISSUES.includes(trimmedOldName)) {
      return res.status(404).json({ message: 'Original issue not found' });
    }
    
    // Check if new name already exists (and is different)
    if (VALID_ISSUES.includes(trimmedNewName) && trimmedOldName !== trimmedNewName) {
      return res.status(400).json({ message: 'An issue with that name already exists' });
    }
    
    // Update in-memory arrays
    const validIndex = VALID_ISSUES.indexOf(trimmedOldName);
    if (validIndex !== -1) {
      VALID_ISSUES[validIndex] = trimmedNewName;
    }
    
    const activeIndex = ACTIVE_ISSUES.indexOf(trimmedOldName);
    if (activeIndex !== -1) {
      ACTIVE_ISSUES[activeIndex] = trimmedNewName;
    }
    
    // Save to database
    await savePollConfig();
    
    // Update historical data in PollAnalytics
    // issueCounts is a plain object (Mixed type), not a Map
    const analyticsRecords = await PollAnalytics.find({});
    let analyticsUpdatedCount = 0;
    
    for (const record of analyticsRecords) {
      if (record.issueCounts && record.issueCounts[trimmedOldName] !== undefined) {
        const count = record.issueCounts[trimmedOldName];
        delete record.issueCounts[trimmedOldName];
        record.issueCounts[trimmedNewName] = count;
        record.markModified('issueCounts'); // Required for Mixed type fields
        await record.save();
        analyticsUpdatedCount++;
      }
    }
    
    // Update current week votes in PollVote
    const currentVotes = await PollVote.find({
      selectedIssues: trimmedOldName
    });
    
    for (const vote of currentVotes) {
      const issueIndex = vote.selectedIssues.indexOf(trimmedOldName);
      if (issueIndex !== -1) {
        vote.selectedIssues[issueIndex] = trimmedNewName;
        await vote.save();
      }
    }
    
    res.status(200).json({ 
      message: 'Issue updated successfully',
      oldName: trimmedOldName,
      newName: trimmedNewName,
      analyticsUpdated: analyticsUpdatedCount,
      votesUpdated: currentVotes.length
    });
    
  } catch (error) {
    console.error('Error editing issue:', error);
    res.status(500).json({ message: 'Error editing issue', error: error.message });
  }
});

// DELETE /api/poll/delete-issue - Delete an issue (Protected)
router.delete('/delete-issue', protect, async (req, res) => {
  try {
    const { issueName } = req.body;
    
    if (!issueName) {
      return res.status(400).json({ message: 'Issue name is required' });
    }
    
    const trimmedName = issueName.trim();
    
    if (!VALID_ISSUES.includes(trimmedName)) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    
    // Remove from in-memory arrays
    VALID_ISSUES = VALID_ISSUES.filter(issue => issue !== trimmedName);
    ACTIVE_ISSUES = ACTIVE_ISSUES.filter(issue => issue !== trimmedName);
    
    // Save to database
    await savePollConfig();
    
    // Note: We intentionally do NOT delete historical data from PollAnalytics or PollVote
    // The data remains for historical record, but the issue won't appear in new polls
    
    res.status(200).json({ 
      message: 'Issue deleted successfully',
      deletedIssue: trimmedName,
      note: 'Historical voting data for this issue has been preserved in the database'
    });
    
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ message: 'Error deleting issue', error: error.message });
  }
});

module.exports = router;

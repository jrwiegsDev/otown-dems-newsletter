// backend/routes/pollRoutes.js

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const validator = require('validator');
const PollVote = require('../models/pollVoteModel');
const PollAnalytics = require('../models/pollAnalyticsModel');
const { protect } = require('../middleware/authMiddleware');

// Helper function to get current week identifier (ISO week)
function getCurrentWeekIdentifier() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Helper function to hash email (SHA-256)
function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// Valid issues list
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
router.post('/vote', async (req, res) => {
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

    // Validate that all selected issues are in the valid list
    const invalidIssues = selectedIssues.filter(issue => !VALID_ISSUES.includes(issue));
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
      VALID_ISSUES.forEach(issue => {
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
        issues: VALID_ISSUES
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

    // Calculate issue counts
    const issueCounts = {};
    VALID_ISSUES.forEach(issue => {
      issueCounts[issue] = 0;
    });

    votes.forEach(vote => {
      vote.selectedIssues.forEach(issue => {
        if (issueCounts[issue] !== undefined) {
          issueCounts[issue]++;
        }
      });
    });

    res.status(200).json({
      weekIdentifier,
      totalVotes: votes.length,
      issueCounts,
      issues: VALID_ISSUES
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
      
      // Calculate week ending date (Sunday of current week)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      const weekEnding = new Date(now);
      weekEnding.setDate(now.getDate() + daysUntilSunday);
      weekEnding.setHours(23, 59, 59, 999);
      
      // Check if analytics already exist for this week
      const existingAnalytics = await PollAnalytics.findOne({ weekIdentifier });
      
      if (existingAnalytics) {
        // Update existing analytics
        existingAnalytics.totalVotes = currentVotes.length;
        existingAnalytics.issueCounts = issueCounts;
        await existingAnalytics.save();
      } else {
        // Create new analytics entry
        await PollAnalytics.create({
          weekIdentifier,
          weekEnding,
          totalVotes: currentVotes.length,
          issueCounts
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
        results: VALID_ISSUES.map(issue => ({ issue, count: 0, percentage: 0 })),
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

module.exports = router;

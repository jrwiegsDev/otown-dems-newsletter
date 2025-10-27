// backend/models/pollAnalyticsModel.js
const mongoose = require('mongoose');

const pollAnalyticsSchema = new mongoose.Schema({
  weekIdentifier: {
    type: String,
    required: true,
    unique: true
    // Format: "YYYY-Www" (e.g., "2025-W43")
  },
  weekEnding: {
    type: Date,
    required: true
  },
  totalVotes: {
    type: Number,
    required: true,
    default: 0
  },
  issueCounts: {
    type: Map,
    of: Number,
    required: true
    // Example: { "Government Corruption": 45, "Cost of Living / Inflation": 67, ... }
  },
  archivedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PollAnalytics', pollAnalyticsSchema);

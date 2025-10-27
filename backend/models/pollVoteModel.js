// backend/models/pollVoteModel.js
const mongoose = require('mongoose');

const pollVoteSchema = new mongoose.Schema({
  emailHash: {
    type: String,
    required: true,
    index: true
  },
  selectedIssues: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0 && v.length <= 3;
      },
      message: 'Must select between 1 and 3 issues'
    }
  },
  weekIdentifier: {
    type: String,
    required: true,
    index: true
    // Format: "YYYY-Www" (e.g., "2025-W43")
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one vote per email per week
pollVoteSchema.index({ emailHash: 1, weekIdentifier: 1 }, { unique: true });

module.exports = mongoose.model('PollVote', pollVoteSchema);

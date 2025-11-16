// backend/models/pollConfigModel.js
const mongoose = require('mongoose');

const pollConfigSchema = new mongoose.Schema({
  configName: {
    type: String,
    required: true,
    unique: true,
    default: 'default'
  },
  activeIssues: {
    type: [String],
    required: true,
    default: []
  },
  allValidIssues: {
    type: [String],
    required: true,
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PollConfig', pollConfigSchema);

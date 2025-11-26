// backend/models/newsletterDraftModel.js
const mongoose = require('mongoose');

const newsletterDraftSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String,
    required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('NewsletterDraft', newsletterDraftSchema);

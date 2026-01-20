// backend/models/archivedAnnouncementModel.js

const mongoose = require('mongoose');

const archivedAnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String  // Base64 encoded image data (not archived to save space)
  },
  originalCreatedAt: {
    type: Date,
    required: true
  },
  archivedAt: {
    type: Date,
    default: Date.now
  },
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

const ArchivedAnnouncement = mongoose.model('ArchivedAnnouncement', archivedAnnouncementSchema);

module.exports = ArchivedAnnouncement;

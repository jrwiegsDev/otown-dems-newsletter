// backend/models/archivedEventModel.js

const mongoose = require('mongoose');

const archivedEventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  eventTime: {
    type: String,
    trim: true
  },
  startTime: {
    type: String,
    trim: true
  },
  endTime: {
    type: String,
    trim: true
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  eventDescription: {
    type: String,
    trim: true
  },
  eventLocation: {
    type: String,
    trim: true
  },
  eventCoordinates: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    }
  },
  eventLink: {
    type: String,
    trim: true
  },
  eventLinkText: {
    type: String,
    trim: true
  },
  isBannerEvent: {
    type: Boolean,
    default: false
  },
  originalCreatedAt: {
    type: Date,
    required: true
  },
  originalUpdatedAt: {
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

const ArchivedEvent = mongoose.model('ArchivedEvent', archivedEventSchema);

module.exports = ArchivedEvent;

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: [true, 'Please provide an event name'],
    trim: true
  },
  eventDate: {
    type: Date,
    required: [true, 'Please provide an event date']
  },
  eventTime: {
    type: String,
    trim: true
  },
  eventDescription: {
    type: String,
    trim: true
  },
  isBannerEvent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
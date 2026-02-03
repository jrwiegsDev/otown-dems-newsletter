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
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
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
    trim: true,
    default: 'Learn More'
  },
  eventImage: {
    type: String  // Base64 encoded image data
  },
  isBannerEvent: {
    type: Boolean,
    default: false
  },
  // Recurring event fields
  recurrenceType: {
    type: String,
    enum: ['none', 'weekly', 'biweekly', 'monthly'],
    default: 'none'
  },
  recurrenceEndDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
// backend/models/subscriberModel.js
const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  firstName: { // <-- No longer required
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
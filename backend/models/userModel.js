const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true
  },
  fullName: {
    type: String,
    required: [true, 'Please provide a full name'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password']
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
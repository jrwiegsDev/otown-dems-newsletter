// backend/models/volunteerModel.js
const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide a first name'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Please provide a last name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true
  },
  interestedPrograms: {
    type: [String],
    required: [true, 'Please select at least one program you are interested in'],
    validate: {
      validator: function(programs) {
        const validPrograms = [
          'Adopt A Highway',
          'Christmas Toy Drive',
          'Thanksgiving Meal Drive',
          'Food Pantry Support',
          'Community Garden',
          'Literacy Tutoring',
          'Senior Outreach',
          'Voter Registration',
          'School Supply Drive',
          'Winter Coat Drive',
          'Book Drive',
          'Community Clean-Up Events'
        ];
        return programs.length > 0 && programs.every(program => validPrograms.includes(program));
      },
      message: 'Please provide valid program selections'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Volunteer', volunteerSchema);

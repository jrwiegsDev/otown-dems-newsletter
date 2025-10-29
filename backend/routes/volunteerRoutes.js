// backend/routes/volunteerRoutes.js

const express = require('express');
const router = express.Router();
const validator = require('validator');
const nodemailer = require('nodemailer');
const Volunteer = require('../models/volunteerModel');
const { protect } = require('../middleware/authMiddleware');

// Transporter configured for MailerSend (same as newsletter)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @desc   Get all volunteers
// @route  GET /api/volunteers
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const volunteers = await Volunteer.find({});
    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching volunteers', error: error.message });
  }
});

// @desc   Add a new volunteer (or update existing one)
// @route  POST /api/volunteers
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, availableDays } = req.body;

    // Validation
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ message: 'Please provide a first name' });
    }

    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ message: 'Please provide a last name' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!availableDays || availableDays.length === 0) {
      return res.status(400).json({ message: 'Please select at least one available day' });
    }

    // Check if volunteer with this email already exists
    const existingVolunteer = await Volunteer.findOne({ email: email.toLowerCase() });

    let volunteer;
    let isNew = false;

    if (existingVolunteer) {
      // Update existing volunteer
      volunteer = await Volunteer.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          availableDays: availableDays
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new volunteer
      volunteer = await Volunteer.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase(),
        availableDays: availableDays
      });
      isNew = true;
    }

    // Send notification email to Community Outreach team (or test email in dev)
    try {
      // Determine recipient based on environment
      const recipientEmail = process.env.NODE_ENV === 'development'
        ? process.env.TEST_EMAIL_RECIPIENT
        : 'ofallondems@gmail.com';

      const emailSubject = isNew 
        ? '🙋 New Volunteer Sign-Up!' 
        : '🔄 Volunteer Information Updated';

      const devNote = process.env.NODE_ENV === 'development'
        ? '<p style="background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b;"><strong>⚠️ DEV MODE:</strong> This is a test email. In production, this would be sent to ofallondems@gmail.com</p>'
        : '';

      const emailBody = `
        ${devNote}
        <h2>${isNew ? 'New Volunteer Sign-Up' : 'Volunteer Information Updated'}</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Available Days:</strong> ${availableDays.join(', ')}</p>
        <p><strong>Signed Up:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}</p>
        <hr>
        <p><em>This is an automated notification from the OADC website volunteer form.</em></p>
      `;

      await transporter.sendMail({
        from: `"OADC Website" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailBody,
        replyTo: email,
      });

      console.log(`Volunteer notification email sent to ${recipientEmail} for: ${email}`);
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      // Don't fail the request if email fails
    }

    const message = isNew
      ? 'Thank you for signing up! Our Community Outreach team will be in touch soon.'
      : 'Your volunteer information has been updated successfully!';

    return res.status(isNew ? 201 : 200).json({
      volunteer: volunteer,
      message: message
    });

  } catch (error) {
    console.error('Error processing volunteer signup:', error);
    res.status(500).json({ message: 'Error processing volunteer signup', error: error.message });
  }
});

// @desc   Update a volunteer
// @route  PUT /api/volunteers/:id
// @access Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { firstName, lastName, email, availableDays } = req.body;

    // Validation
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ message: 'Please provide a first name' });
    }

    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ message: 'Please provide a last name' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!availableDays || availableDays.length === 0) {
      return res.status(400).json({ message: 'Please select at least one available day' });
    }

    const volunteer = await Volunteer.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    // Update fields
    volunteer.firstName = firstName.trim();
    volunteer.lastName = lastName.trim();
    volunteer.email = email.toLowerCase();
    volunteer.availableDays = availableDays;

    const updatedVolunteer = await volunteer.save();
    res.json(updatedVolunteer);

  } catch (error) {
    console.error('Error updating volunteer:', error);
    res.status(500).json({ message: 'Error updating volunteer', error: error.message });
  }
});

// @desc   Delete a volunteer
// @route  DELETE /api/volunteers/:id
// @access Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const volunteerId = req.params.id;
    const volunteer = await Volunteer.findByIdAndDelete(volunteerId);

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.status(200).json({ message: 'Volunteer removed successfully', id: volunteerId });

  } catch (error) {
    res.status(500).json({ message: 'Error deleting volunteer', error: error.message });
  }
});

module.exports = router;

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
    const { firstName, lastName, email, interestedPrograms } = req.body;

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

    if (!interestedPrograms || interestedPrograms.length === 0) {
      return res.status(400).json({ message: 'Please select at least one program you are interested in' });
    }

    // Check if volunteer with this email already exists
    const existingVolunteer = await Volunteer.findOne({ email: email.toLowerCase() });

    if (existingVolunteer) {
      // Block submission - user already signed up
      return res.status(400).json({ 
        message: "Sorry, it looks like you've already signed up to volunteer, which is great! Please reach out to Sarah or Kendra at ofallondems@gmail.com if you'd like to update your volunteering interests! Thank you again!" 
      });
    }

    // Create new volunteer
    const volunteer = await Volunteer.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      interestedPrograms: interestedPrograms
    });

    // Send notification email to Community Outreach team (or test email in dev)
    try {
      // Determine recipient based on environment
      const recipientEmail = process.env.NODE_ENV === 'development'
        ? process.env.VOLUNTEER_TEST_EMAIL
        : 'ofallondems@gmail.com';

      const devNote = process.env.NODE_ENV === 'development'
        ? '<p style="background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b;"><strong>⚠️ DEV MODE:</strong> This is a test notification email. In production, this would be sent to ofallondems@gmail.com</p>'
        : '';

      const notificationBody = `
        ${devNote}
        <h2>🙋 New Volunteer Sign-Up!</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Interested Programs:</strong> ${interestedPrograms.join(', ')}</p>
        <p><strong>Signed Up:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}</p>
        <hr>
        <p><em>This is an automated notification from the OADC website volunteer form.</em></p>
      `;

      await transporter.sendMail({
        from: `"OADC Website" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: '🙋 New Volunteer Sign-Up!',
        html: notificationBody,
        replyTo: email,
      });

      console.log(`Volunteer notification email sent to ${recipientEmail} for: ${email}`);
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to volunteer
    try {
      // Determine recipient based on environment
      const confirmationRecipient = process.env.NODE_ENV === 'development'
        ? process.env.VOLUNTEER_TEST_EMAIL
        : email;

      const devNote = process.env.NODE_ENV === 'development'
        ? '<p style="background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b;"><strong>⚠️ DEV MODE:</strong> This is a test confirmation email. In production, this would be sent to the volunteer\'s email address.</p>'
        : '';

      const programsList = interestedPrograms.map(program => `<li>${program}</li>`).join('');

      const confirmationBody = `
        ${devNote}
        <h2>Thank You for Signing Up to Volunteer! 🙋</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you so much for your interest in getting involved in volunteering to help support our community!</p>
        <p><strong>As a reminder, here are the programs you mentioned an interest in:</strong></p>
        <ul>
          ${programsList}
        </ul>
        <p>Sarah and Kendra have received your volunteer submission, and one of them will be reaching out to you at this email address soon!</p>
        <p>Thank you again for signing up to volunteer!</p>
        <hr>
        <p><em>If you need to update your volunteer interests, please reach out to Sarah or Kendra at <a href="mailto:ofallondems@gmail.com">ofallondems@gmail.com</a>.</em></p>
      `;

      await transporter.sendMail({
        from: `"O'Fallon Area Democratic Club" <${process.env.EMAIL_USER}>`,
        to: confirmationRecipient,
        subject: 'Thank You for Volunteering! 🙋',
        html: confirmationBody,
        replyTo: 'ofallondems@gmail.com',
      });

      console.log(`Volunteer confirmation email sent to ${confirmationRecipient}`);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      volunteer: volunteer,
      message: 'Thank you for signing up! Our Community Outreach team will be in touch soon.'
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
    const { firstName, lastName, email, interestedPrograms } = req.body;

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

    if (!interestedPrograms || interestedPrograms.length === 0) {
      return res.status(400).json({ message: 'Please select at least one program you are interested in' });
    }

    const volunteer = await Volunteer.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    // Update fields
    volunteer.firstName = firstName.trim();
    volunteer.lastName = lastName.trim();
    volunteer.email = email.toLowerCase();
    volunteer.interestedPrograms = interestedPrograms;

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

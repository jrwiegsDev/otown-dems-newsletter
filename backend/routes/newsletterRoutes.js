const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Subscriber = require('../models/subscriberModel');
const { protect } = require('../middleware/authMiddleware');

// Transporter configured for MailerSend
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // Typically false for port 587 (TLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// A helper function to create a small delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// @desc   Send the newsletter
// @route  POST /api/newsletter/send
// @access Private
router.post('/send', protect, async (req, res) => {
  const { subject, htmlContent } = req.body;

  if (!subject || !htmlContent) {
    return res.status(400).json({ message: 'Subject and content are required' });
  }

  try {
    let recipientEmails = [];

    // Determine recipients based on environment
    if (process.env.NODE_ENV === 'development') {
      console.log('--- RUNNING IN DEV MODE: Preparing test email ---');
      recipientEmails.push(process.env.TEST_EMAIL_RECIPIENT);
    } else {
      const subscribers = await Subscriber.find({});
      if (subscribers.length === 0) {
        // Send response immediately if no subscribers
        return res.status(200).json({ message: 'Newsletter initiated, but no subscribers found.' });
      }
      recipientEmails = subscribers.map(sub => sub.email);
    }

    // --- RESPOND TO BROWSER IMMEDIATELY ---
    res.status(200).json({ message: `Newsletter sending initiated to ${recipientEmails.length} recipients!` });

    // --- SEND EMAILS IN THE BACKGROUND ---
    console.log(`Starting background email send process for ${recipientEmails.length} emails...`);
    for (const recipient of recipientEmails) {
      const mailOptions = {
        from: '"O\'Fallon Area Democratic Club" <newsletter@ofallonildems.org>',
        replyTo: 'ofallondems@gmail.com',
        to: recipient,
        subject: subject,
        html: htmlContent,
      };

      try {
        // Send email (no await, don't block the loop)
        transporter.sendMail(mailOptions);
        console.log(`Email queued for ${recipient}`);

        // Wait for 5 seconds before queuing the next email
        await delay(5000);
      } catch (emailError) {
        // Log errors for individual email sends but continue the loop
        console.error(`Failed to send email to ${recipient}:`, emailError);
      }
    }
    console.log('Finished queuing all emails.');

  } catch (error) {
    // Catch errors during subscriber fetch or initial setup
    console.error('Error preparing newsletter:', error);
    // Ensure a response is sent even if the initial response wasn't hit
    if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to initiate newsletter sending' });
    }
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Subscriber = require('../models/subscriberModel');
const { protect } = require('../middleware/authMiddleware');

// Transporter configured for MailerSend
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, 
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

    if (process.env.NODE_ENV === 'development') {
      console.log('--- RUNNING IN DEV MODE: Sending test email ---');
      recipientEmails.push(process.env.TEST_EMAIL_RECIPIENT);
    } else {
      const subscribers = await Subscriber.find({});
      if (subscribers.length === 0) {
        return res.status(400).json({ message: 'No subscribers to send to.' });
      }
      recipientEmails = subscribers.map(sub => sub.email);
    }

    // --- NEW LOGIC: Loop through recipients and send one by one with a delay ---
    for (const recipient of recipientEmails) {
      const mailOptions = {
        from: '"O\'Fallon Area Democratic Club" <newsletter@ofallonildems.org>',
        replyTo: 'ofallondems@gmail.com',
        to: recipient, // Send to one person at a time
        subject: subject,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${recipient}`);
      
      // Wait for 2 seconds before sending the next email
      await delay(2000);
    }

    res.status(200).json({ message: `Newsletter sent successfully to ${recipientEmails.length} recipients!` });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ message: 'Failed to send newsletter' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Subscriber = require('../models/subscriberModel');
const { protect } = require('../middleware/authMiddleware');

// Create a "transporter" - an object that knows how to send emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

    // --- THIS IS THE NEW TEST MODE LOGIC ---
    if (process.env.NODE_ENV === 'development') {
      console.log('--- RUNNING IN DEV MODE: Sending test email ---');
      recipientEmails.push(process.env.TEST_EMAIL_RECIPIENT);
    } else {
      // Production mode: get all subscribers
      const subscribers = await Subscriber.find({});
      if (subscribers.length === 0) {
        return res.status(400).json({ message: 'No subscribers to send to.' });
      }
      recipientEmails = subscribers.map(sub => sub.email);
    }
    // --- END OF NEW LOGIC ---

    const mailOptions = {
      from: `"O'Fallon Dems Newsletter" <${process.env.EMAIL_USER}>`,
      to: recipientEmails.join(', '), // Send to all recipients
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Newsletter sent successfully!' });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ message: 'Failed to send newsletter' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Subscriber = require('../models/subscriberModel');
const { protect } = require('../middleware/authMiddleware');

// Create a "transporter" configured for a generic SMTP service (like MailerSend)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports like 587
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

    // Development mode sends only to the test recipient
    if (process.env.NODE_ENV === 'development') {
      console.log('--- RUNNING IN DEV MODE: Sending test email ---');
      recipientEmails.push(process.env.TEST_EMAIL_RECIPIENT);
    } else {
      // Production mode gets all subscribers from the database
      const subscribers = await Subscriber.find({});
      if (subscribers.length === 0) {
        return res.status(400).json({ message: 'No subscribers to send to.' });
      }
      recipientEmails = subscribers.map(sub => sub.email);
    }

    // Configure the email options
    const mailOptions = {
      from: '"O\'Fallon Area Democratic Club" <newsletter@ofallonildems.org>', // Professional sender identity
      replyTo: 'ofallondems@gmail.com', // Where replies will actually go
      bcc: recipientEmails, // Use BCC to protect recipient privacy
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
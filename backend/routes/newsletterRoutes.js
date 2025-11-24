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
    // Wrap the entire background process to prevent ANY crash
    (async () => {
      try {
        console.log(`Starting background email send process for ${recipientEmails.length} emails...`);
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < recipientEmails.length; i++) {
          const recipient = recipientEmails[i];
          const mailOptions = {
            from: '"O\'Fallon Area Democratic Club" <newsletter@ofallonildems.org>',
            replyTo: 'ofallondems@gmail.com',
            to: recipient,
            subject: subject,
            html: htmlContent,
          };

          try {
            // PROPERLY AWAIT the email send
            await transporter.sendMail(mailOptions);
            successCount++;
            console.log(`✅ [${i + 1}/${recipientEmails.length}] Email sent to ${recipient}`);
          } catch (emailError) {
            failCount++;
            // Log the error but CONTINUE sending to everyone else
            console.error(`❌ [${i + 1}/${recipientEmails.length}] Failed to send to ${recipient}:`, emailError.message);
            
            // If it's a rate limit error, add extra delay before continuing
            if (emailError.responseCode === 450 || emailError.message?.includes('Too many requests')) {
              console.log('⏸️  Rate limit detected, waiting 30 seconds before continuing...');
              await delay(30000);
            }
          }

          // Wait for 5 seconds before sending the next email (unless it's the last one)
          if (i < recipientEmails.length - 1) {
            await delay(5000);
          }
        }
        console.log(`✅ Finished sending emails. Success: ${successCount}, Failed: ${failCount}`);
      } catch (fatalError) {
        // This catches ANY unexpected error in the background process
        console.error('🚨 FATAL ERROR in background email process:', fatalError);
        console.error('Newsletter sending stopped unexpectedly. Check logs above for last successful email.');
      }
    })();

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
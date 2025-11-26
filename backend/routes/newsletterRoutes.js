const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Subscriber = require('../models/subscriberModel');
const NewsletterDraft = require('../models/newsletterDraftModel');
const { protect } = require('../middleware/authMiddleware');

const MAX_DRAFTS = 10; // Maximum number of drafts allowed

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
  const { subject, htmlContent, selectedEmails } = req.body;

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
      // If selectedEmails array is provided and not empty, use those
      // Otherwise, send to all subscribers
      if (selectedEmails && Array.isArray(selectedEmails) && selectedEmails.length > 0) {
        recipientEmails = selectedEmails;
        console.log(`📧 Sending to ${selectedEmails.length} selected subscribers`);
      } else {
        const subscribers = await Subscriber.find({});
        if (subscribers.length === 0) {
          // Send response immediately if no subscribers
          return res.status(200).json({ message: 'Newsletter initiated, but no subscribers found.' });
        }
        recipientEmails = subscribers.map(sub => sub.email);
        console.log(`📧 Sending to all ${recipientEmails.length} subscribers`);
      }
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

          let emailSent = false;
          let retryCount = 0;
          const maxRetries = 1; // Retry once if rate limited

          while (!emailSent && retryCount <= maxRetries) {
            try {
              // PROPERLY AWAIT the email send
              await transporter.sendMail(mailOptions);
              successCount++;
              emailSent = true;
              console.log(`✅ [${i + 1}/${recipientEmails.length}] Email sent to ${recipient}`);
            } catch (emailError) {
              // Check for any temporary/rate limit errors that should trigger a retry
              const isTemporaryError = 
                emailError.responseCode === 450 || // Requested action not taken (temp)
                emailError.responseCode === 451 || // Requested action aborted (temp)
                emailError.responseCode === 452 || // Insufficient storage (temp)
                emailError.responseCode === 421 || // Service not available (temp)
                emailError.message?.toLowerCase().includes('too many requests') ||
                emailError.message?.toLowerCase().includes('rate limit') ||
                emailError.message?.toLowerCase().includes('throttl');
              
              if (isTemporaryError && retryCount < maxRetries) {
                console.log(`⏸️  Rate limit error for ${recipient}, waiting 30 seconds before retry...`);
                await delay(30000);
                retryCount++;
                console.log(`🔄 Retrying email to ${recipient} (attempt ${retryCount + 1}/${maxRetries + 1})...`);
              } else {
                // Either not a temporary error, or we've exhausted retries
                failCount++;
                console.error(`❌ [${i + 1}/${recipientEmails.length}] Failed to send to ${recipient}:`, emailError.message);
                emailSent = true; // Exit the retry loop
              }
            }
          }

          // Wait for 15 seconds before sending the next email (unless it's the last one)
          if (i < recipientEmails.length - 1) {
            await delay(15000);
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

// ============================================
// NEWSLETTER DRAFT ROUTES
// ============================================

// @desc   Get all drafts
// @route  GET /api/newsletter/drafts
// @access Private
router.get('/drafts', protect, async (req, res) => {
  try {
    const drafts = await NewsletterDraft.find({})
      .sort({ updatedAt: -1 }) // Most recently updated first
      .select('subject createdByName createdAt updatedAt'); // Don't send full content in list
    
    res.status(200).json(drafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ message: 'Failed to fetch drafts' });
  }
});

// @desc   Get a single draft by ID
// @route  GET /api/newsletter/drafts/:id
// @access Private
router.get('/drafts/:id', protect, async (req, res) => {
  try {
    const draft = await NewsletterDraft.findById(req.params.id);
    
    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    
    res.status(200).json(draft);
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ message: 'Failed to fetch draft' });
  }
});

// @desc   Create a new draft
// @route  POST /api/newsletter/drafts
// @access Private
router.post('/drafts', protect, async (req, res) => {
  try {
    const { subject, htmlContent } = req.body;
    
    if (!subject || !htmlContent) {
      return res.status(400).json({ message: 'Subject and content are required' });
    }
    
    // Check draft limit
    const draftCount = await NewsletterDraft.countDocuments();
    if (draftCount >= MAX_DRAFTS) {
      return res.status(400).json({ 
        message: `Maximum of ${MAX_DRAFTS} drafts allowed. Please delete an existing draft first.` 
      });
    }
    
    const draft = await NewsletterDraft.create({
      subject,
      htmlContent,
      createdBy: req.user._id,
      createdByName: req.user.fullName
    });
    
    res.status(201).json(draft);
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({ message: 'Failed to create draft' });
  }
});

// @desc   Update an existing draft
// @route  PUT /api/newsletter/drafts/:id
// @access Private
router.put('/drafts/:id', protect, async (req, res) => {
  try {
    const { subject, htmlContent } = req.body;
    
    if (!subject || !htmlContent) {
      return res.status(400).json({ message: 'Subject and content are required' });
    }
    
    const draft = await NewsletterDraft.findById(req.params.id);
    
    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    
    draft.subject = subject;
    draft.htmlContent = htmlContent;
    // Update who last modified it
    draft.createdBy = req.user._id;
    draft.createdByName = req.user.fullName;
    
    await draft.save();
    
    res.status(200).json(draft);
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ message: 'Failed to update draft' });
  }
});

// @desc   Delete a draft
// @route  DELETE /api/newsletter/drafts/:id
// @access Private
router.delete('/drafts/:id', protect, async (req, res) => {
  try {
    const draft = await NewsletterDraft.findById(req.params.id);
    
    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    
    await NewsletterDraft.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ message: 'Failed to delete draft' });
  }
});

module.exports = router;
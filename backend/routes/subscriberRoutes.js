// backend/routes/subscriberRoutes.js

const express = require('express');
const router = express.Router();
const validator = require('validator');
const Subscriber = require('../models/subscriberModel');
const { protect } = require('../middleware/authMiddleware');

// @desc   Get all subscribers
// @route  GET /api/subscribers
router.get('/', protect, async (req, res) => {
  try {
    const subscribers = await Subscriber.find({});
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscribers', error: error.message });
  }
});

// @desc   Add a new subscriber (or update existing one)
// @route  POST /api/subscribers
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Validate required fields
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ message: 'Please provide a first name' });
    }

    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ message: 'Please provide a last name' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if subscriber with this email already exists
    const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });

    if (existingSubscriber) {
      // Update existing subscriber with new information
      const updatedSubscriber = await Subscriber.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          firstName: firstName.trim(),
          lastName: lastName.trim()
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        subscriber: updatedSubscriber,
        message: 'Your information has been updated successfully!'
      });
    } else {
      // Create new subscriber
      const newSubscriber = await Subscriber.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase()
      });

      return res.status(201).json({
        subscriber: newSubscriber,
        message: 'Successfully subscribed to our mailing list!'
      });
    }

  } catch (error) {
    res.status(500).json({ message: 'Error processing subscription', error: error.message });
  }
});

// @desc   Update a subscriber
// @route  PUT /api/subscribers/:id
// @access Private
router.put('/:id', protect, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    // Update the fields with new data from the request body
    // If a field is not provided in the body, it keeps its old value
    subscriber.firstName = req.body.firstName || subscriber.firstName;
    subscriber.lastName = req.body.lastName === undefined ? subscriber.lastName : req.body.lastName;
    subscriber.email = req.body.email || subscriber.email;

    const updatedSubscriber = await subscriber.save();
    res.json(updatedSubscriber);
  } catch (error) {
    res.status(500).json({ message: 'Error updating subscriber', error: error.message });
  }
});

// @desc   Delete a subscriber
// @route  DELETE /api/subscribers/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const subscriberId = req.params.id;
    const subscriber = await Subscriber.findByIdAndDelete(subscriberId);

    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    res.status(200).json({ message: 'Subscriber removed successfully', id: subscriberId });

  } catch (error) {
    res.status(500).json({ message: 'Error deleting subscriber', error: error.message });
  }
});

module.exports = router;
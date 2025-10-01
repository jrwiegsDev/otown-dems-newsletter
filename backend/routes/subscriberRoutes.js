// backend/routes/subscriberRoutes.js

const express = require('express');
const router = express.Router();
const Subscriber = require('../models/subscriberModel');
const { protect } = require('../middleware/authMiddleware'); // <-- 1. IMPORT THIS

// @desc   Get all subscribers
// @route  GET /api/subscribers
router.get('/', protect, async (req, res) => { // <-- 2. ADD PROTECT HERE
  try {
    const subscribers = await Subscriber.find({});
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscribers', error: error.message });
  }
});

// @desc   Add a new subscriber
// @route  POST /api/subscribers
router.post('/', protect, async (req, res) => { // <-- 2. ADD PROTECT HERE
  try {
    const { firstName, lastName, email } = req.body;

    if (!firstName || !email) {
      return res.status(400).json({ message: 'Please provide a first name and email' });
    }

    const newSubscriber = await Subscriber.create({
      firstName,
      lastName,
      email
    });

    res.status(201).json(newSubscriber);

  } catch (error) {
    res.status(500).json({ message: 'Error adding subscriber', error: error.message });
  }
});

// @desc   Delete a subscriber
// @route  DELETE /api/subscribers/:id
router.delete('/:id', protect, async (req, res) => { // <-- 2. ADD PROTECT HERE
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
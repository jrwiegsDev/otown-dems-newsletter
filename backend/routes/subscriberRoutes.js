// backend/routes/subscriberRoutes.js

const express = require('express');
const router = express.Router();
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

// @desc   Add a new subscriber
// @route  POST /api/subscribers
router.post('/', protect, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    // We removed the firstName requirement from the model, so we can remove it here too
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
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
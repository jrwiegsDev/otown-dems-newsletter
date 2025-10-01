// backend/routes/subscriberRoutes.js

const express = require('express');
const router = express.Router();
const Subscriber = require('../models/subscriberModel'); // Go up one level to find 'models'

// @desc   Get all subscribers
// @route  GET /api/subscribers
// @access Private (will be later)
router.get('/', async (req, res) => {
  try {
    const subscribers = await Subscriber.find({});
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscribers', error: error.message });
  }
});

// @desc   Add a new subscriber
// @route  POST /api/subscribers
// @access Private (will be later)
router.post('/', async (req, res) => {
  try {
    // Get the data from the request body
    const { firstName, lastName, email } = req.body;

    // Basic validation
    if (!firstName || !email) {
      return res.status(400).json({ message: 'Please provide a first name and email' });
    }

    // Create the new subscriber in the database
    const newSubscriber = await Subscriber.create({
      firstName,
      lastName,
      email
    });

    // Send a success response back with the new data
    res.status(201).json(newSubscriber);

  } catch (error) {
    // Handle errors (e.g., duplicate email)
    res.status(500).json({ message: 'Error adding subscriber', error: error.message });
  }
});

// @desc   Delete a subscriber
// @route  DELETE /api/subscribers/:id
// @access Private (will be later)
router.delete('/:id', async (req, res) => {
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
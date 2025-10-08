const express = require('express');
const router = express.Router();
const Event = require('../models/eventModel');
const { protect } = require('../middleware/authMiddleware');

// Get all events (Public)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create an event (Private)
router.post('/', protect, async (req, res) => {
  try {
    const { eventName, eventDate, eventTime, eventDescription } = req.body;

    if (!eventName || !eventDate) {
      return res.status(400).json({ message: 'Event name and date are required' });
    }

    const event = new Event({
      eventName,
      eventDate,
      eventTime,
      eventDescription,
    });

    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc   Update an event
// @route  PUT /api/events/:id
// @access Private
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc   Delete an event
// @route  DELETE /api/events/:id
// @access Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    await event.deleteOne();
    res.json({ message: 'Event removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
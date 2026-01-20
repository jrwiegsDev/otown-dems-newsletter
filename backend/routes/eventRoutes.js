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

// @desc   Get all archived events
// @route  GET /api/events/archived
// @access Private
router.get('/archived', protect, async (req, res) => {
  try {
    const archivedEvents = await ArchivedEvent.find().sort({ archivedAt: -1 });
    res.json(archivedEvents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create an event (Private)
router.post('/', protect, async (req, res) => {
  try {
    const { 
      eventName, 
      eventDate, 
      eventTime, 
      startTime,
      endTime,
      isAllDay,
      eventDescription,
      eventLocation,
      eventCoordinates,
      eventLink,
      eventLinkText,
      eventImage,
      isBannerEvent
    } = req.body;

    if (!eventName || !eventDate) {
      return res.status(400).json({ message: 'Event name and date are required' });
    }

    // Validate image size if provided (2MB limit for Base64)
    // Base64 increases size by ~33%, so 2MB file ≈ 2.67MB Base64
    if (eventImage && eventImage.length > 2.67 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image size must be less than 2MB' });
    }

    const event = new Event({
      eventName,
      eventDate,
      eventTime,
      startTime,
      endTime,
      isAllDay,
      eventDescription,
      eventLocation,
      eventCoordinates,
      eventLink,
      eventLinkText,
      eventImage,
      isBannerEvent,
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

    // Validate image size if provided (2MB limit for Base64)
    if (req.body.eventImage && req.body.eventImage.length > 2.67 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image size must be less than 2MB' });
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

    // Permanently delete the event (including any image data)
    await event.deleteOne();
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc   Toggle banner event status
// @route  PUT /api/events/:id/banner
// @access Private
router.put('/:id/banner', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(event.eventDate);
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      return res.status(400).json({ message: 'Cannot set past events as banner event' });
    }

    // If setting this event as banner, unset all other banner events
    if (!event.isBannerEvent) {
      await Event.updateMany({ _id: { $ne: req.params.id } }, { isBannerEvent: false });
      event.isBannerEvent = true;
    } else {
      event.isBannerEvent = false;
    }

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
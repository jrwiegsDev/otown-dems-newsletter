const express = require('express');
const router = express.Router();
const Event = require('../models/eventModel');
const { protect } = require('../middleware/authMiddleware');

// Helper function to generate recurring event instances
const generateRecurringInstances = (event, maxDate) => {
  const instances = [];
  const startDate = new Date(event.eventDate);
  const endDate = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : maxDate;
  
  // Determine interval in days based on recurrence type
  let intervalDays;
  switch (event.recurrenceType) {
    case 'weekly':
      intervalDays = 7;
      break;
    case 'biweekly':
      intervalDays = 14;
      break;
    case 'monthly':
      intervalDays = null; // Handle monthly separately
      break;
    default:
      return [event]; // No recurrence, return original event
  }

  let currentDate = new Date(startDate);
  let instanceIndex = 0;
  
  while (currentDate <= endDate && currentDate <= maxDate) {
    // Create a virtual instance with the same properties but different date
    // Generate a unique _id for each instance by combining original ID and instance index
    const instanceId = `${event._id}_${instanceIndex}`;
    const instance = {
      ...event.toObject(),
      _id: instanceIndex === 0 ? event._id : instanceId, // Keep original ID for first instance
      eventDate: new Date(currentDate),
      isRecurringInstance: instanceIndex > 0,
      originalEventId: event._id,
      instanceDate: new Date(currentDate)
    };
    instances.push(instance);
    
    // Move to next occurrence
    if (intervalDays) {
      currentDate = new Date(currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    } else {
      // Monthly: same day next month
      currentDate = new Date(currentDate);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    instanceIndex++;
  }
  
  return instances;
};

// Get all events (Public) - expands recurring events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: 1 });
    
    // Calculate max date for recurring events (6 months from now)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    
    // Expand recurring events into instances
    const expandedEvents = [];
    for (const event of events) {
      if (event.recurrenceType && event.recurrenceType !== 'none') {
        const instances = generateRecurringInstances(event, maxDate);
        expandedEvents.push(...instances);
      } else {
        expandedEvents.push(event);
      }
    }
    
    // Sort by event date
    expandedEvents.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    
    res.json(expandedEvents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get raw events without expansion (for admin editing)
router.get('/raw', protect, async (req, res) => {
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
      isBannerEvent,
      recurrenceType,
      recurrenceEndDate
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
      recurrenceType: recurrenceType || 'none',
      recurrenceEndDate: recurrenceEndDate || null,
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
    // Handle recurring instance IDs (e.g., "69820d92a506187f466f09bb_1")
    // Extract the base ID if it contains an underscore followed by a number
    let eventId = req.params.id;
    const underscoreIndex = eventId.lastIndexOf('_');
    if (underscoreIndex > 0) {
      const suffix = eventId.substring(underscoreIndex + 1);
      if (!isNaN(suffix)) {
        eventId = eventId.substring(0, underscoreIndex);
      }
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Validate image size if provided (2MB limit for Base64)
    if (req.body.eventImage && req.body.eventImage.length > 2.67 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image size must be less than 2MB' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(eventId, req.body, { new: true });
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
    // Handle recurring instance IDs (e.g., "69820d92a506187f466f09bb_1")
    // Extract the base ID if it contains an underscore followed by a number
    let eventId = req.params.id;
    const underscoreIndex = eventId.lastIndexOf('_');
    if (underscoreIndex > 0) {
      const suffix = eventId.substring(underscoreIndex + 1);
      if (!isNaN(suffix)) {
        eventId = eventId.substring(0, underscoreIndex);
      }
    }

    const event = await Event.findById(eventId);
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
    // Handle recurring instance IDs (e.g., "69820d92a506187f466f09bb_1")
    let eventId = req.params.id;
    const underscoreIndex = eventId.lastIndexOf('_');
    if (underscoreIndex > 0) {
      const suffix = eventId.substring(underscoreIndex + 1);
      if (!isNaN(suffix)) {
        eventId = eventId.substring(0, underscoreIndex);
      }
    }

    const event = await Event.findById(eventId);
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
      await Event.updateMany({ _id: { $ne: eventId } }, { isBannerEvent: false });
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
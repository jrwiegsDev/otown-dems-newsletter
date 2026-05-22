const express = require('express');
const router = express.Router();
const Event = require('../models/eventModel');
const ArchivedEvent = require('../models/archivedEventModel');
const { protect } = require('../middleware/authMiddleware');

// Auto-archive any past events. A non-recurring event is "past" once its
// eventDate is before today. A recurring event is "past" only once its
// recurrenceEndDate is before today (so we don't archive an active series
// just because the first instance has happened). Runs on every read route
// so the Past tab always reflects reality without needing a cron job.
const archivePastEvents = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastEvents = await Event.find({
      $or: [
        // Non-recurring: simply past its date
        {
          $and: [
            { eventDate: { $lt: today } },
            { $or: [{ recurrenceType: { $exists: false } }, { recurrenceType: 'none' }, { recurrenceType: null }] },
          ],
        },
        // Recurring with an end date that has passed
        {
          $and: [
            { recurrenceType: { $in: ['weekly', 'biweekly', 'monthly'] } },
            { recurrenceEndDate: { $ne: null, $lt: today } },
          ],
        },
      ],
    });

    if (pastEvents.length === 0) return;

    for (const event of pastEvents) {
      try {
        await ArchivedEvent.create({
          eventName: event.eventName,
          eventDate: event.eventDate,
          eventTime: event.eventTime,
          startTime: event.startTime,
          endTime: event.endTime,
          isAllDay: event.isAllDay,
          eventDescription: event.eventDescription,
          eventLocation: event.eventLocation,
          eventCoordinates: event.eventCoordinates,
          eventLink: event.eventLink,
          eventLinkText: event.eventLinkText,
          eventImage: event.eventImage,
          isBannerEvent: false,
          originalCreatedAt: event.createdAt,
          originalUpdatedAt: event.updatedAt,
          originalId: event._id,
        });
        await event.deleteOne();
      } catch (innerErr) {
        console.error(`Failed to auto-archive event ${event._id}:`, innerErr);
      }
    }
  } catch (err) {
    console.error('archivePastEvents failed:', err);
  }
};

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

// Get all events (Public) - expands recurring events and includes archived
// past events so the public calendar continues to show event history.
router.get('/', async (req, res) => {
  try {
    await archivePastEvents();
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

    // Include archived (past) events so they still appear on the public
    // calendar. Strip admin-only fields (banner) and never let archived
    // events be treated as banner events.
    const archived = await ArchivedEvent.find().sort({ eventDate: 1 });
    const archivedAsEvents = archived.map((a) => {
      const obj = a.toObject();
      return {
        ...obj,
        _id: a.originalId || a._id,
        isBannerEvent: false,
        isArchived: true,
      };
    });

    const allEvents = [...expandedEvents, ...archivedAsEvents];
    allEvents.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    res.json(allEvents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get raw events without expansion (for admin editing). Includes archived
// past events (flagged with isArchived: true) so the admin calendar shows
// the full history alongside upcoming events.
router.get('/raw', protect, async (req, res) => {
  try {
    await archivePastEvents();
    const [events, archived] = await Promise.all([
      Event.find().sort({ eventDate: 1 }),
      ArchivedEvent.find().sort({ eventDate: 1 }),
    ]);
    const archivedAsEvents = archived.map((a) => {
      const obj = a.toObject();
      return {
        ...obj,
        _id: a.originalId || a._id,
        isBannerEvent: false,
        isArchived: true,
      };
    });
    res.json([...events, ...archivedAsEvents]);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc   Get all archived events
// @route  GET /api/events/archived
// @access Private
router.get('/archived', protect, async (req, res) => {
  try {
    await archivePastEvents();
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

    // Archive the event before deleting so it stays in the historical log
    try {
      await ArchivedEvent.create({
        eventName: event.eventName,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        startTime: event.startTime,
        endTime: event.endTime,
        isAllDay: event.isAllDay,
        eventDescription: event.eventDescription,
        eventLocation: event.eventLocation,
        eventCoordinates: event.eventCoordinates,
        eventLink: event.eventLink,
        eventLinkText: event.eventLinkText,
        eventImage: event.eventImage,
        isBannerEvent: false, // never archive as a banner
        originalCreatedAt: event.createdAt,
        originalUpdatedAt: event.updatedAt,
        originalId: event._id,
      });
    } catch (archiveErr) {
      console.error('Failed to archive event before delete:', archiveErr);
      // Continue with deletion even if archive fails so the admin action still works
    }

    await event.deleteOne();

    res.json({ message: 'Event deleted and archived successfully' });
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
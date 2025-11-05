// backend/routes/announcementRoutes.js

const express = require('express');
const router = express.Router();
const Announcement = require('../models/announcementModel');
const ArchivedAnnouncement = require('../models/archivedAnnouncementModel');

// @route   GET /api/announcements
// @desc    Get all announcements (sorted by most recent first)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/announcements/archived
// @desc    Get all archived announcements
// @access  Private (should be protected by auth middleware)
router.get('/archived', async (req, res) => {
  try {
    const archivedAnnouncements = await ArchivedAnnouncement.find().sort({ archivedAt: -1 });
    res.json(archivedAnnouncements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/announcements
// @desc    Create a new announcement
// @access  Private (should be protected by auth middleware)
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcement = new Announcement({
      title,
      content
    });

    const createdAnnouncement = await announcement.save();
    res.status(201).json(createdAnnouncement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/announcements/:id
// @desc    Update an announcement
// @access  Private (should be protected by auth middleware)
router.put('/:id', async (req, res) => {
  try {
    const { title, content } = req.body;

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;

    const updatedAnnouncement = await announcement.save();
    res.json(updatedAnnouncement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement (archives it first)
// @access  Private (should be protected by auth middleware)
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Archive the announcement before deletion
    const archivedAnnouncement = new ArchivedAnnouncement({
      title: announcement.title,
      content: announcement.content,
      originalCreatedAt: announcement.createdAt,
      originalId: announcement._id
    });

    await archivedAnnouncement.save();
    
    // Now delete the original announcement
    await announcement.deleteOne();
    
    res.json({ 
      message: 'Announcement archived and deleted successfully',
      archivedId: archivedAnnouncement._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

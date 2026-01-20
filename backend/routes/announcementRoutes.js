// backend/routes/announcementRoutes.js

const express = require('express');
const router = express.Router();
const Announcement = require('../models/announcementModel');

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
    const { title, content, image } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Validate image size if provided (2MB limit for Base64)
    // Base64 increases size by ~33%, so 2MB file ≈ 2.67MB Base64
    if (image && image.length > 2.67 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image size must be less than 2MB' });
    }

    const announcement = new Announcement({
      title,
      content,
      image
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
    const { title, content, image } = req.body;

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Validate image size if provided (2MB limit for Base64)
    if (image && image.length > 2.67 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image size must be less than 2MB' });
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (image !== undefined) announcement.image = image;

    const updatedAnnouncement = await announcement.save();
    res.json(updatedAnnouncement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Permanently delete an announcement
// @access  Private (should be protected by auth middleware)
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Permanently delete the announcement (including any image data)
    await announcement.deleteOne();
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

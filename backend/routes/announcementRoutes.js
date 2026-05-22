// backend/routes/announcementRoutes.js

const express = require('express');
const router = express.Router();
const Announcement = require('../models/announcementModel');
const ArchivedAnnouncement = require('../models/archivedAnnouncementModel');

// Auto-archive any announcements created in a previous calendar month.
// As soon as the month rolls over, anything from prior months gets copied
// into ArchivedAnnouncement and removed from the live collection.
const archivePastMonthAnnouncements = async () => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const past = await Announcement.find({ createdAt: { $lt: startOfMonth } });
    if (past.length === 0) return;

    for (const a of past) {
      try {
        await ArchivedAnnouncement.create({
          title: a.title,
          content: a.content,
          image: a.image,
          originalCreatedAt: a.createdAt,
          originalId: a._id,
        });
        await a.deleteOne();
      } catch (innerErr) {
        console.error(`Failed to auto-archive announcement ${a._id}:`, innerErr);
      }
    }
  } catch (err) {
    console.error('archivePastMonthAnnouncements failed:', err);
  }
};

// @route   GET /api/announcements
// @desc    Get all announcements (sorted by most recent first). Includes
// @desc    archived (past-month or deleted) announcements tagged with
// @desc    isArchived: true so the admin can split Current vs Past.
// @desc    Pass ?includeExpired=true to include expired announcements (for admin).
// @access  Public
router.get('/', async (req, res) => {
  try {
    await archivePastMonthAnnouncements();
    const includeExpired = req.query.includeExpired === 'true';

    let liveFilter = {};
    if (!includeExpired) {
      liveFilter = {
        $or: [
          { expiresAt: null },
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      };
    }

    const live = await Announcement.find(liveFilter).sort({ createdAt: -1 });
    const archived = await ArchivedAnnouncement.find().sort({ originalCreatedAt: -1 });

    const archivedAsAnnouncements = archived.map((a) => {
      const obj = a.toObject();
      return {
        ...obj,
        _id: a.originalId || a._id,
        createdAt: a.originalCreatedAt,
        isArchived: true,
      };
    });

    const merged = [...live, ...archivedAsAnnouncements].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/announcements/archived
// @desc    Get all archived announcements (raw)
// @access  Private (should be protected by auth middleware)
router.get('/archived', async (req, res) => {
  try {
    await archivePastMonthAnnouncements();
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
    const { title, content, image, expiresAt } = req.body;

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
      image,
      expiresAt: expiresAt || null
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
    const { title, content, image, expiresAt } = req.body;

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
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt || null;

    const updatedAnnouncement = await announcement.save();
    res.json(updatedAnnouncement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Archive (preserve) the announcement, then remove from the live
// @desc    collection. Deleted announcements show up in the Past tab so
// @desc    nothing is permanently lost.
// @access  Private (should be protected by auth middleware)
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    try {
      await ArchivedAnnouncement.create({
        title: announcement.title,
        content: announcement.content,
        image: announcement.image,
        originalCreatedAt: announcement.createdAt,
        originalId: announcement._id,
      });
    } catch (archiveErr) {
      console.error(`Failed to archive announcement ${announcement._id} on delete:`, archiveErr);
    }

    await announcement.deleteOne();

    res.json({ message: 'Announcement archived successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

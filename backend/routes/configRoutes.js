// backend/routes/configRoutes.js
const express = require('express');
const router = express.Router();
const SiteConfig = require('../models/siteConfigModel');
const { protect } = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/superadminMiddleware');

// @route   GET /api/config/snowfall
// @desc    Get snowfall feature status (public)
// @access  Public
router.get('/snowfall', async (req, res) => {
  try {
    const config = await SiteConfig.getConfig();
    res.json({ snowfallEnabled: config.snowfallEnabled });
  } catch (error) {
    console.error('Error fetching snowfall config:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/config/snowfall
// @desc    Toggle snowfall feature (superadmin only)
// @access  Private/SuperAdmin
router.post('/snowfall', protect, requireSuperAdmin, async (req, res) => {
  try {
    const { snowfallEnabled } = req.body;
    
    if (typeof snowfallEnabled !== 'boolean') {
      return res.status(400).json({ message: 'snowfallEnabled must be a boolean' });
    }

    const config = await SiteConfig.updateConfig({ snowfallEnabled });
    
    // Broadcast to all connected WebSocket clients
    if (req.app.locals.wss) {
      req.app.locals.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            type: 'snowfallStatusChange',
            snowfallEnabled: config.snowfallEnabled
          }));
        }
      });
    }
    
    res.json({ 
      message: 'Snowfall feature updated', 
      snowfallEnabled: config.snowfallEnabled 
    });
  } catch (error) {
    console.error('Error updating snowfall config:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

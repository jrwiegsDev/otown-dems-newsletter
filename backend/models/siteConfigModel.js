// backend/models/siteConfigModel.js
const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  snowfallEnabled: {
    type: Boolean,
    default: false,
    required: true
  },
  // Future site-wide settings can be added here
}, {
  timestamps: true
});

// Ensure only one config document exists
siteConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ snowfallEnabled: false });
  }
  return config;
};

siteConfigSchema.statics.updateConfig = async function(updates) {
  let config = await this.getConfig();
  Object.assign(config, updates);
  await config.save();
  return config;
};

module.exports = mongoose.model('SiteConfig', siteConfigSchema);

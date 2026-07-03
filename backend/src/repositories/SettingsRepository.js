const Settings = require('../models/Settings');

class SettingsRepository {
  async getSettings() {
    let settings = await Settings.findOne({});
    if (!settings) {
      // Create defaults if not exists
      settings = await Settings.create({});
    }
    return settings;
  }

  async updateSettings(settingsData) {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings(settingsData);
      return await settings.save();
    }
    Object.assign(settings, settingsData);
    return await settings.save();
  }
}

module.exports = new SettingsRepository();

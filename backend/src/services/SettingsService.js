const SettingsRepository = require('../repositories/SettingsRepository');
const logger = require('../config/logger');

class SettingsService {
  async getSettings() {
    return await SettingsRepository.getSettings();
  }

  async updateSettings(settingsData) {
    const updated = await SettingsRepository.updateSettings(settingsData);
    logger.info('SettingsService: Global restaurant settings updated.');
    return updated;
  }

  async resetSettings() {
    const reset = await SettingsRepository.resetSettings();
    logger.info('SettingsService: Global restaurant settings reset to default.');
    return reset;
  }
}

module.exports = new SettingsService();

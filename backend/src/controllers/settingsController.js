const SettingsService = require('../services/SettingsService');
const AuditLogService = require('../services/AuditLogService');

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Retrieve restaurant settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings object
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await SettingsService.getSettings();
    res.status(200).json({
      success: true,
      message: 'Settings retrieved successfully',
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Edit restaurant settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated
 */
const updateSettings = async (req, res, next) => {
  try {
    const previousSettings = await SettingsService.getSettings();
    const previousState = previousSettings.toObject();

    const settings = await SettingsService.updateSettings(req.body);

    // Audit Log the admin action
    await AuditLogService.logAction({
      adminId: req.user._id,
      action: 'UPDATE_SETTINGS',
      entityId: settings._id,
      entityType: 'Settings',
      previousState,
      newState: settings.toObject()
    });

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /settings/reset:
 *   post:
 *     summary: Reset restaurant settings to defaults (Admin only)
 *     tags: [Settings]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset to default
 */
const resetSettings = async (req, res, next) => {
  try {
    const previousSettings = await SettingsService.getSettings();
    const previousState = previousSettings.toObject();

    const settings = await SettingsService.resetSettings();

    // Audit Log the admin action
    await AuditLogService.logAction({
      adminId: req.user._id,
      action: 'RESET_SETTINGS',
      entityId: settings._id,
      entityType: 'Settings',
      previousState,
      newState: settings.toObject()
    });

    res.status(200).json({
      success: true,
      message: 'Settings reset to factory defaults successfully',
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  resetSettings
};

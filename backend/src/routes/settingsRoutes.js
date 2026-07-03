const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { settingsValidator } = require('../validators/requestValidators');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getSettings);
router.put('/', protect, adminOnly, settingsValidator, updateSettings);

module.exports = router;

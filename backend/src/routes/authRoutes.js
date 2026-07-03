const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/requestValidators');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, registerValidator, register);
router.post('/login', authLimiter, loginValidator, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;

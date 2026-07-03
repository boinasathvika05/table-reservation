const { body, validationResult } = require('express-validator');

// Middleware to check validation results and format error response
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters.',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      }
    });
  }
  next();
};

const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter'),
  validateResult
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validateResult
];

const tableValidator = [
  body('number')
    .trim()
    .notEmpty().withMessage('Table number is required')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Table number can only contain letters, numbers, hyphens, and underscores'),
  body('capacity')
    .notEmpty().withMessage('Capacity is required')
    .isInt({ min: 1 }).withMessage('Capacity must be an integer greater than 0'),
  body('status')
    .optional()
    .isIn(['available', 'maintenance']).withMessage('Status must be available or maintenance'),
  validateResult
];

const reservationValidator = [
  body('guestName')
    .trim()
    .notEmpty().withMessage('Guest name is required'),
  body('guestEmail')
    .trim()
    .notEmpty().withMessage('Guest email is required')
    .isEmail().withMessage('Please enter a valid guest email'),
  body('guestPhone')
    .optional()
    .trim(),
  body('guests')
    .notEmpty().withMessage('Guests count is required')
    .isInt({ min: 1 }).withMessage('Guests must be a positive integer'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
    .custom(val => {
      const today = new Date().toISOString().split('T')[0];
      if (val < today) {
        throw new Error('Reservation date cannot be in the past');
      }
      return true;
    }),
  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Start time must be in HH:MM format (24-hour)'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Notes cannot exceed 200 characters'),
  validateResult
];

const settingsValidator = [
  body('openingHour')
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Opening hour must be in HH:MM format'),
  body('closingHour')
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Closing hour must be in HH:MM format'),
  body('reservationDuration')
    .optional()
    .isInt({ min: 30 }).withMessage('Reservation duration must be at least 30 minutes'),
  body('maxGuestsPerBooking')
    .optional()
    .isInt({ min: 1 }).withMessage('Max guests per booking must be at least 1'),
  body('cancellationWindowHours')
    .optional()
    .isInt({ min: 0 }).withMessage('Cancellation window cannot be negative'),
  body('advanceBookingDaysLimit')
    .optional()
    .isInt({ min: 1 }).withMessage('Advance booking days must be at least 1'),
  body('bufferTimeMinutes')
    .optional()
    .isInt({ min: 0 }).withMessage('Buffer time cannot be negative'),
  body('averageSpendPerGuest')
    .optional()
    .isFloat({ min: 0 }).withMessage('Average spend cannot be negative'),
  validateResult
];

module.exports = {
  registerValidator,
  loginValidator,
  tableValidator,
  reservationValidator,
  settingsValidator
};

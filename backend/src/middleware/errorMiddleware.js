const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the complete stack trace internally
  logger.error(`${err.name} - ${err.message}`, { stack: err.stack, path: req.originalUrl, method: req.method });

  // Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `Duplicate value entered for ${field} field.`;
    error.statusCode = 400;
    error.code = 'DUPLICATE_KEY_ERROR';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error.message = message;
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    error.message = `Resource not found with id of ${err.value}`;
    error.statusCode = 404;
    error.code = 'RESOURCE_NOT_FOUND';
  }

  // Map common business error codes to HTTP status codes
  const errorStatusMap = {
    'RESERVATION_NOT_FOUND': 404,
    'TABLE_NOT_FOUND': 404,
    'TABLE_NUMBER_EXISTS': 400,
    'TABLE_HAS_RESERVATIONS': 400,
    'INVALID_GUESTS': 400,
    'GUEST_LIMIT_EXCEEDED': 400,
    'INVALID_DATE': 400,
    'ADVANCE_LIMIT_EXCEEDED': 400,
    'TABLE_UNAVAILABLE': 400,
    'CONCURRENCY_CONFLICT': 400,
    'RESERVATION_LIFECYCLE_LOCKED': 400,
    'CANCELLATION_WINDOW_PASSED': 400,
    'OUT_OF_HOURS': 400,
    'INVALID_STATUS_TRANSITION': 400,
    'UNAUTHORIZED_ACTION': 403
  };

  // Custom errors thrown by services
  const errorCode = error.code || err.code || 'SERVER_ERROR';
  const statusCode = error.statusCode || err.statusCode || errorStatusMap[errorCode] || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: error.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
};

module.exports = errorHandler;

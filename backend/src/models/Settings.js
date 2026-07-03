const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Settings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         openingHour:
 *           type: string
 *           description: Business opening hour (HH:MM)
 *         closingHour:
 *           type: string
 *           description: Business closing hour (HH:MM)
 *         reservationDuration:
 *           type: integer
 *           description: Standard reservation length in minutes
 *         maxGuestsPerBooking:
 *           type: integer
 *         cancellationWindowHours:
 *           type: integer
 *           description: Free cancellation cut-off in hours
 *         advanceBookingDaysLimit:
 *           type: integer
 *           description: Limit of how many days in advance a user can book
 *         bufferTimeMinutes:
 *           type: integer
 *           description: Turnaround buffer time between tables in minutes
 *         averageSpendPerGuest:
 *           type: number
 *           description: Estimated revenue calculation metric
 *         holidayDates:
 *           type: array
 *           items:
 *             type: string
 *         weekendRestrictions:
 *           type: boolean
 */
const SettingsSchema = new mongoose.Schema(
  {
    openingHour: {
      type: String,
      default: '11:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Please use HH:MM format (24-hour)']
    },
    closingHour: {
      type: String,
      default: '22:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Please use HH:MM format (24-hour)']
    },
    reservationDuration: {
      type: Number,
      default: 120, // 2 hours
      min: [30, 'Duration must be at least 30 minutes']
    },
    maxGuestsPerBooking: {
      type: Number,
      default: 20,
      min: [1, 'Maximum guests must be at least 1']
    },
    cancellationWindowHours: {
      type: Number,
      default: 24,
      min: [0, 'Cancellation window cannot be negative']
    },
    advanceBookingDaysLimit: {
      type: Number,
      default: 90,
      min: [1, 'Must allow at least 1 day in advance']
    },
    bufferTimeMinutes: {
      type: Number,
      default: 15,
      min: [0, 'Buffer time cannot be negative']
    },
    averageSpendPerGuest: {
      type: Number,
      default: 30,
      min: [0, 'Average spend cannot be negative']
    },
    holidayDates: {
      type: [String], // Array of 'YYYY-MM-DD' strings
      default: []
    },
    weekendRestrictions: {
      type: Boolean,
      default: false
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true
    },
    enableTableJoining: {
      type: Boolean,
      default: true
    },
    maxTablesPerReservation: {
      type: Number,
      default: 2,
      min: [1, 'Must allow at least 1 table per reservation']
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true
    },
    enableBookingReminders: {
      type: Boolean,
      default: true
    },
    enableCancellationNotifications: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Settings', SettingsSchema);

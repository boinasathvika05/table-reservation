const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       required:
 *         - user
 *         - guestName
 *         - guestEmail
 *         - tables
 *         - guests
 *         - date
 *         - startTime
 *         - endTime
 *       properties:
 *         id:
 *           type: string
 *         user:
 *           type: string
 *           description: ID of user booking the table
 *         guestName:
 *           type: string
 *           description: Name of main guest
 *         guestEmail:
 *           type: string
 *         guestPhone:
 *           type: string
 *         tables:
 *           type: array
 *           items:
 *             type: string
 *           description: List of assigned table IDs
 *         guests:
 *           type: integer
 *           description: Count of guests in the booking
 *         date:
 *           type: string
 *           description: Date of reservation in YYYY-MM-DD
 *         startTime:
 *           type: string
 *           description: Start time in HH:MM format
 *         endTime:
 *           type: string
 *           description: End time in HH:MM format
 *         status:
 *           type: string
 *           enum: [pending, confirmed, checked_in, completed, cancelled, no_show]
 *         estimatedRevenue:
 *           type: number
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
const ReservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    guestName: {
      type: String,
      required: [true, 'Please provide the guest name'],
      trim: true
    },
    guestEmail: {
      type: String,
      required: [true, 'Please provide the guest email'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    guestPhone: {
      type: String,
      trim: true
    },
    tables: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: true
      }
    ],
    guests: {
      type: Number,
      required: [true, 'Please provide the number of guests'],
      min: [1, 'Must have at least 1 guest']
    },
    date: {
      type: String, // format YYYY-MM-DD
      required: [true, 'Please provide the reservation date'],
      index: true
    },
    startTime: {
      type: String, // format HH:MM
      required: [true, 'Please provide the start time']
    },
    endTime: {
      type: String, // format HH:MM
      required: [true, 'Please provide the end time']
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true
    },
    estimatedRevenue: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  },
  {
    timestamps: true,
    optimisticConcurrency: true
  }
);

// Compound Index to check table availability on a specific date
ReservationSchema.index({ date: 1, tables: 1 });
// Index status + times for cron query optimizations
ReservationSchema.index({ status: 1, date: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Reservation', ReservationSchema);

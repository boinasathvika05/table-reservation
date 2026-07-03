const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Table:
 *       type: object
 *       required:
 *         - number
 *         - capacity
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         number:
 *           type: string
 *           description: Unique table label/number (e.g. T1, T2)
 *         capacity:
 *           type: integer
 *           description: Seat capacity of the table
 *         status:
 *           type: string
 *           enum: [available, maintenance]
 *           description: Status of the table availability
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
const TableSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: [true, 'Please provide a table number'],
      unique: true,
      trim: true,
      index: true
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide table capacity'],
      min: [1, 'Table capacity must be at least 1'],
      index: true
    },
    status: {
      type: String,
      enum: ['available', 'maintenance'],
      default: 'available',
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Table', TableSchema);

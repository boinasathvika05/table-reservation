const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         adminId:
 *           type: string
 *           description: ID of admin who performed action
 *         action:
 *           type: string
 *           description: Action performed (e.g. UPDATE_RESERVATION, DELETE_TABLE)
 *         entityId:
 *           type: string
 *           description: Affected entity's ID
 *         entityType:
 *           type: string
 *           enum: [Reservation, Table, Settings]
 *         previousState:
 *           type: object
 *         newState:
 *           type: object
 *         timestamp:
 *           type: string
 *           format: date-time
 */
const AuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  entityType: {
    type: String,
    enum: ['Reservation', 'Table', 'Settings'],
    required: true,
    index: true
  },
  previousState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);

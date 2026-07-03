const express = require('express');
const { 
  createReservation, 
  getReservations, 
  getReservation, 
  updateReservation, 
  cancelReservation, 
  checkInReservation, 
  getStats 
} = require('../controllers/reservationController');
const { reservationValidator } = require('../validators/requestValidators');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, reservationValidator, createReservation);
router.get('/', protect, getReservations);
router.get('/stats', protect, adminOnly, getStats);
router.get('/:id', protect, getReservation);
router.put('/:id', protect, reservationValidator, updateReservation);
router.put('/:id/cancel', protect, cancelReservation);
router.put('/:id/check-in', protect, adminOnly, checkInReservation);

module.exports = router;

const ReservationService = require('../services/ReservationService');

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guestName
 *               - guestEmail
 *               - guests
 *               - date
 *               - startTime
 *             properties:
 *               guestName:
 *                 type: string
 *               guestEmail:
 *                 type: string
 *               guestPhone:
 *                 type: string
 *               guests:
 *                 type: integer
 *               date:
 *                 type: string
 *               startTime:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reservation created
 */
const createReservation = async (req, res, next) => {
  try {
    const { guestName, guestEmail, guestPhone, guests, date, startTime, notes } = req.body;
    
    // Customers can only book for themselves, Admins can book for anyone.
    // If admin is booking, they might specify a user, but we'll link it to their user if not specified.
    const user = req.body.user || req.user._id;

    const reservation = await ReservationService.createReservation({
      user,
      guestName,
      guestEmail,
      guestPhone,
      guests,
      date,
      startTime,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: { reservation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Retrieve filtered & paginated reservations list
 *     tags: [Reservations]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *       - name: date
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered reservations list
 */
const getReservations = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    
    // Enforce customer constraint: only see own bookings
    if (req.user.role !== 'admin') {
      filters.user = req.user._id;
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    // Sorting (default newest first)
    const sortField = req.query.sortField || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const data = await ReservationService.getReservations(filters, { page, limit, sort });

    res.status(200).json({
      success: true,
      message: 'Reservations retrieved successfully',
      data: { reservations: data.reservations },
      meta: {
        page: data.page,
        limit: data.limit,
        total: data.total
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Get single reservation
 *     tags: [Reservations]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Reservation details
 */
const getReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await ReservationService.getReservationById(id);

    // Enforce ownership
    if (req.user.role !== 'admin' && reservation.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. You do not own this reservation.'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reservation retrieved successfully',
      data: { reservation }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /reservations/{id}:
 *   put:
 *     summary: Update reservation details (re-allocates tables)
 *     tags: [Reservations]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Updated reservation details
 */
const updateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check ownership before editing
    const checkRes = await ReservationService.getReservationById(id);
    if (req.user.role !== 'admin' && checkRes.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. You do not own this reservation.'
        }
      });
    }

    // Only admins pass adminUserId for audit logs
    const adminUserId = req.user.role === 'admin' ? req.user._id : null;
    const updated = await ReservationService.updateReservation(id, req.body, adminUserId);

    res.status(200).json({
      success: true,
      message: 'Reservation updated successfully',
      data: { reservation: updated }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /reservations/{id}/cancel:
 *   put:
 *     summary: Cancel a reservation (Checked cancellation policy window)
 *     tags: [Reservations]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Cancelled reservation status
 */
const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check ownership before editing
    const checkRes = await ReservationService.getReservationById(id);
    if (req.user.role !== 'admin' && checkRes.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. You do not own this reservation.'
        }
      });
    }

    const cancelled = await ReservationService.cancelReservation(id, req.user.role, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: { reservation: cancelled }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /reservations/{id}/check-in:
 *   put:
 *     summary: Check-in guest (Admin only)
 *     tags: [Reservations]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Checked in reservation status
 */
const checkInReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const checkedIn = await ReservationService.checkInReservation(id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Guest checked in successfully',
      data: { reservation: checkedIn }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /reservations/stats:
 *   get:
 *     summary: Get analytics dashboard statistics (Admin only)
 *     tags: [Reservations]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics object
 */
const getStats = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const basic = await ReservationService.getBasicStats(date);
    const advanced = await ReservationService.getAdvancedStats();

    res.status(200).json({
      success: true,
      message: 'Statistics loaded successfully',
      data: {
        basic,
        advanced
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getReservations,
  getReservation,
  updateReservation,
  cancelReservation,
  checkInReservation,
  getStats
};

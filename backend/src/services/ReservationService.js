const ReservationRepository = require('../repositories/ReservationRepository');
const TableRepository = require('../repositories/TableRepository');
const SettingsRepository = require('../repositories/SettingsRepository');
const AuditLogService = require('./AuditLogService');
const NotificationService = require('./NotificationService');
const { allocateTables } = require('../utils/reservationEngine');
const logger = require('../config/logger');

class ReservationService {
  /**
   * Creates a new reservation.
   * Employs concurrency double-checks to block race conditions.
   */
  async createReservation({ user, guestName, guestEmail, guestPhone, guests, date, startTime, notes }) {
    const settings = await SettingsRepository.getSettings();

    // 1. Core validations
    if (guests <= 0) {
      const err = new Error('Guests count must be greater than 0');
      err.code = 'INVALID_GUESTS';
      throw err;
    }
    if (guests > settings.maxGuestsPerBooking) {
      const err = new Error(`Guests count exceeds max limit of ${settings.maxGuestsPerBooking}`);
      err.code = 'GUEST_LIMIT_EXCEEDED';
      throw err;
    }

    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      const err = new Error('Cannot book in the past');
      err.code = 'INVALID_DATE';
      throw err;
    }

    // Check advance booking days
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + settings.advanceBookingDaysLimit);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    if (date > maxDateStr) {
      const err = new Error(`Cannot book further than ${settings.advanceBookingDaysLimit} days in advance`);
      err.code = 'ADVANCE_LIMIT_EXCEEDED';
      throw err;
    }

    // 2. Fetch tables and active reservations
    const allTables = await TableRepository.findAll();
    const activeReservations = await ReservationRepository.findOverlapping(
      date,
      allTables.map(t => t._id),
      '00:00',
      '23:59'
    );

    // 3. Allocate tables using optimization engine
    const allocation = allocateTables({
      guests,
      date,
      startTime,
      allTables,
      activeReservations,
      settings
    });

    const tableIds = allocation.tables.map(t => t._id);

    // 4. CONCURRENCY PROTECTION (Double check overlap right before database write)
    const overlaps = await ReservationRepository.findOverlapping(
      date,
      tableIds,
      startTime,
      allocation.endTime
    );

    if (overlaps.length > 0) {
      logger.warn(`Concurrency conflict detected for tables [${allocation.tables.map(t => t.number).join(', ')}] on ${date} at ${startTime}. Retrying or rejecting.`);
      const err = new Error('Table was just booked by another user. Please choose another time.');
      err.code = 'CONCURRENCY_CONFLICT';
      throw err;
    }

    // 5. Create reservation document
    const estimatedRevenue = guests * settings.averageSpendPerGuest;

    const reservation = await ReservationRepository.create({
      user,
      guestName,
      guestEmail,
      guestPhone,
      tables: tableIds,
      guests,
      date,
      startTime,
      endTime: allocation.endTime,
      estimatedRevenue,
      status: 'confirmed', // Auto-confirm bookings if tables exist
      notes
    });

    logger.info(`ReservationService: Created reservation ${reservation._id} for ${guests} guests.`);

    // 6. Notify Customer
    await NotificationService.sendNotification({
      recipient: guestEmail,
      subject: 'Reservation Confirmed',
      body: `Hi ${guestName}, your reservation for ${guests} guests on ${date} at ${startTime} has been confirmed. We look forward to seeing you!`,
      channels: ['email']
    });

    return reservation;
  }

  async getReservationById(id) {
    const reservation = await ReservationRepository.findById(id);
    if (!reservation) {
      const err = new Error('Reservation not found');
      err.code = 'RESERVATION_NOT_FOUND';
      throw err;
    }
    return reservation;
  }

  async getReservations(filters, options) {
    return await ReservationRepository.findFiltered(filters, options);
  }

  /**
   * Updates an existing reservation.
   * Re-allocates tables if guests, date, or time changes.
   */
  async updateReservation(id, updateData, adminUserId = null) {
    const reservation = await ReservationRepository.findById(id);
    if (!reservation) {
      const err = new Error('Reservation not found');
      err.code = 'RESERVATION_NOT_FOUND';
      throw err;
    }

    // Prevent edit if Completed or No Show
    if (['completed', 'no_show'].includes(reservation.status)) {
      const err = new Error('Cannot edit a completed or expired reservation');
      err.code = 'RESERVATION_LIFECYCLE_LOCKED';
      throw err;
    }

    const previousState = reservation.toObject();

    // If changing details that affect table allocation
    const isAllocationChange = 
      (updateData.guests && updateData.guests !== reservation.guests) ||
      (updateData.date && updateData.date !== reservation.date) ||
      (updateData.startTime && updateData.startTime !== reservation.startTime);

    if (isAllocationChange) {
      const targetGuests = updateData.guests || reservation.guests;
      const targetDate = updateData.date || reservation.date;
      const targetTime = updateData.startTime || reservation.startTime;

      const settings = await SettingsRepository.getSettings();
      const allTables = await TableRepository.findAll();
      
      // Find overlaps, excluding current reservation
      const activeReservations = await ReservationRepository.findOverlapping(
        targetDate,
        allTables.map(t => t._id),
        '00:00',
        '23:59',
        reservation._id
      );

      const allocation = allocateTables({
        guests: targetGuests,
        date: targetDate,
        startTime: targetTime,
        allTables,
        activeReservations,
        settings
      });

      // Concurrency Double-Check
      const overlaps = await ReservationRepository.findOverlapping(
        targetDate,
        allocation.tables.map(t => t._id),
        targetTime,
        allocation.endTime,
        reservation._id
      );

      if (overlaps.length > 0) {
        const err = new Error('Selected slot is no longer available.');
        err.code = 'CONCURRENCY_CONFLICT';
        throw err;
      }

      updateData.tables = allocation.tables.map(t => t._id);
      updateData.endTime = allocation.endTime;
      updateData.estimatedRevenue = targetGuests * settings.averageSpendPerGuest;
    }

    const updated = await ReservationRepository.update(id, updateData);

    // Write Audit Log if admin edited
    if (adminUserId) {
      await AuditLogService.logAction({
        adminId: adminUserId,
        action: 'UPDATE_RESERVATION',
        entityId: id,
        entityType: 'Reservation',
        previousState,
        newState: updated.toObject()
      });
    }

    // Notify guest of changes
    await NotificationService.sendNotification({
      recipient: updated.guestEmail,
      subject: 'Reservation Details Updated',
      body: `Your reservation details have been updated. Your booking is on ${updated.date} at ${updated.startTime}.`,
      channels: ['email']
    });

    return updated;
  }

  /**
   * Cancels a reservation.
   * Checks policy cancellation window for customers.
   */
  async cancelReservation(id, userRole, userId) {
    const reservation = await ReservationRepository.findById(id);
    if (!reservation) {
      const err = new Error('Reservation not found');
      err.code = 'RESERVATION_NOT_FOUND';
      throw err;
    }

    if (['completed', 'cancelled', 'no_show'].includes(reservation.status)) {
      const err = new Error(`Reservation is already ${reservation.status}`);
      err.code = 'RESERVATION_LIFECYCLE_LOCKED';
      throw err;
    }

    // Check cancellation window for customers
    if (userRole !== 'admin') {
      const settings = await SettingsRepository.getSettings();
      const resDateTime = new Date(`${reservation.date}T${reservation.startTime}`);
      const diffHours = (resDateTime - new Date()) / (1000 * 60 * 60);

      if (diffHours < settings.cancellationWindowHours) {
        const err = new Error(`Cannot cancel reservation within ${settings.cancellationWindowHours} hours of booking.`);
        err.code = 'CANCELLATION_WINDOW_PASSED';
        throw err;
      }
    }

    const previousState = reservation.toObject();
    reservation.status = 'cancelled';
    const updated = await reservation.save();

    if (userRole === 'admin') {
      await AuditLogService.logAction({
        adminId: userId,
        action: 'CANCEL_RESERVATION',
        entityId: id,
        entityType: 'Reservation',
        previousState,
        newState: updated.toObject()
      });
    }

    await NotificationService.sendNotification({
      recipient: updated.guestEmail,
      subject: 'Reservation Cancelled',
      body: `Your reservation on ${updated.date} at ${updated.startTime} has been successfully cancelled.`,
      channels: ['email']
    });

    return updated;
  }

  /**
   * Manually check in a reservation.
   */
  async checkInReservation(id, adminUserId) {
    const reservation = await ReservationRepository.findById(id);
    if (!reservation) {
      const err = new Error('Reservation not found');
      err.code = 'RESERVATION_NOT_FOUND';
      throw err;
    }

    if (reservation.status !== 'confirmed' && reservation.status !== 'pending') {
      const err = new Error(`Cannot check in reservation with status: ${reservation.status}`);
      err.code = 'INVALID_STATUS_TRANSITION';
      throw err;
    }

    const previousState = reservation.toObject();
    reservation.status = 'checked_in';
    const updated = await reservation.save();

    await AuditLogService.logAction({
      adminId: adminUserId,
      action: 'CHECK_IN_RESERVATION',
      entityId: id,
      entityType: 'Reservation',
      previousState,
      newState: updated.toObject()
    });

    return updated;
  }

  async getBasicStats(date) {
    return await ReservationRepository.getBasicStats(date);
  }

  async getAdvancedStats() {
    return await ReservationRepository.getAdvancedStats();
  }
}

module.exports = new ReservationService();

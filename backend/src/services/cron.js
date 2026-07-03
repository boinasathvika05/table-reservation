const cron = require('node-cron');
const Reservation = require('../models/Reservation');
const logger = require('../config/logger');

// Sweeper function to transition expired states
const sweepReservations = async () => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    logger.info(`Cron Scheduler: Starting reservation status sweep at ${todayStr} ${currentTimeStr}...`);

    // 1. Resolve Checked In -> Completed
    // If reservation date is in the past OR (reservation date is today AND endTime is in the past)
    const completedResult = await Reservation.updateMany(
      {
        status: 'checked_in',
        $or: [
          { date: { $lt: todayStr } },
          { date: todayStr, endTime: { $lte: currentTimeStr } }
        ]
      },
      { status: 'completed' }
    );

    if (completedResult.modifiedCount > 0) {
      logger.info(`Cron Scheduler: Marked ${completedResult.modifiedCount} checked_in reservations as completed.`);
    }

    // 2. Resolve Confirmed/Pending -> No Show
    // Mark as no-show if the booking endTime has passed and they never checked in
    const noShowResult = await Reservation.updateMany(
      {
        status: { $in: ['confirmed', 'pending'] },
        $or: [
          { date: { $lt: todayStr } },
          { date: todayStr, endTime: { $lte: currentTimeStr } }
        ]
      },
      { status: 'no_show' }
    );

    if (noShowResult.modifiedCount > 0) {
      logger.info(`Cron Scheduler: Marked ${noShowResult.modifiedCount} confirmed/pending reservations as no_show.`);
    }

    logger.info('Cron Scheduler: Reservation status sweep completed successfully.');
  } catch (error) {
    logger.error('Cron Scheduler Error running reservation sweep:', error);
  }
};

// Setup cron schedule (Every 5 minutes)
const startScheduler = () => {
  cron.schedule('*/5 * * * *', () => {
    sweepReservations();
  });
  logger.info('Cron Scheduler: Background jobs initialized (interval: 5 mins).');
  
  // Also run immediately on server startup to handle cleanup from server downtime
  sweepReservations();
};

module.exports = {
  startScheduler,
  sweepReservations
};

const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

class ReservationRepository {
  async create(reservationData) {
    const reservation = new Reservation(reservationData);
    return await reservation.save();
  }

  async findById(id) {
    return await Reservation.findById(id).populate('tables').populate('user', 'name email');
  }

  async update(id, updateData) {
    return await Reservation.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('tables').populate('user', 'name email');
  }

  async findOverlapping(date, tableIds, startTime, endTime, excludeReservationId = null) {
    const query = {
      date,
      tables: { $in: tableIds },
      status: { $in: ['pending', 'confirmed', 'checked_in', 'completed'] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    };

    if (excludeReservationId) {
      query._id = { $ne: excludeReservationId };
    }

    return await Reservation.find(query);
  }

  async findFiltered(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { date: -1, startTime: -1 } } = options;
    const skip = (page - 1) * limit;

    const query = {};

    if (filters.user) {
      query.user = filters.user;
    }
    if (filters.date) {
      query.date = filters.date;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.guests) {
      query.guests = Number(filters.guests);
    }
    if (filters.table) {
      query.tables = filters.table;
    }
    if (filters.startTime) {
      query.startTime = filters.startTime;
    }
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { guestName: searchRegex },
        { guestEmail: searchRegex }
      ];
    }

    const total = await Reservation.countDocuments(query);
    const reservations = await Reservation.find(query)
      .populate('tables')
      .populate('user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return {
      reservations,
      total,
      page,
      limit
    };
  }

  async getBasicStats(date) {
    // Counts for a specific date
    const allTablesCount = await Table.countDocuments({ status: 'available' });
    
    const reservationsToday = await Reservation.find({
      date,
      status: { $in: ['confirmed', 'checked_in', 'completed', 'pending'] }
    });

    const bookedTableIds = new Set();
    let estimatedRevenue = 0;
    
    reservationsToday.forEach(r => {
      r.tables.forEach(tId => bookedTableIds.add(tId.toString()));
      estimatedRevenue += r.estimatedRevenue || 0;
    });

    const occupiedTablesCount = bookedTableIds.size;
    const availableTablesCount = Math.max(0, allTablesCount - occupiedTablesCount);
    const occupancyPercentage = allTablesCount > 0 
      ? Math.round((occupiedTablesCount / allTablesCount) * 100) 
      : 0;

    return {
      totalReservations: reservationsToday.length,
      estimatedRevenue,
      occupiedTables: occupiedTablesCount,
      availableTables: availableTablesCount,
      occupancyPercentage
    };
  }

  async getAdvancedStats() {
    const totalBookings = await Reservation.countDocuments({});
    
    // Average guests per reservation
    const avgGuestsResult = await Reservation.aggregate([
      { $group: { _id: null, avgGuests: { $avg: '$guests' } } }
    ]);
    const averageGuests = avgGuestsResult.length > 0 ? Math.round(avgGuestsResult[0].avgGuests * 10) / 10 : 0;

    // Cancellation rate
    const cancelledCount = await Reservation.countDocuments({ status: 'cancelled' });
    const cancellationRate = totalBookings > 0 ? Math.round((cancelledCount / totalBookings) * 100) : 0;

    // Repeat customers count (users with >1 reservation)
    const repeatResult = await Reservation.aggregate([
      { $group: { _id: '$guestEmail', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 }, _id: { $ne: null } } },
      { $count: 'repeatCount' }
    ]);
    const repeatCustomers = repeatResult.length > 0 ? repeatResult[0].repeatCount : 0;

    // Most popular table
    const popTableResult = await Reservation.aggregate([
      { $unwind: '$tables' },
      { $group: { _id: '$tables', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'tables',
          localField: '_id',
          foreignField: '_id',
          as: 'tableInfo'
        }
      },
      { $unwind: '$tableInfo' }
    ]);
    const mostPopularTable = popTableResult.length > 0 
      ? { number: popTableResult[0].tableInfo.number, count: popTableResult[0].count }
      : { number: 'N/A', count: 0 };

    // Average booking lead time in days (difference between createdAt and date)
    const leadTimeResult = await Reservation.aggregate([
      {
        $project: {
          dateObj: { $dateFromString: { dateString: '$date' } },
          createdAt: 1
        }
      },
      {
        $project: {
          leadTimeMs: { $subtract: ['$dateObj', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgLeadTimeMs: { $avg: '$leadTimeMs' }
        }
      }
    ]);
    
    let averageLeadTimeDays = 0;
    if (leadTimeResult.length > 0 && leadTimeResult[0].avgLeadTimeMs) {
      const msInDay = 1000 * 60 * 60 * 24;
      averageLeadTimeDays = Math.round((leadTimeResult[0].avgLeadTimeMs / msInDay) * 10) / 10;
      // Safeguard against negative lead times for walk-ins
      if (averageLeadTimeDays < 0) averageLeadTimeDays = 0;
    }

    // Peak booking hour
    const peakHourResult = await Reservation.aggregate([
      {
        $project: {
          hour: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 0] }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const peakBookingHour = peakHourResult.length > 0 ? `${peakHourResult[0]._id}:00` : 'N/A';

    // Reservation trends (last 7 days of bookings)
    const trends = await Reservation.aggregate([
      {
        $group: {
          _id: '$date',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    // Heatmap data: Group by Day of Week and Hour
    const heatmapResult = await Reservation.aggregate([
      {
        $project: {
          dateObj: { $dateFromString: { dateString: '$date' } },
          hour: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 0] }
        }
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$dateObj' }, // 1 (Sunday) to 7 (Saturday)
          hour: { $toInt: '$hour' }
        }
      },
      {
        $group: {
          _id: { dayOfWeek: '$dayOfWeek', hour: '$hour' },
          count: { $sum: 1 }
        }
      }
    ]);

    const heatmap = heatmapResult.map(item => ({
      dayOfWeek: item._id.dayOfWeek,
      hour: item._id.hour,
      count: item.count
    }));

    return {
      totalBookings,
      averageGuests,
      cancellationRate,
      repeatCustomers,
      mostPopularTable,
      averageLeadTimeDays,
      peakBookingHour,
      trends: trends.reverse(),
      heatmap
    };
  }
}

module.exports = new ReservationRepository();

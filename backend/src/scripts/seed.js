const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-reservation';
    console.log(`Connecting to database: ${connStr}`);
    await mongoose.connect(connStr);
    console.log('Connected to MongoDB. Starting database seeding...');

    // 1. Clear Existing Data
    await User.deleteMany({});
    await Table.deleteMany({});
    await Reservation.deleteMany({});
    await Settings.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('Cleared existing data from all collections.');

    // 2. Create Users
    console.log('Creating users...');
    const admin = await User.create({
      name: 'Admin Manager',
      email: 'admin@restaurant.com',
      password: 'Password123', // Will be hashed in pre-save middleware
      role: 'admin'
    });

    const customer = await User.create({
      name: 'John Doe',
      email: 'john@gmail.com',
      password: 'Password123',
      role: 'customer'
    });

    const customer2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@gmail.com',
      password: 'Password123',
      role: 'customer'
    });

    console.log('Seeded users successfully.');

    // 3. Create Settings
    console.log('Creating settings...');
    const settings = await Settings.create({
      openingHour: '11:00',
      closingHour: '23:00',
      reservationDuration: 120, // 2 hours
      maxGuestsPerBooking: 20,
      cancellationWindowHours: 24,
      advanceBookingDaysLimit: 90,
      bufferTimeMinutes: 15,
      averageSpendPerGuest: 35,
      holidayDates: [],
      weekendRestrictions: false
    });
    console.log('Seeded settings successfully.');

    // 4. Create Tables (15 Tables)
    console.log('Creating tables...');
    const tablesData = [
      { number: 'T1', capacity: 2 },
      { number: 'T2', capacity: 2 },
      { number: 'T3', capacity: 2 },
      { number: 'T4', capacity: 2 },
      { number: 'T5', capacity: 4 },
      { number: 'T6', capacity: 4 },
      { number: 'T7', capacity: 4 },
      { number: 'T8', capacity: 4 },
      { number: 'T9', capacity: 6 },
      { number: 'T10', capacity: 6 },
      { number: 'T11', capacity: 6 },
      { number: 'T12', capacity: 8 },
      { number: 'T13', capacity: 8 },
      { number: 'T14', capacity: 10, status: 'maintenance' },
      { number: 'T15', capacity: 12 }
    ];

    const seededTables = await Table.insertMany(tablesData);
    console.log(`Seeded ${seededTables.length} tables successfully.`);

    // 5. Create Sample Reservations
    console.log('Creating sample reservations...');
    const today = new Date().toISOString().split('T')[0];
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    // Helper to find table by number
    const getTableId = (num) => seededTables.find(t => t.number === num)._id;

    const reservationsData = [
      // Completed (Yesterday)
      {
        user: customer._id,
        guestName: customer.name,
        guestEmail: customer.email,
        tables: [getTableId('T5')], // Table for 4
        guests: 3,
        date: yesterdayStr,
        startTime: '18:00',
        endTime: '20:00',
        status: 'completed',
        estimatedRevenue: 105,
        notes: 'Anniversary dinner. Preferred quiet area.'
      },
      // Cancelled (Yesterday)
      {
        user: customer2._id,
        guestName: customer2.name,
        guestEmail: customer2.email,
        tables: [getTableId('T1')],
        guests: 2,
        date: yesterdayStr,
        startTime: '12:00',
        endTime: '14:00',
        status: 'cancelled',
        estimatedRevenue: 70
      },
      // Checked In (Today, happening now)
      {
        user: customer2._id,
        guestName: customer2.name,
        guestEmail: customer2.email,
        tables: [getTableId('T9')], // Table for 6
        guests: 5,
        date: today,
        startTime: '13:00',
        endTime: '15:00',
        status: 'checked_in',
        estimatedRevenue: 175,
        notes: 'Requires high chair for child.'
      },
      // Confirmed (Tomorrow)
      {
        user: customer._id,
        guestName: customer.name,
        guestEmail: customer.email,
        tables: [getTableId('T12')], // Table for 8
        guests: 7,
        date: tomorrowStr,
        startTime: '19:00',
        endTime: '21:00',
        status: 'confirmed',
        estimatedRevenue: 245
      },
      // Confirmed (Day After)
      {
        user: customer2._id,
        guestName: 'Private Party',
        guestEmail: 'corporate@agency.com',
        tables: [getTableId('T12'), getTableId('T13')], // Joined tables (8 + 8 = 16 capacity)
        guests: 14,
        date: dayAfterStr,
        startTime: '18:00',
        endTime: '20:00',
        status: 'confirmed',
        estimatedRevenue: 490,
        notes: 'Corporate gathering, split bills.'
      },
      // No Show (Past slot today)
      {
        user: customer._id,
        guestName: 'Late Guest',
        guestEmail: 'late@gmail.com',
        tables: [getTableId('T2')],
        guests: 2,
        date: today,
        startTime: '11:00',
        endTime: '13:00',
        status: 'no_show',
        estimatedRevenue: 70
      }
    ];

    const seededReservations = await Reservation.insertMany(reservationsData);
    console.log(`Seeded ${seededReservations.length} reservations successfully.`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding database failed:', error);
    process.exit(1);
  }
};

seedDB();

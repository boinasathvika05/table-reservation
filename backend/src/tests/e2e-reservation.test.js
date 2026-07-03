const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');

jest.setTimeout(30000); // Increase timeout for DB operations

describe('Phase 2: Core Reservation Engine E2E Tests', () => {
  let customerToken = '';
  let adminToken = '';
  let testDate = new Date();
  testDate.setDate(testDate.getDate() + 5); // 5 days from now
  const dateStr = testDate.toISOString().split('T')[0];

  beforeAll(async () => {
    await connectDB();
    
    // Cleanup
    await User.deleteMany({ email: { $regex: 'qa_res_' } });
    await Table.deleteMany({ number: { $regex: 'QA_' } });
    await Reservation.deleteMany({ guestEmail: { $regex: 'qa_res_' } });

    // 1. Create a customer
    const customerRes = await request(app).post('/api/auth/register').send({
      name: 'QA Res Customer',
      email: 'qa_res_customer@example.com',
      password: 'Password123!',
      role: 'customer'
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'qa_res_customer@example.com',
      password: 'Password123!'
    });
    customerToken = loginRes.body.data.token;

    // 2. Create an admin
    await request(app).post('/api/auth/register').send({
      name: 'QA Res Admin',
      email: 'qa_res_admin@example.com',
      password: 'Password123!',
      role: 'admin'
    });
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'qa_res_admin@example.com',
      password: 'Password123!'
    });
    adminToken = adminLoginRes.body.data.token;

    // 3. Create tables using admin token
    const tables = [
      { number: 'QA_T1', capacity: 2 },
      { number: 'QA_T2', capacity: 4 },
      { number: 'QA_T3', capacity: 4 },
      { number: 'QA_T4', capacity: 8 }
    ];
    
    for (const t of tables) {
      await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(t);
    }
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: 'qa_res_' } });
    await Table.deleteMany({ number: { $regex: 'QA_' } });
    await Reservation.deleteMany({ guestEmail: { $regex: 'qa_res_' } });
    await mongoose.connection.close();
  });

  describe('Reservation Creation & Allocation', () => {
    it('should allocate a single table for 2 guests', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          guestName: 'John Doe',
          guestEmail: 'qa_res_john@example.com',
          guests: 2,
          date: dateStr,
          startTime: '18:00'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reservation.tables.length).toBeGreaterThan(0);
      expect(res.body.data.reservation.status).toBe('confirmed');
    });

    it('should allocate a different table for another 4 guests at the same time', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          guestName: 'Jane Smith',
          guestEmail: 'qa_res_jane@example.com',
          guests: 4,
          date: dateStr,
          startTime: '18:00'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reservation.tables.length).toBeGreaterThan(0);
    });

    it('should allocate joined tables for 12 guests', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          guestName: 'Big Party',
          guestEmail: 'qa_res_party@example.com',
          guests: 12,
          date: dateStr,
          startTime: '19:00' // Different time
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reservation.tables.length).toBeGreaterThan(1);
    });

    it('should reject reservation if capacity is exceeded', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          guestName: 'Massive Party',
          guestEmail: 'qa_res_massive@example.com',
          guests: 50, // More than all tables combined
          date: dateStr,
          startTime: '18:00'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('GUEST_LIMIT_EXCEEDED');
    });

    it('should reject double booking at the same exact time for overlapping capacity', async () => {
      // At 18:00, QA_T1 (2) and QA_T2 or T3 (4) are booked.
      // Total remaining capacity at 18:00 is ~ 12 (T3=4, T4=8).
      // Let's try to book 14 guests at 18:00.
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          guestName: 'Overlap Party',
          guestEmail: 'qa_res_overlap@example.com',
          guests: 14,
          date: dateStr,
          startTime: '18:00'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TABLE_UNAVAILABLE');
    });
  });

  describe('Reservation Management', () => {
    let reservationId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          guestName: 'Cancel Me',
          guestEmail: 'qa_res_cancel@example.com',
          guests: 2,
          date: dateStr,
          startTime: '20:00'
        });
      reservationId = res.body.data.reservation._id;
    });

    it('should allow customer to get their own reservations', async () => {
      const res = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.reservations)).toBe(true);
    });

    it('should allow customer to cancel their own reservation', async () => {
      const res = await request(app)
        .put(`/api/reservations/${reservationId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reservation.status).toBe('cancelled');
    });
    
    it('should prevent checking in a cancelled reservation', async () => {
      const res = await request(app)
        .put(`/api/reservations/${reservationId}/check-in`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });
});

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Table = require('../models/Table');
const Settings = require('../models/Settings');

jest.setTimeout(30000);

describe('Phase 3: Admin & Configuration CRUD E2E Tests', () => {
  let adminToken = '';
  let customerToken = '';
  let tableId;

  beforeAll(async () => {
    await connectDB();
    
    // Clean up
    await User.deleteMany({ email: { $regex: 'qa_admin_' } });
    await Table.deleteMany({ number: { $regex: 'QA_A_' } });

    // Create Admin
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'QA Admin User',
      email: 'qa_admin_user@example.com',
      password: 'Password123!',
      role: 'admin'
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'qa_admin_user@example.com',
      password: 'Password123!'
    });
    adminToken = loginRes.body.data.token;

    // Create Customer for RBAC checks
    await request(app).post('/api/auth/register').send({
      name: 'QA Admin Cust',
      email: 'qa_admin_cust@example.com',
      password: 'Password123!',
      role: 'customer'
    });
    const loginCustRes = await request(app).post('/api/auth/login').send({
      email: 'qa_admin_cust@example.com',
      password: 'Password123!'
    });
    customerToken = loginCustRes.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: 'qa_admin_' } });
    await Table.deleteMany({ number: { $regex: 'QA_A_' } });
    await mongoose.connection.close();
  });

  describe('Table CRUD Operations', () => {
    it('should reject table creation by a customer', async () => {
      const res = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ number: 'QA_A_T1', capacity: 2 });
      
      expect(res.statusCode).toBe(403);
    });

    it('should allow admin to create a table', async () => {
      const res = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 'QA_A_T1', capacity: 2 });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.table.number).toBe('QA_A_T1');
      tableId = res.body.data.table._id;
    });

    it('should reject duplicate table numbers', async () => {
      const res = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 'QA_A_T1', capacity: 4 });

      expect(res.statusCode).toBe(400); // Bad Request (Duplicate Key)
      expect(res.body.error.code).toBe('TABLE_NUMBER_EXISTS');
    });

    it('should allow admin to update table capacity', async () => {
      const res = await request(app)
        .put(`/api/tables/${tableId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 'QA_A_T1', capacity: 6 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.table.capacity).toBe(6);
    });

    it('should allow admin to mark table out of service', async () => {
      const res = await request(app)
        .put(`/api/tables/${tableId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 'QA_A_T1', capacity: 6, status: 'maintenance' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.table.status).toBe('maintenance');
    });

    it('should allow admin to delete table', async () => {
      const res = await request(app)
        .delete(`/api/tables/${tableId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      
      const getRes = await request(app)
        .get(`/api/tables/${tableId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(getRes.statusCode).toBe(404);
    });
  });

  describe('Settings CRUD Operations', () => {
    it('should reject settings update by customer', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ maxGuestsPerBooking: 15 });
        
      expect(res.statusCode).toBe(403);
    });

    it('should allow admin to view settings', async () => {
      const res = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.settings).toHaveProperty('maxGuestsPerBooking');
    });

    it('should allow admin to update settings', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maxGuestsPerBooking: 25, averageSpendPerGuest: 50 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.settings.maxGuestsPerBooking).toBe(25);
      expect(res.body.data.settings.averageSpendPerGuest).toBe(50);
    });
  });
});

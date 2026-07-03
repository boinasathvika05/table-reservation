const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

jest.setTimeout(30000); // Increase timeout for Atlas DB connections

describe('Phase 1: Authentication & Security E2E Tests', () => {
  let server;
  
  beforeAll(async () => {
    // Connect to database before running tests
    await connectDB();
  });

  afterAll(async () => {
    // Cleanup test users
    await User.deleteMany({ email: { $regex: 'qa_test_' } });
    await mongoose.connection.close();
  });

  describe('User Registration', () => {
    it('should successfully register a new customer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'QA Test User',
          email: 'qa_test_user1@example.com',
          password: 'Password123!',
          role: 'customer'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe('qa_test_user1@example.com');
      expect(res.body.data.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should prevent duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Test',
          email: 'qa_test_user1@example.com',
          password: 'Password123!',
          role: 'customer'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(['EMAIL_EXISTS', 'DUPLICATE_KEY_ERROR']).toContain(res.body.error.code);
    });

    it('should reject registration with empty fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'qa_test_user2@example.com',
          password: ''
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('User Login & JWT', () => {
    let token = '';

    it('should successfully login and return a JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'qa_test_user1@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('qa_test_user1@example.com');
      
      token = res.body.data.token;
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'qa_test_user1@example.com',
          password: 'WrongPassword!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fetch user profile using JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('qa_test_user1@example.com');
    });

    it('should reject access to protected route without JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Role Protection (RBAC)', () => {
    let customerToken = '';

    beforeAll(async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'qa_test_user1@example.com',
        password: 'Password123!'
      });
      customerToken = res.body.data.token;
    });

    it('should prevent customer from accessing admin routes (e.g. creating tables)', async () => {
      const res = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          tableNumber: 'T999',
          capacity: 4
        });

      // We expect 403 Forbidden
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});

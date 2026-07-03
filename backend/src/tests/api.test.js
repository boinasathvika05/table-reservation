const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Table = require('../models/Table');

// Mock User & Table model methods to prevent database connection requirements during routing checks
jest.mock('../models/User');
jest.mock('../models/Table');

describe('Standard API Routing & Response Envelope Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /health should return 503 and degraded status when disconnected', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({
      status: 'degraded',
      database: 'disconnected'
    });
  });

  test('GET /api/invalid-route should return standardized 404 error', async () => {
    const res = await request(app).get('/api/invalid-route');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested endpoint /api/invalid-route does not exist on this server.'
      }
    });
  });

  test('POST /api/auth/register should fail on validation error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bademail' }); // Missing name and invalid email format

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });
});

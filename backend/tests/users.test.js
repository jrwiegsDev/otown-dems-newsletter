const request = require('supertest');

const User = require('../models/userModel');
jest.mock('../models/userModel');

const app = require('../server');

beforeEach(() => {
  jest.resetAllMocks();
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
});

describe('POST /api/users/login', () => {
  test('rejects login with missing username', async () => {
    const payload = {
      password: 'password123'
    };

    const res = await request(app)
      .post('/api/users/login')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid');
  });

  test('rejects login with missing password', async () => {
    const payload = {
      username: 'testuser'
    };

    const res = await request(app)
      .post('/api/users/login')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid');
  });

  test('rejects login for non-existent user', async () => {
    const payload = {
      username: 'nonexistent',
      password: 'password123'
    };

    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/users/login')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid');
  });
});

const request = require('supertest');

// Mock models to avoid needing a real MongoDB instance
const Subscriber = require('../models/subscriberModel');
jest.mock('../models/subscriberModel');

// Mock nodemailer to prevent real emails
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

// Mock the rate limiter middleware
jest.mock('../middleware/spamProtection', () => {
  const original = jest.requireActual('../middleware/spamProtection');
  return {
    ...original,
    publicFormLimiter: (req, res, next) => next(),
  };
});

const app = require('../server');

beforeEach(() => {
  jest.resetAllMocks();
  process.env.NODE_ENV = 'test';
});

describe('POST /api/subscribers', () => {
  test('creates a new subscriber with valid data', async () => {
    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      formLoadTime: Date.now() - 5000
    };

    Subscriber.findOne.mockResolvedValue(null);
    Subscriber.create.mockResolvedValue({
      _id: 'test-id',
      ...payload,
      email: payload.email.toLowerCase()
    });

    const res = await request(app)
      .post('/api/subscribers')
      .send(payload)
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('subscribed');
    expect(Subscriber.create).toHaveBeenCalledTimes(1);
  });

  test('rejects submission with invalid email', async () => {
    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'not-an-email',
      formLoadTime: Date.now() - 5000
    };

    const res = await request(app)
      .post('/api/subscribers')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('valid email');
    expect(Subscriber.create).not.toHaveBeenCalled();
  });

  test('rejects submission missing first name', async () => {
    const payload = {
      lastName: 'Doe',
      email: 'test@example.com',
      formLoadTime: Date.now() - 5000
    };

    const res = await request(app)
      .post('/api/subscribers')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('first name');
  });

  test('rejects submission missing last name', async () => {
    const payload = {
      firstName: 'Jane',
      email: 'test@example.com',
      formLoadTime: Date.now() - 5000
    };

    const res = await request(app)
      .post('/api/subscribers')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('last name');
  });

  test('updates existing subscriber if email already exists', async () => {
    const payload = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'existing@example.com',
      formLoadTime: Date.now() - 5000
    };

    Subscriber.findOne.mockResolvedValue({
      _id: 'existing-id',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'existing@example.com'
    });

    Subscriber.findOneAndUpdate = jest.fn().mockResolvedValue({
      _id: 'existing-id',
      ...payload,
      email: payload.email.toLowerCase()
    });

    const res = await request(app)
      .post('/api/subscribers')
      .send(payload);

    expect(res.status).toBe(200);
    expect(Subscriber.findOneAndUpdate).toHaveBeenCalled();
  });
});

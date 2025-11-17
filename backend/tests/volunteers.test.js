const request = require('supertest');

const Volunteer = require('../models/volunteerModel');
jest.mock('../models/volunteerModel');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

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

describe('POST /api/volunteers', () => {
  test('creates a new volunteer with valid data', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@example.com',
      interestedPrograms: ['Voter Registration'],
      formLoadTime: Date.now() - 5000
    };

    Volunteer.findOne.mockResolvedValue(null);
    Volunteer.create.mockResolvedValue({
      _id: 'test-id',
      ...payload,
      email: payload.email.toLowerCase()
    });

    const res = await request(app)
      .post('/api/volunteers')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('Community Outreach');
    expect(Volunteer.create).toHaveBeenCalledTimes(1);
  });

  test('rejects submission with invalid email', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'not-valid',
      interestedPrograms: ['Voter Registration'],
      formLoadTime: Date.now() - 5000
    };

    const res = await request(app)
      .post('/api/volunteers')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('valid email');
    expect(Volunteer.create).not.toHaveBeenCalled();
  });

  test('rejects submission missing first name', async () => {
    const payload = {
      lastName: 'Smith',
      email: 'john@example.com',
      interestedPrograms: ['Voter Registration'],
      formLoadTime: Date.now() - 5000
    };

    const res = await request(app)
      .post('/api/volunteers')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('provide a first name');
  });

  test('rejects submission with no interested programs', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@example.com',
      interestedPrograms: [],
      formLoadTime: Date.now() - 5000
    };

    const res = await request(app)
      .post('/api/volunteers')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('at least one program');
  });

  test('updates existing volunteer if email already exists', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'existing@example.com',
      interestedPrograms: ['Voter Registration', 'Phone Banking'],
      formLoadTime: Date.now() - 5000
    };

    Volunteer.findOne.mockResolvedValue({
      _id: 'existing-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'existing@example.com'
    });

    const res = await request(app)
      .post('/api/volunteers')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already signed up');
  });
});

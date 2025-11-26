const request = require('supertest');
const jwt = require('jsonwebtoken');

const PollVote = require('../models/pollVoteModel');
const PollAnalytics = require('../models/pollAnalyticsModel');
const PollConfig = require('../models/pollConfigModel');
const User = require('../models/userModel');

// Helper to get current ISO week identifier dynamically
const getCurrentWeekIdentifier = () => {
  const now = new Date();
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getUTCDay() + 1) / 7);
  return `${now.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
};

jest.mock('../models/pollVoteModel');
jest.mock('../models/pollAnalyticsModel');
jest.mock('../models/pollConfigModel');
jest.mock('../models/userModel');

jest.mock('../middleware/spamProtection', () => {
  const original = jest.requireActual('../middleware/spamProtection');
  return {
    ...original,
    publicFormLimiter: (req, res, next) => next(),
  };
});

// Mock JWT
jest.mock('jsonwebtoken');

// Mock the poll config loading
PollConfig.findOne = jest.fn().mockResolvedValue({
  configName: 'default',
  activeIssues: ['Government Corruption', 'The Economy', 'Climate Change'],
  allValidIssues: ['Government Corruption', 'The Economy', 'Climate Change', 'Crime']
});

const app = require('../server');

beforeEach(() => {
  jest.resetAllMocks();
  process.env.NODE_ENV = 'test';
});

describe('POST /api/poll/vote', () => {
  test('accepts valid poll vote', async () => {
    const payload = {
      email: 'voter@example.com',
      selectedIssues: ['Government Corruption', 'The Economy'],
      formLoadTime: Date.now() - 5000
    };

    PollVote.findOneAndUpdate = jest.fn().mockResolvedValue({
      _id: 'vote-id',
      emailHash: 'hash123',
      selectedIssues: payload.selectedIssues,
      weekIdentifier: '2025-W46',
      votedAt: new Date()
    });

    PollVote.find = jest.fn().mockResolvedValue([
      { selectedIssues: ['Government Corruption', 'The Economy'] },
      { selectedIssues: ['Climate Change'] }
    ]);

    const res = await request(app)
      .post('/api/poll/vote')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('submitted');
    expect(PollVote.findOneAndUpdate).toHaveBeenCalled();
  });

  test('rejects vote with invalid email', async () => {
    const payload = {
      email: 'not-an-email',
      selectedIssues: ['Government Corruption'],
      formLoadTime: Date.now() - 5000
    };

    const res = await request(app)
      .post('/api/poll/vote')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('valid email');
    expect(PollVote.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('rejects vote with no issues selected', async () => {
    const payload = {
      email: 'voter@example.com',
      selectedIssues: [],
      formLoadTime: Date.now() - 5000
    };

    const res = await request(app)
      .post('/api/poll/vote')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('between 1 and 3');
    expect(PollVote.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('rejects vote with too many issues (>3)', async () => {
    const payload = {
      email: 'voter@example.com',
      selectedIssues: ['Government Corruption', 'The Economy', 'Climate Change', 'Crime'],
      formLoadTime: Date.now() - 5000
    };

    const res = await request(app)
      .post('/api/poll/vote')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('between 1 and 3');
    expect(PollVote.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('prevents duplicate vote from same email in same week', async () => {
    const payload = {
      email: 'voter@example.com',
      selectedIssues: ['Government Corruption'],
      formLoadTime: Date.now() - 5000
    };

    PollVote.findOneAndUpdate = jest.fn().mockResolvedValue({
      _id: 'existing-vote',
      emailHash: 'hash123',
      selectedIssues: payload.selectedIssues,
      weekIdentifier: '2025-W46',
      votedAt: new Date()
    });

    PollVote.find = jest.fn().mockResolvedValue([
      { selectedIssues: ['Government Corruption'] }
    ]);

    const res = await request(app)
      .post('/api/poll/vote')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('submitted');
    expect(PollVote.findOneAndUpdate).toHaveBeenCalled();
  });
});

describe('POST /api/poll/reset-week (Emergency Reset)', () => {
  let authToken;

  beforeEach(() => {
    // Mock authenticated user token
    authToken = 'mock-jwt-token';
    
    // Mock JWT verification
    jwt.verify = jest.fn().mockReturnValue({ id: 'user123' });
    
    // Mock User.findById to return an object with select method
    const mockUser = {
      _id: 'user123',
      email: 'admin@example.com',
      role: 'superadmin'
    };
    
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
  });

  test('archives current week votes and resets poll', async () => {
    const currentWeek = getCurrentWeekIdentifier();
    const mockVotes = [
      {
        _id: 'vote1',
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption', 'The Economy'],
        weekIdentifier: currentWeek,
        votedAt: new Date()
      },
      {
        _id: 'vote2',
        emailHash: 'hash2',
        selectedIssues: ['Climate Change', 'The Economy'],
        weekIdentifier: currentWeek,
        votedAt: new Date()
      },
      {
        _id: 'vote3',
        emailHash: 'hash3',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: currentWeek,
        votedAt: new Date()
      }
    ];

    PollVote.find = jest.fn().mockResolvedValue(mockVotes);
    PollAnalytics.findOne = jest.fn().mockResolvedValue(null);
    PollAnalytics.create = jest.fn().mockResolvedValue({
      weekIdentifier: currentWeek,
      totalVotes: 3,
      issueCounts: {
        'Government Corruption': 2,
        'The Economy': 2,
        'Climate Change': 1
      }
    });
    PollVote.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 3 });

    const res = await request(app)
      .post('/api/poll/reset-week')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.votesDeleted).toBe(3);
    expect(res.body.archived).toBe(true);
    expect(PollAnalytics.create).toHaveBeenCalled();
    expect(PollVote.deleteMany).toHaveBeenCalledWith({ weekIdentifier: currentWeek });
  });

  test('updates existing analytics if week already archived', async () => {
    const currentWeek = getCurrentWeekIdentifier();
    const mockVotes = [
      {
        _id: 'vote1',
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: currentWeek,
        votedAt: new Date()
      }
    ];

    const existingAnalytics = {
      weekIdentifier: currentWeek,
      totalVotes: 2,
      issueCounts: { 'Government Corruption': 1, 'Climate Change': 1 },
      weekEnding: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    PollVote.find = jest.fn().mockResolvedValue(mockVotes);
    PollAnalytics.findOne = jest.fn().mockResolvedValue(existingAnalytics);
    PollVote.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });

    const res = await request(app)
      .post('/api/poll/reset-week')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.archived).toBe(true);
    expect(existingAnalytics.save).toHaveBeenCalled();
    expect(existingAnalytics.totalVotes).toBe(1); // Updated to current count
  });

  test('handles reset with no votes gracefully', async () => {
    PollVote.find = jest.fn().mockResolvedValue([]);
    PollVote.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });

    const res = await request(app)
      .post('/api/poll/reset-week')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.votesDeleted).toBe(0);
    expect(res.body.archived).toBe(false);
    expect(PollAnalytics.create).not.toHaveBeenCalled();
  });

  test('calculates correct weekEnding date for archived week', async () => {
    const mockVotes = [
      {
        _id: 'vote1',
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: '2025-W46',
        votedAt: new Date()
      }
    ];

    PollVote.find = jest.fn().mockResolvedValue(mockVotes);
    PollAnalytics.findOne = jest.fn().mockResolvedValue(null);
    
    let capturedAnalyticsData = null;
    PollAnalytics.create = jest.fn().mockImplementation((data) => {
      capturedAnalyticsData = data;
      return Promise.resolve(data);
    });
    
    PollVote.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });

    const res = await request(app)
      .post('/api/poll/reset-week')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(capturedAnalyticsData).toBeTruthy();
    
    // Verify weekEnding is calculated correctly for the week identifier
    const weekEnding = new Date(capturedAnalyticsData.weekEnding);
    expect(weekEnding.getHours()).toBe(23);
    expect(weekEnding.getMinutes()).toBe(59);
    expect(weekEnding.getSeconds()).toBe(59);
  });

  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/poll/reset-week')
      .send();

    expect(res.status).toBe(401);
  });
});

describe('GET /api/poll/analytics', () => {
  test('returns historical analytics data', async () => {
    const mockAnalytics = [
      {
        weekIdentifier: '2025-W46',
        weekEnding: new Date('2025-11-16'),
        totalVotes: 12,
        issueCounts: {
          'Government Corruption': 9,
          'The Economy': 3
        }
      },
      {
        weekIdentifier: '2025-W45',
        weekEnding: new Date('2025-11-09'),
        totalVotes: 8,
        issueCounts: {
          'Climate Change': 5,
          'The Economy': 3
        }
      }
    ];

    PollAnalytics.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(mockAnalytics)
      })
    });

    const res = await request(app)
      .get('/api/poll/analytics');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].weekIdentifier).toBe('2025-W46');
  });

  test('limits results to 52 weeks', async () => {
    PollAnalytics.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([])
      })
    });

    await request(app).get('/api/poll/analytics');

    expect(PollAnalytics.find().sort().limit).toHaveBeenCalledWith(52);
  });
});

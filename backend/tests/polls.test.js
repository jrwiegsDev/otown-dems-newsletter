const request = require('supertest');

const PollVote = require('../models/pollVoteModel');
const PollAnalytics = require('../models/pollAnalyticsModel');
const PollConfig = require('../models/pollConfigModel');

jest.mock('../models/pollVoteModel');
jest.mock('../models/pollAnalyticsModel');
jest.mock('../models/pollConfigModel');

jest.mock('../middleware/spamProtection', () => {
  const original = jest.requireActual('../middleware/spamProtection');
  return {
    ...original,
    publicFormLimiter: (req, res, next) => next(),
  };
});

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

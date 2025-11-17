const PollVote = require('../models/pollVoteModel');
const PollAnalytics = require('../models/pollAnalyticsModel');

jest.mock('../models/pollVoteModel');
jest.mock('../models/pollAnalyticsModel');

// We need to mock the scheduler module without starting cron
let archiveAndResetPoll;

beforeAll(() => {
  // Mock the cron.schedule to prevent actual scheduling
  jest.mock('node-cron', () => ({
    schedule: jest.fn()
  }));
  
  // Import after mocking
  const scheduler = require('../utils/pollScheduler');
  archiveAndResetPoll = scheduler.archiveAndResetPoll;
});

beforeEach(() => {
  jest.clearAllMocks();
  console.log = jest.fn(); // Suppress console logs in tests
  console.error = jest.fn();
});

describe('Poll Scheduler - archiveAndResetPoll', () => {
  test('archives votes from previous weeks and keeps current week active', async () => {
    // Mock current time to be Monday, Nov 17, 2025 at 00:30 CST (06:30 UTC)
    const realDate = Date;
    const mockDate = new Date('2025-11-17T06:30:00.000Z');
    
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return mockDate;
        }
        return new realDate(...args);
      }
      
      static now() {
        return mockDate.getTime();
      }
    };
    
    // Also mock Date methods needed for timezone conversion
    global.Date.prototype.toLocaleString = function(...args) {
      return mockDate.toLocaleString(...args);
    };

    const mockVotes = [
      // Week 46 votes (should be archived)
      {
        _id: 'vote1',
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption', 'The Economy'],
        weekIdentifier: '2025-W46',
        votedAt: new Date('2025-11-15')
      },
      {
        _id: 'vote2',
        emailHash: 'hash2',
        selectedIssues: ['Climate Change'],
        weekIdentifier: '2025-W46',
        votedAt: new Date('2025-11-16')
      },
      // Week 47 votes (current week, should NOT be archived)
      {
        _id: 'vote3',
        emailHash: 'hash3',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: '2025-W47',
        votedAt: new Date('2025-11-17')
      }
    ];

    PollVote.find = jest.fn().mockResolvedValue(mockVotes);
    PollAnalytics.findOne = jest.fn().mockResolvedValue(null);
    PollAnalytics.create = jest.fn().mockResolvedValue({});
    PollVote.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 2 });

    await archiveAndResetPoll();

    // Should create analytics for Week 46
    expect(PollAnalytics.create).toHaveBeenCalledWith(
      expect.objectContaining({
        weekIdentifier: '2025-W46',
        totalVotes: 2,
        issueCounts: expect.objectContaining({
          'Government Corruption': 1,
          'The Economy': 1,
          'Climate Change': 1
        })
      })
    );

    // Should delete only Week 46 votes
    expect(PollVote.deleteMany).toHaveBeenCalledWith({ weekIdentifier: '2025-W46' });

    global.Date = realDate;
  });

  test('archives multiple weeks if system was down', async () => {
    // Mock current time to be Monday, Dec 1, 2025 (Week 49)
    const mockNow = new Date('2025-12-01T00:30:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

    const mockVotes = [
      // Week 46 votes
      {
        _id: 'vote1',
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: '2025-W46',
        votedAt: new Date('2025-11-15')
      },
      // Week 47 votes
      {
        _id: 'vote2',
        emailHash: 'hash2',
        selectedIssues: ['Climate Change'],
        weekIdentifier: '2025-W47',
        votedAt: new Date('2025-11-20')
      },
      // Week 48 votes
      {
        _id: 'vote3',
        emailHash: 'hash3',
        selectedIssues: ['The Economy'],
        weekIdentifier: '2025-W48',
        votedAt: new Date('2025-11-27')
      },
      // Week 49 votes (current, should not be archived)
      {
        _id: 'vote4',
        emailHash: 'hash4',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: '2025-W49',
        votedAt: new Date('2025-12-01')
      }
    ];

    PollVote.find = jest.fn().mockResolvedValue(mockVotes);
    PollAnalytics.findOne = jest.fn().mockResolvedValue(null);
    PollAnalytics.create = jest.fn().mockResolvedValue({});
    PollVote.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });

    await archiveAndResetPoll();

    // Should create analytics for Weeks 46, 47, and 48 (but not 49)
    expect(PollAnalytics.create).toHaveBeenCalledTimes(3);
    expect(PollVote.deleteMany).toHaveBeenCalledTimes(3);
    expect(PollVote.deleteMany).toHaveBeenCalledWith({ weekIdentifier: '2025-W46' });
    expect(PollVote.deleteMany).toHaveBeenCalledWith({ weekIdentifier: '2025-W47' });
    expect(PollVote.deleteMany).toHaveBeenCalledWith({ weekIdentifier: '2025-W48' });

    jest.restoreAllMocks();
  });

  test('updates existing analytics instead of creating duplicates', async () => {
    const mockNow = new Date('2025-11-17T00:30:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

    const mockVotes = [
      {
        _id: 'vote1',
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: '2025-W46',
        votedAt: new Date('2025-11-15')
      }
    ];

    const existingAnalytics = {
      weekIdentifier: '2025-W46',
      totalVotes: 5, // Old value
      issueCounts: { 'Climate Change': 5 },
      archivedAt: new Date('2025-11-16'),
      save: jest.fn().mockResolvedValue(true)
    };

    PollVote.find = jest.fn().mockResolvedValue(mockVotes);
    PollAnalytics.findOne = jest.fn().mockResolvedValue(existingAnalytics);
    PollVote.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });

    await archiveAndResetPoll();

    // Should update existing record, not create new one
    expect(PollAnalytics.create).not.toHaveBeenCalled();
    expect(existingAnalytics.save).toHaveBeenCalled();
    expect(existingAnalytics.totalVotes).toBe(1); // Updated to new count
    expect(existingAnalytics.issueCounts).toMatchObject({
      'Government Corruption': 1
    });

    jest.restoreAllMocks();
  });

  test('calculates correct weekEnding date for archived weeks', async () => {
    const mockNow = new Date('2025-11-17T00:30:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

    const mockVotes = [
      {
        _id: 'vote1',
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: '2025-W46',
        votedAt: new Date('2025-11-15')
      }
    ];

    let capturedAnalyticsData = null;
    PollVote.find = jest.fn().mockResolvedValue(mockVotes);
    PollAnalytics.findOne = jest.fn().mockResolvedValue(null);
    PollAnalytics.create = jest.fn().mockImplementation((data) => {
      capturedAnalyticsData = data;
      return Promise.resolve(data);
    });
    PollVote.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });

    await archiveAndResetPoll();

    expect(capturedAnalyticsData).toBeTruthy();
    expect(capturedAnalyticsData.weekIdentifier).toBe('2025-W46');
    
    // Week 46 should end on Sunday, November 16, 2025 at 23:59:59
    const weekEnding = new Date(capturedAnalyticsData.weekEnding);
    expect(weekEnding.getHours()).toBe(23);
    expect(weekEnding.getMinutes()).toBe(59);
    expect(weekEnding.getSeconds()).toBe(59);

    jest.restoreAllMocks();
  });

  test('handles empty database gracefully', async () => {
    const mockNow = new Date('2025-11-17T00:30:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

    PollVote.find = jest.fn().mockResolvedValue([]);

    await archiveAndResetPoll();

    expect(PollAnalytics.create).not.toHaveBeenCalled();
    expect(PollVote.deleteMany).not.toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  test('only runs on Sunday night or Monday morning', async () => {
    // Test Wednesday afternoon (should skip)
    const wednesdayNoon = new Date('2025-11-12T18:00:00.000Z'); // Wednesday, 12:00 PM CST
    jest.spyOn(global, 'Date').mockImplementation(() => wednesdayNoon);

    PollVote.find = jest.fn().mockResolvedValue([
      {
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: '2025-W45',
        votedAt: new Date('2025-11-10')
      }
    ]);

    await archiveAndResetPoll();

    // Should not archive on Wednesday
    expect(PollAnalytics.create).not.toHaveBeenCalled();
    expect(PollVote.deleteMany).not.toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  test('preserves all historical issues in issueCounts even if count is 0', async () => {
    const mockNow = new Date('2025-11-17T00:30:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

    const mockVotes = [
      {
        _id: 'vote1',
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption'], // Only one issue voted on
        weekIdentifier: '2025-W46',
        votedAt: new Date('2025-11-15')
      }
    ];

    let capturedAnalyticsData = null;
    PollVote.find = jest.fn().mockResolvedValue(mockVotes);
    PollAnalytics.findOne = jest.fn().mockResolvedValue(null);
    PollAnalytics.create = jest.fn().mockImplementation((data) => {
      capturedAnalyticsData = data;
      return Promise.resolve(data);
    });
    PollVote.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });

    await archiveAndResetPoll();

    // All VALID_ISSUES should be in issueCounts, even with 0 votes
    expect(capturedAnalyticsData.issueCounts).toHaveProperty('Government Corruption', 1);
    expect(capturedAnalyticsData.issueCounts).toHaveProperty('Climate Change', 0);
    expect(capturedAnalyticsData.issueCounts).toHaveProperty('The Economy', 0);
    expect(capturedAnalyticsData.issueCounts).toHaveProperty('State of US Democracy', 0);

    jest.restoreAllMocks();
  });
});

describe('Poll Scheduler - Safety Checks', () => {
  test('prevents reset during business hours on weekdays', async () => {
    // Test Tuesday at 2 PM
    const tuesdayAfternoon = new Date('2025-11-11T20:00:00.000Z'); // Tuesday 2 PM CST
    jest.spyOn(global, 'Date').mockImplementation(() => tuesdayAfternoon);

    PollVote.find = jest.fn().mockResolvedValue([
      {
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: '2025-W45',
        votedAt: new Date()
      }
    ]);

    await archiveAndResetPoll();

    expect(PollAnalytics.create).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('⚠️  Reset attempted at wrong time'));

    jest.restoreAllMocks();
  });

  test('allows reset on Sunday at 23:00', async () => {
    // Sunday Nov 16, 2025 at 23:30 CST
    const sundayNight = new Date('2025-11-17T05:30:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => sundayNight);

    PollVote.find = jest.fn().mockResolvedValue([
      {
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: '2025-W46',
        votedAt: new Date('2025-11-15')
      }
    ]);

    PollAnalytics.findOne = jest.fn().mockResolvedValue(null);
    PollAnalytics.create = jest.fn().mockResolvedValue({});
    PollVote.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });

    await archiveAndResetPoll();

    expect(PollAnalytics.create).toHaveBeenCalled();
    expect(PollVote.deleteMany).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  test('allows reset on Monday at 00:30', async () => {
    // Monday Nov 17, 2025 at 00:30 CST
    const mondayMorning = new Date('2025-11-17T06:30:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mondayMorning);

    PollVote.find = jest.fn().mockResolvedValue([
      {
        emailHash: 'hash1',
        selectedIssues: ['Government Corruption'],
        weekIdentifier: '2025-W46',
        votedAt: new Date('2025-11-15')
      }
    ]);

    PollAnalytics.findOne = jest.fn().mockResolvedValue(null);
    PollAnalytics.create = jest.fn().mockResolvedValue({});
    PollVote.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });

    await archiveAndResetPoll();

    expect(PollAnalytics.create).toHaveBeenCalled();
    expect(PollVote.deleteMany).toHaveBeenCalled();

    jest.restoreAllMocks();
  });
});

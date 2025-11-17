# Testing Documentation

## Overview

This backend has comprehensive automated testing to ensure all API endpoints work correctly and are protected against spam/malicious input.

**Total Tests: 27**  
**Test Framework: Jest + Supertest**  
**Execution Time: ~0.8 seconds**

## Why We Test

1. **Prevent Bugs** - Catch issues before users do
2. **Safe Refactoring** - Change code confidently
3. **Documentation** - Tests show how APIs should behave
4. **Regression Prevention** - Ensure old bugs don't return

## Test Philosophy

### Isolation
Each test runs in isolation with **mocked dependencies**:
- **No real emails** - nodemailer is mocked
- **No real database** - Mongoose models return fake data
- **No rate limiting** - Middleware bypassed for testing
- **No external APIs** - All network calls mocked

### Fast Feedback
- All 27 tests complete in < 1 second
- Run automatically on every code push (CI/CD)
- Can run locally before committing code

## Test Structure

### Test Files
```
backend/tests/
├── subscribers.test.js    # Newsletter subscription tests (5)
├── volunteers.test.js     # Volunteer signup tests (5)
├── polls.test.js          # Poll voting tests (5)
├── users.test.js          # Authentication tests (3)
└── spamProtection.test.js # Security middleware tests (9)
```

### Anatomy of a Test

```javascript
test('creates a new subscriber with valid data', async () => {
  // 1. ARRANGE: Set up test data
  const payload = {
    firstName: 'Jane',
    email: 'jane@example.com',
    zipCode: '12345'
  };

  // Mock database response
  Subscriber.findOne.mockResolvedValue(null);
  Subscriber.create.mockResolvedValue({ _id: 'abc123', ...payload });

  // 2. ACT: Make API request
  const res = await request(app)
    .post('/api/newsletter/subscribe')
    .send(payload);

  // 3. ASSERT: Check results
  expect(res.status).toBe(201);
  expect(res.body.message).toContain('subscribed');
  expect(Subscriber.create).toHaveBeenCalledTimes(1);
});
```

**AAA Pattern:**
- **Arrange** - Set up test data and mocks
- **Act** - Execute the code being tested
- **Assert** - Verify the outcome

## Mocking Strategy

### Why Mock?
Without mocks, tests would:
- Send real emails (spamming inboxes)
- Write to production database
- Be slow (network/DB latency)
- Require external services to be running

### What We Mock

#### 1. Nodemailer (Email)
```javascript
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
  })
}));
```
✅ **Result:** No emails sent during tests

#### 2. Mongoose Models (Database)
```javascript
jest.mock('../models/subscriberModel');

Subscriber.findOne.mockResolvedValue(null);  // No existing record
Subscriber.create.mockResolvedValue({ ... }); // Fake save
```
✅ **Result:** No database operations

#### 3. Rate Limiter (Spam Protection)
```javascript
jest.mock('../middleware/spamProtection', () => ({
  ...original,
  publicFormLimiter: (req, res, next) => next(), // Bypass
}));
```
✅ **Result:** No rate limit delays

## Test Categories

### 1. Happy Path Tests
Verify features work correctly with valid input.

**Example:**
```javascript
test('creates a new subscriber with valid data', ...)
```

### 2. Validation Tests
Ensure bad input is rejected properly.

**Examples:**
```javascript
test('rejects submission with invalid email', ...)
test('rejects submission missing required fields', ...)
```

### 3. Security Tests
Confirm spam protection and sanitization work.

**Examples:**
```javascript
test('removes XSS attempts from input', ...)
test('rejects honeypot field submissions', ...)
```

### 4. Edge Case Tests
Handle unusual but valid scenarios.

**Examples:**
```javascript
test('prevents duplicate signups', ...)
test('allows vote updates within same week', ...)
```

## Running Tests

### Locally
```bash
# All tests
npm test

# Specific file
npm test -- tests/subscribers.test.js

# Watch mode (re-runs on changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

### In CI/CD
Tests run automatically via GitHub Actions:
- On every push to `main` or `develop`
- On every pull request
- Tests Node.js 18.x and 20.x

**Workflow:** `.github/workflows/test.yml`

## Understanding Test Output

### Success (All Pass)
```
 PASS  tests/subscribers.test.js
 PASS  tests/volunteers.test.js
 PASS  tests/polls.test.js
 PASS  tests/users.test.js
 PASS  tests/spamProtection.test.js

Test Suites: 5 passed, 5 total
Tests:       27 passed, 27 total
Time:        0.757 s
```

### Failure
```
 FAIL  tests/subscribers.test.js
  ● POST /api/newsletter/subscribe › creates a new subscriber

    expect(received).toBe(expected)

    Expected: 201
    Received: 400

      at Object.toBe (tests/subscribers.test.js:45:24)
```

**Debugging:**
1. Check the line number (`:45`)
2. Look at what was expected vs. received
3. Review recent code changes to that route
4. Check if mocks are set up correctly

### Warnings (Can Ignore)
```
Cannot log after tests are done...
❌ Error loading poll configuration: MongooseError...
```
These happen **after** tests complete and don't affect results. Caused by background operations trying to connect to DB after Jest shuts down.

## Best Practices

### ✅ Do
- Run tests before committing code
- Add tests for new features
- Keep tests simple and readable
- Mock all external dependencies
- Use descriptive test names

### ❌ Don't
- Skip tests because they're slow (they're fast!)
- Commit failing tests
- Share test environment vars with production
- Test implementation details (test behavior, not code)
- Make tests depend on each other (isolation!)

## Test Coverage Goals

Currently testing:
- ✅ All public API endpoints
- ✅ Input validation
- ✅ Spam protection middleware
- ✅ Error handling

Not currently testing:
- ⬜ Protected admin routes (requires auth setup)
- ⬜ Database model logic (tested implicitly)
- ⬜ WebSocket functionality (polls broadcast)

## Troubleshooting

### Problem: Tests sending real emails
**Solution:** Check nodemailer mock is at top of test file before `require('../server')`

### Problem: Rate limit errors (429)
**Solution:** Ensure `publicFormLimiter` is mocked in test setup

### Problem: Tests timeout
**Solution:** Check for unmocked async operations. Use `--detectOpenHandles` flag.

### Problem: Random failures
**Solution:** Tests may depend on each other. Ensure proper `beforeEach()` cleanup.

## Further Reading

- **Quick Start:** `TESTING_QUICKSTART.md` - How to run tests
- **Test Descriptions:** `WHAT_EACH_TEST_DOES.md` - What each test verifies
- **Implementation Summary:** `TEST_IMPLEMENTATION_SUMMARY.md` - Technical details

## Questions?

Common questions answered in `TESTING_QUICKSTART.md`. For deeper dive into testing philosophy, see this guide.

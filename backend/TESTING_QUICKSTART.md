# Testing Quick Start Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run a specific test file
npm test -- tests/subscribers.test.js

# Run tests with coverage report
npm run test:coverage
```

## What Gets Tested?

### ✅ No Real Data is Affected
- **No real emails sent** - nodemailer is mocked in all tests
- **No real database operations** - Mongoose models are mocked
- **No rate limiting** - express-rate-limit is bypassed in tests
- **Fast execution** - All 27 tests run in < 1 second

### Test Coverage (27 tests)

1. **Subscriber Signups** (5 tests)
   - Valid subscriber creation
   - Email validation
   - Required field checks
   - Spam protection validation

2. **Volunteer Signups** (5 tests)
   - Valid volunteer creation
   - Email/name validation
   - Program selection validation
   - Duplicate prevention

3. **Poll Voting** (5 tests)
   - Valid vote submission
   - Email validation
   - Issue selection (1-3 issues)
   - Duplicate vote handling (allows updates)

4. **User Authentication** (3 tests)
   - Login validation
   - Missing credentials
   - Non-existent users

5. **Spam Protection** (9 tests)
   - Input sanitization
   - XSS prevention
   - Honeypot validation
   - Timing validation
   - Special character handling

## Understanding Test Output

### ✅ Passing Test
```
 PASS  tests/subscribers.test.js
  POST /api/newsletter/subscribe
    ✓ creates a new subscriber with valid data (45ms)
```

### ❌ Failing Test
```
 FAIL  tests/subscribers.test.js
  POST /api/newsletter/subscribe
    ✕ creates a new subscriber with valid data (52ms)
    
    expect(received).toBe(expected)
    Expected: 201
    Received: 400
```

### Warnings You Can Ignore
```
Cannot log after tests are done. Did you forget to wait for something async?
❌ Error loading poll configuration: MongooseError...
```
These warnings appear **after** all tests pass and don't affect test results. They're caused by background DB connection attempts that timeout in the test environment.

## Continuous Integration (CI)

Tests run automatically on:
- Every push to `main` or `develop` branches
- Every pull request to `main` or `develop`
- Tests run on Node.js 18.x and 20.x

Check CI status: `.github/workflows/test.yml`

## Common Issues

### Tests Hang or Timeout
- Usually caused by unmocked async operations
- Check that all external dependencies are mocked
- Use `--detectOpenHandles` flag to debug

### Rate Limit Errors (429)
- Make sure `publicFormLimiter` is mocked in test file
- Check middleware mock in test setup

### Email Spam During Tests
- Verify `nodemailer` mock is at top of test file
- Should see `jest.mock('nodemailer', () => ({...}))`

## Need Help?
See `TESTING.md` for detailed explanations or `WHAT_EACH_TEST_DOES.md` for test descriptions.

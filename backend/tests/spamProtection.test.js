const { sanitizeInput } = require('../middleware/spamProtection');

describe('sanitizeInput utility function', () => {
  test('removes script tags from input', () => {
    const malicious = '<script>alert("XSS")</script>Hello';
    const result = sanitizeInput(malicious);
    expect(result).toBe('Hello');
    expect(result).not.toContain('<script>');
  });

  test('removes iframe tags from input', () => {
    const malicious = '<iframe src="evil.com"></iframe>Safe text';
    const result = sanitizeInput(malicious);
    expect(result).toBe('Safe text');
    expect(result).not.toContain('<iframe>');
  });

  test('removes javascript: protocol from input', () => {
    const malicious = 'javascript:alert("XSS")';
    const result = sanitizeInput(malicious);
    expect(result).not.toContain('javascript:');
  });

  test('removes event handlers from input', () => {
    const malicious = '<div onclick="alert()">Click me</div>';
    const result = sanitizeInput(malicious);
    expect(result).not.toContain('onclick=');
  });

  test('trims whitespace from input', () => {
    const input = '  Hello World  ';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello World');
  });

  test('returns non-string input unchanged', () => {
    expect(sanitizeInput(123)).toBe(123);
    expect(sanitizeInput(null)).toBe(null);
    expect(sanitizeInput(undefined)).toBe(undefined);
    expect(sanitizeInput({ key: 'value' })).toEqual({ key: 'value' });
  });

  test('handles normal text without modification', () => {
    const normal = 'Jane Doe from O\'Fallon, IL';
    const result = sanitizeInput(normal);
    expect(result).toBe('Jane Doe from O\'Fallon, IL');
  });

  test('handles email addresses correctly', () => {
    const email = 'test@example.com';
    const result = sanitizeInput(email);
    expect(result).toBe('test@example.com');
  });

  test('handles multiple attack vectors at once', () => {
    const malicious = '<script>alert(1)</script><iframe src="x"></iframe>javascript:void(0) onclick="bad()"Normal text';
    const result = sanitizeInput(malicious);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('<iframe>');
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('onclick=');
    expect(result).toContain('Normal text');
  });
});

const rateLimit = require('express-rate-limit');

// Enhanced security logging function
const logSecurityEvent = (eventType, details, req) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  
  console.warn(`
═══════════════════════════════════════════════════════════
🚨 SECURITY EVENT: ${eventType}
Time: ${timestamp}
IP: ${ip}
User-Agent: ${userAgent}
Details: ${JSON.stringify(details, null, 2)}
═══════════════════════════════════════════════════════════
  `);
};

// Rate limiter for public form submissions (subscriber signup, volunteer signup, poll voting)
const publicFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Limit each IP to 5 requests per hour (slightly more permissive for poll voting)
  message: {
    message: 'Too many submissions from this IP address. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      endpoint: req.originalUrl,
      method: req.method,
      body: req.body
    }, req);
    
    res.status(429).json({
      message: 'Too many submissions from this IP address. Please try again later.',
    });
  },
});

// Honeypot validation middleware
const validateHoneypot = (req, res, next) => {
  if (req.body.website || req.body.url || req.body.honeypot) {
    logSecurityEvent('HONEYPOT_TRIGGERED', {
      honeypotFields: {
        website: req.body.website,
        url: req.body.url,
        honeypot: req.body.honeypot
      },
      formData: req.body
    }, req);
    
    return res.status(200).json({ 
      message: 'Thank you for your submission!' 
    });
  }
  next();
};

// Submission timing validation (prevents instant bot submissions)
const validateSubmissionTiming = (req, res, next) => {
  const { formLoadTime } = req.body;
  
  if (!formLoadTime) {
    console.warn(`No form timing data from IP: ${req.ip}`);
    return next();
  }

  const submissionTime = Date.now();
  const timeDifference = submissionTime - parseInt(formLoadTime);
  
  if (timeDifference < 2000) {
    logSecurityEvent('SUSPICIOUS_FAST_SUBMISSION', {
      timeDifference: `${timeDifference}ms`,
      threshold: '2000ms',
      formData: req.body
    }, req);
    
    return res.status(400).json({ 
      message: 'Please take your time filling out the form.' 
    });
  }

  next();
};

// Input sanitization helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Sanitize request body
const sanitizeRequestBody = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }
  next();
};

module.exports = {
  publicFormLimiter,
  validateHoneypot,
  validateSubmissionTiming,
  sanitizeRequestBody,
  sanitizeInput,
  logSecurityEvent,
};

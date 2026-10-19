import rateLimit from 'express-rate-limit';

// Rate limiter for authentication endpoints (brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts from this IP, please try again after 15 minutes' },
});

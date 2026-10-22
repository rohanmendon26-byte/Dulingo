import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getCookieOptions,
  REFRESH_COOKIE_NAME,
  requireAuth,
} from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { publicUser } from '../services/gameService.js';
import { ensureDemoAccount } from '../services/seedService.js';
import { wrap } from '../utils/asyncWrap.js';

const router = express.Router();

// Helper to set refresh token cookie & return payload
function sendAuthResponse(res, user, statusCode = 200) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions());

  return res.status(statusCode).json({
    token: accessToken,
    refreshToken,
    user: publicUser(user),
  });
}

router.post(
  '/auth/register',
  authLimiter,
  validate(registerSchema),
  wrap(async (req, res) => {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'This email is already registered' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      role: role === 'teacher' ? 'teacher' : 'student',
    });

    return sendAuthResponse(res, user, 201);
  })
);

router.post(
  '/auth/login',
  authLimiter,
  validate(loginSchema),
  wrap(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    const isDemoAccount = [
      'teacher@dulingo.in',
      'ramesh@dulingo.in',
      'sunita@dulingo.in',
      'anil@dulingo.in',
      'meena@dulingo.in',
      'kiran@dulingo.in',
      'learner@dulingo.in',
      'student@dulingo.in',
    ].includes(normalizedEmail);

    // If demo account doesn't exist or password mismatch with demo1234, auto-provision or auto-heal it
    if (isDemoAccount) {
      if (!user || !(await bcrypt.compare(password, user.passwordHash).catch(() => false))) {
        if (password === 'demo1234' || !user) {
          user = await ensureDemoAccount(
            normalizedEmail,
            normalizedEmail.includes('teacher') ? 'teacher' : 'student'
          );
        }
      }
    }

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Wrong email or password' });
    }

    return sendAuthResponse(res, user, 200);
  })
);

router.post(
  '/auth/demo-login',
  wrap(async (req, res) => {
    const rawRole = req.body?.role || '';
    const rawEmail = String(req.body?.email || '').trim().toLowerCase();
    const isTeacher = rawRole === 'teacher' || rawEmail.includes('teacher');
    const email = isTeacher ? 'teacher@dulingo.in' : 'ramesh@dulingo.in';
    const role = isTeacher ? 'teacher' : 'student';

    const user = await ensureDemoAccount(email, role);
    return sendAuthResponse(res, user, 200);
  })
);

router.post(
  '/auth/refresh',
  wrap(async (req, res) => {
    const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
    const tokenFromBody = req.body?.refreshToken;
    const tokenFromHeader = req.headers['x-refresh-token'];
    const refreshToken = tokenFromCookie || tokenFromBody || tokenFromHeader;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided', code: 'REFRESH_MISSING' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Refresh token expired or invalid', code: 'REFRESH_INVALID' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Account not found', code: 'ACCOUNT_NOT_FOUND' });
    }

    // Check tokenVersion for session revocation
    if ((user.tokenVersion || 0) !== (decoded.version || 0)) {
      return res.status(401).json({ error: 'Session was revoked, please log in again', code: 'SESSION_REVOKED' });
    }

    // Issue refreshed access token + rotated refresh token
    return sendAuthResponse(res, user, 200);
  })
);

router.post('/auth/logout', async (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getCookieOptions(),
    maxAge: 0,
  });

  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.id) {
        await User.findByIdAndUpdate(decoded.id, { $inc: { tokenVersion: 1 } });
      }
    }
  } catch {}

  res.json({ ok: true, message: 'Logged out successfully' });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;

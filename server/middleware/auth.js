import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me';
const refreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret-change-me';

export const REFRESH_COOKIE_NAME = 'dulingo_refresh_token';

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

export const signAccessToken = (user) =>
  jwt.sign({ id: user._id }, secret(), { expiresIn: '15m' });

export const signRefreshToken = (user) =>
  jwt.sign({ id: user._id, version: user.tokenVersion || 0 }, refreshSecret(), {
    expiresIn: '7d',
  });

// Backward-compatibility alias
export const sign = signAccessToken;

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, refreshSecret());
  } catch {
    return null;
  }
};

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Please log in', code: 'UNAUTHORIZED' });

    const { id } = jwt.verify(token, secret());
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ error: 'Account not found', code: 'ACCOUNT_NOT_FOUND' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired, please refresh token', code: 'TOKEN_EXPIRED' });
    }
    res.status(401).json({ error: 'Session expired, please log in again', code: 'INVALID_TOKEN' });
  }
}

export const requireRole = (role) => (req, res, next) =>
  req.user.role === role ? next() : res.status(403).json({ error: `Only ${role}s can do this` });

import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

export const sign = (user) => jwt.sign({ id: user._id }, secret(), { expiresIn: '14d' });

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Please log in' });
    const { id } = jwt.verify(token, secret());
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ error: 'Account not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

export const requireRole = (role) => (req, res, next) =>
  req.user.role === role ? next() : res.status(403).json({ error: `Only ${role}s can do this` });

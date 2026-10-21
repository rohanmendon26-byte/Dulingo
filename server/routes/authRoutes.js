import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { sign, requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { publicUser } from '../services/gameService.js';
import { wrap } from '../utils/asyncWrap.js';

const router = express.Router();

router.post('/auth/register', authLimiter, wrap(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Name, email and a password of 6+ characters are required' });
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ error: 'This email is already registered' });
  const user = await User.create({
    name, email, passwordHash: await bcrypt.hash(password, 10),
    role: role === 'teacher' ? 'teacher' : 'student',
  });
  res.json({ token: sign(user), user: publicUser(user) });
}));

router.post('/auth/login', authLimiter, wrap(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash)))
    return res.status(401).json({ error: 'Wrong email or password' });
  res.json({ token: sign(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;

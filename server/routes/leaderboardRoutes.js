import express from 'express';
import { User, XpLog } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../utils/asyncWrap.js';

const router = express.Router();

router.get('/leaderboard', requireAuth, wrap(async (req, res) => {
  const period = req.query.period === 'all' ? 'all' : 'week';
  let rows;
  if (period === 'all') {
    rows = (await User.find({ role: 'student' }).sort({ xp: -1 }).limit(50))
      .map((u) => ({ id: String(u._id), name: u.name, xp: u.xp, streak: u.streak }));
  } else {
    const since = new Date(Date.now() - 7 * 86400 * 1000);
    const agg = await XpLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$user', xp: { $sum: '$amount' } } },
      { $sort: { xp: -1 } }, { $limit: 50 },
    ]);
    const users = await User.find({ _id: { $in: agg.map((a) => a._id) }, role: 'student' });
    const byId = new Map(users.map((u) => [String(u._id), u]));
    rows = agg.filter((a) => byId.has(String(a._id))).map((a) => ({
      id: String(a._id), name: byId.get(String(a._id)).name, xp: a.xp, streak: byId.get(String(a._id)).streak,
    }));
  }
  rows = rows.map((r, i) => ({ ...r, rank: i + 1, you: r.id === String(req.user._id) }));
  res.json({ period, rows, myRank: rows.find((r) => r.you)?.rank || null });
}));

export default router;

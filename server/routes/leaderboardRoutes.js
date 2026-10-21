import express from 'express';
import { User, XpLog, Classroom } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../utils/asyncWrap.js';

const router = express.Router();

router.get('/leaderboard', requireAuth, wrap(async (req, res) => {
  const period = req.query.period === 'all' ? 'all' : 'week';
  const classroomId = req.query.classroomId;

  let classroom = null;
  let studentIds = null;

  if (classroomId && classroomId !== 'global') {
    classroom = await Classroom.findById(classroomId);
    if (classroom) {
      studentIds = classroom.students || [];
    }
  }

  let rows = [];

  if (studentIds) {
    // Scoped to classroom
    if (period === 'all') {
      const users = await User.find({ _id: { $in: studentIds }, role: 'student' }).sort({ xp: -1 }).limit(100);
      rows = users.map((u) => ({ id: String(u._id), name: u.name, xp: u.xp, streak: u.streak }));
    } else {
      const since = new Date(Date.now() - 7 * 86400 * 1000);
      const agg = await XpLog.aggregate([
        { $match: { createdAt: { $gte: since }, user: { $in: studentIds } } },
        { $group: { _id: '$user', xp: { $sum: '$amount' } } },
        { $sort: { xp: -1 } },
        { $limit: 100 },
      ]);
      const users = await User.find({ _id: { $in: studentIds }, role: 'student' });
      const byId = new Map(users.map((u) => [String(u._id), u]));
      const seen = new Set(agg.map((a) => String(a._id)));

      rows = agg.filter((a) => byId.has(String(a._id))).map((a) => ({
        id: String(a._id),
        name: byId.get(String(a._id)).name,
        xp: a.xp,
        streak: byId.get(String(a._id)).streak,
      }));

      // Include remaining students who earned 0 XP this week so full class is shown
      for (const u of users) {
        if (!seen.has(String(u._id))) {
          rows.push({
            id: String(u._id),
            name: u.name,
            xp: 0,
            streak: u.streak,
          });
        }
      }
    }
  } else {
    // Global leaderboard
    if (period === 'all') {
      rows = (await User.find({ role: 'student' }).sort({ xp: -1 }).limit(50))
        .map((u) => ({ id: String(u._id), name: u.name, xp: u.xp, streak: u.streak }));
    } else {
      const since = new Date(Date.now() - 7 * 86400 * 1000);
      const agg = await XpLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$user', xp: { $sum: '$amount' } } },
        { $sort: { xp: -1 } },
        { $limit: 50 },
      ]);
      const users = await User.find({ _id: { $in: agg.map((a) => a._id) }, role: 'student' });
      const byId = new Map(users.map((u) => [String(u._id), u]));
      rows = agg.filter((a) => byId.has(String(a._id))).map((a) => ({
        id: String(a._id),
        name: byId.get(String(a._id)).name,
        xp: a.xp,
        streak: byId.get(String(a._id)).streak,
      }));
    }
  }

  rows = rows.map((r, i) => ({ ...r, rank: i + 1, you: r.id === String(req.user._id) }));

  res.json({
    period,
    rows,
    myRank: rows.find((r) => r.you)?.rank || null,
    totalLearners: rows.length,
    classroom: classroom
      ? {
          id: String(classroom._id),
          name: classroom.name,
          code: classroom.code,
          totalStudents: (classroom.students || []).length,
          teacherName: classroom.teacherName,
        }
      : null,
  });
}));

export default router;

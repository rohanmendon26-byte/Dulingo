import express from 'express';
import { Story, User } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { award, publicUser, BADGE_LABELS } from '../services/gameService.js';
import { wrap } from '../utils/asyncWrap.js';

const router = express.Router();

router.get('/stories', requireAuth, wrap(async (req, res) => {
  const stories = await Story.find().sort({ createdAt: -1 });
  const read = new Set((req.user.storiesRead || []).map(String));
  res.json({
    stories: stories.map((s) => ({
      id: s._id,
      title: s.title,
      topic: s.topic,
      text: s.text,
      audioUrl: s.audioUrl || '',
      xp: s.xp,
      translations: s.translations || {},
      read: read.has(String(s._id)),
      createdAt: s.createdAt,
    })),
  });
}));

router.post('/stories/:id/complete', requireAuth, requireRole('student'), wrap(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ error: 'Story not found' });
  if (req.user.storiesRead.some((id) => String(id) === String(story._id)))
    return res.json({ xpEarned: 0, newBadges: [], user: publicUser(req.user) });
  req.user.storiesRead.push(story._id);
  const newBadges = await award(req.user, story.xp, `story:${story.title}`);
  res.json({
    xpEarned: story.xp,
    newBadges: newBadges.map((id) => ({ id, label: BADGE_LABELS[id] })),
    user: publicUser(req.user),
  });
}));

router.delete('/stories/:id', requireAuth, requireRole('teacher'), wrap(async (req, res) => {
  const story = await Story.findByIdAndDelete(req.params.id);
  if (!story) return res.status(404).json({ error: 'Audio story not found' });
  await User.updateMany({ storiesRead: req.params.id }, { $pull: { storiesRead: req.params.id } });
  res.json({ ok: true, message: 'Audio story deleted successfully' });
}));

export default router;

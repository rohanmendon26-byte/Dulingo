import express from 'express';
import { Announcement } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { wrap } from '../utils/asyncWrap.js';

const router = express.Router();

/**
 * GET /announcements
 * Fetch all active announcements (accessible to authenticated students & teachers)
 */
router.get(
  '/announcements',
  requireAuth,
  wrap(async (req, res) => {
    const list = await Announcement.find({ active: true })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(30)
      .lean();

    res.json({
      announcements: list.map((a) => ({
        id: a._id,
        title: a.title,
        content: a.content,
        category: a.category,
        pinned: Boolean(a.pinned),
        authorName: a.authorName || 'Teacher',
        createdAt: a.createdAt,
      })),
    });
  })
);

/**
 * POST /announcements
 * Broadcast a new announcement (Teacher only)
 */
router.post(
  '/announcements',
  requireAuth,
  requireRole('teacher'),
  wrap(async (req, res) => {
    const title = String(req.body.title || '').trim();
    const content = String(req.body.content || '').trim();
    const category = ['general', 'urgent', 'assignment', 'tip', 'civic_alert'].includes(req.body.category)
      ? req.body.category
      : 'general';
    const pinned = Boolean(req.body.pinned);

    if (!title) {
      return res.status(400).json({ error: 'Please enter an announcement title' });
    }
    if (!content) {
      return res.status(400).json({ error: 'Please enter announcement content' });
    }

    const created = await Announcement.create({
      title,
      content,
      category,
      pinned,
      author: req.user._id,
      authorName: req.user.name || 'Teacher',
      active: true,
    });

    res.status(201).json({
      ok: true,
      announcement: {
        id: created._id,
        title: created.title,
        content: created.content,
        category: created.category,
        pinned: created.pinned,
        authorName: created.authorName,
        createdAt: created.createdAt,
      },
    });
  })
);

/**
 * DELETE /announcements/:id
 * Delete an announcement (Teacher only)
 */
router.delete(
  '/announcements/:id',
  requireAuth,
  requireRole('teacher'),
  wrap(async (req, res) => {
    const a = await Announcement.findById(req.params.id);
    if (!a) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: 'Announcement deleted successfully' });
  })
);

export default router;

import express from 'express';
import { Task, Submission } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { award, publicUser, todayIST, levelFor, BADGE_LABELS } from '../services/gameService.js';
import { matches, isCorrect } from '../utils/stringUtils.js';
import { wrap } from '../utils/asyncWrap.js';

const router = express.Router();

router.get('/tasks/today', requireAuth, wrap(async (req, res) => {
  const today = todayIST();
  const tasks = await Task.find({ assignedDate: { $lte: today } }).sort({ assignedDate: -1, createdAt: 1 }).limit(40);
  const subs = await Submission.find({ user: req.user._id, task: { $in: tasks.map((t) => t._id) } });
  const done = new Map(subs.map((s) => [String(s.task), s]));
  const list = tasks.map((t) => ({
    id: t._id, title: t.title, topic: t.topic, type: t.type, prompt: t.prompt,
    audioText: t.audioText || t.prompt, audioUrl: t.audioUrl || '', options: t.options, xp: t.xp,
    assignedDate: t.assignedDate, isToday: t.assignedDate === today, translations: t.translations || {},
    fields: (t.fields || []).map((f) => ({ label: f.label, hint: f.hint, placeholder: f.placeholder })),
    done: done.has(String(t._id)),
    result: done.has(String(t._id))
      ? { correct: done.get(String(t._id)).correct, xpEarned: done.get(String(t._id)).xpEarned }
      : null,
  }));
  // pending first, today's before older ones
  list.sort((a, b) => Number(a.done) - Number(b.done) || Number(b.isToday) - Number(a.isToday));
  const todays = list.filter((t) => t.isToday);

  // recent teacher feedbacks for essays
  const reviewedSubs = await Submission.find({ user: req.user._id, feedbackText: { $exists: true, $ne: '' } })
    .sort({ reviewedAt: -1, updatedAt: -1 })
    .limit(5)
    .populate('task', 'title topic');
  const feedbacks = reviewedSubs.map((s) => ({
    id: s._id,
    taskTitle: s.task?.title || 'Essay',
    topic: s.task?.topic || 'General',
    feedbackText: s.feedbackText,
    reviewedAt: s.reviewedAt || s.updatedAt,
  }));

  res.json({
    tasks: list,
    feedbacks,
    summary: {
      doneToday: todays.filter((t) => t.done).length,
      totalToday: todays.length,
      pending: list.filter((t) => !t.done).length,
    },
    user: publicUser(req.user),
  });
}));

router.post('/tasks/:id/submit', requireAuth, requireRole('student'), wrap(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (await Submission.exists({ user: req.user._id, task: task._id }))
    return res.status(409).json({ error: 'You already completed this task' });

  const answer = String(req.body.answer || '').trim();
  if (!answer) return res.status(400).json({ error: 'Please give an answer' });

  let correct, needsReview = false, xpEarned, fieldResults = null;
  if (task.type === 'mock_form') {
    let values;
    try { values = JSON.parse(answer); } catch { values = null; }
    if (!Array.isArray(values) || values.length !== task.fields.length || values.some((v) => !String(v).trim()))
      return res.status(400).json({ error: 'Please fill every box in the form' });
    fieldResults = task.fields.map((f, i) => ({ ok: matches(f.answer, values[i]), expected: String(f.answer).split('|')[0] }));
    const right = fieldResults.filter((r) => r.ok).length;
    correct = right === fieldResults.length;
    xpEarned = correct ? task.xp : Math.max(2, Math.round((task.xp * right) / fieldResults.length)); // partial credit
  } else if (task.type === 'essay') {
    if (answer.split(/\s+/).length < 15) return res.status(400).json({ error: 'Please write at least 15 words' });
    correct = true; needsReview = true; xpEarned = task.xp;
  } else {
    correct = isCorrect(task, answer);
    xpEarned = correct ? task.xp : 2; // small reward for trying
  }

  const levelBefore = levelFor(req.user.xp);
  await Submission.create({ user: req.user._id, task: task._id, answer, correct, needsReview, xpEarned });
  const newBadges = await award(req.user, xpEarned, `task:${task.title}`);
  res.json({
    correct, needsReview, xpEarned, fieldResults,
    explanation: task.explanation,
    correctAnswer: ['essay', 'mock_form'].includes(task.type) ? null : task.answer.split('|')[0],
    newBadges: newBadges.map((id) => ({ id, label: BADGE_LABELS[id] })),
    leveledUp: levelFor(req.user.xp) > levelBefore,
    user: publicUser(req.user),
  });
}));

export default router;

import express from 'express';
import { Task, Submission, Classroom } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { submitTaskSchema } from '../validators/schemas.js';
import { award, publicUser, todayIST, levelFor, BADGE_LABELS } from '../services/gameService.js';
import { matches, isCorrect } from '../utils/stringUtils.js';
import { wrap } from '../utils/asyncWrap.js';

const router = express.Router();

router.get('/tasks/today', requireAuth, wrap(async (req, res) => {
  const today = todayIST();
  let taskFilter = { assignedDate: { $lte: today } };

  if (req.user.role === 'student') {
    // Students only receive tasks for classrooms they are enrolled in (+ public civic tasks)
    const enrolled = await Classroom.find({ students: req.user._id, active: true }).select('_id');
    const enrolledIds = enrolled.map((c) => c._id);
    taskFilter = {
      assignedDate: { $lte: today },
      $or: [
        { classroom: { $in: enrolledIds } },
        { classroom: null },
      ],
    };
  } else if (req.user.role === 'teacher') {
    const teacherClasses = await Classroom.find({ teacher: req.user._id }).select('_id');
    const teacherClassIds = teacherClasses.map((c) => c._id);
    taskFilter = {
      assignedDate: { $lte: today },
      $or: [
        { classroom: { $in: teacherClassIds } },
        { createdBy: req.user._id },
        { classroom: null },
      ],
    };
  }

  const tasks = await Task.find(taskFilter)
    .populate('classroom', 'name code')
    .sort({ assignedDate: -1, createdAt: 1 })
    .limit(50);
  const subs = await Submission.find({ user: req.user._id, task: { $in: tasks.map((t) => t._id) } });
  const done = new Map(subs.map((s) => [String(s.task), s]));
  const now = new Date();
  const list = tasks.map((t) => {
    let isExpired = false;
    let daysLeft = null;
    let hoursLeft = null;
    let expDate = null;

    if (t.expiresAt) {
      expDate = new Date(t.expiresAt);
    } else if (t.dueDate) {
      expDate = new Date(`${t.dueDate}T${t.dueTime || '23:59'}:00`);
    }

    if (expDate && !isNaN(expDate.getTime())) {
      isExpired = now > expDate;
      const diffMs = expDate - now;
      if (diffMs > 0) {
        hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
        daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
    }

    return {
      id: t._id, title: t.title, topic: t.topic, type: t.type, prompt: t.prompt,
      audioText: t.audioText || t.prompt, audioUrl: t.audioUrl || '', options: t.options, xp: t.xp,
      assignedDate: t.assignedDate,
      dueDate: t.dueDate || null,
      dueTime: t.dueTime || '23:59',
      expiresAt: t.expiresAt || null,
      isExpired,
      daysLeft,
      hoursLeft,
      isToday: t.assignedDate === today, translations: t.translations || {},
      fields: (t.fields || []).map((f) => ({ label: f.label, hint: f.hint, placeholder: f.placeholder })),
      classroom: t.classroom ? { id: t.classroom._id, name: t.classroom.name, code: t.classroom.code } : null,
      done: done.has(String(t._id)),
      result: done.has(String(t._id))
        ? { correct: done.get(String(t._id)).correct, xpEarned: done.get(String(t._id)).xpEarned }
        : null,
    };
  });
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

router.post('/tasks/:id/submit', requireAuth, requireRole('student'), validate(submitTaskSchema), wrap(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.classroom) {
    const isMember = await Classroom.exists({ _id: task.classroom, students: req.user._id, active: true });
    if (!isMember) {
      return res.status(403).json({ error: 'You are not enrolled in the classroom for this task.' });
    }
  }

  // Check if deadline timeline has passed
  const now = new Date();
  let expDate = task.expiresAt ? new Date(task.expiresAt) : (task.dueDate ? new Date(`${task.dueDate}T${task.dueTime || '23:59'}:00`) : null);
  if (expDate && !isNaN(expDate.getTime()) && now > expDate) {
    return res.status(403).json({ error: 'The deadline for this task has passed. You can still practice it in Practice Mode without XP.' });
  }

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

/**
 * POST /tasks/:id/practice
 * Redo a completed or ongoing task in Practice Mode (No duplicate XP, safe practice)
 */
router.post('/tasks/:id/practice', requireAuth, requireRole('student'), wrap(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.classroom) {
    const isMember = await Classroom.exists({ _id: task.classroom, students: req.user._id, active: true });
    if (!isMember) {
      return res.status(403).json({ error: 'You are not enrolled in the classroom for this task.' });
    }
  }

  const answer = String(req.body.answer || '').trim();
  if (!answer) return res.status(400).json({ error: 'Please provide an answer' });

  let correct, needsReview = false, fieldResults = null;
  if (task.type === 'mock_form') {
    let values;
    try { values = JSON.parse(answer); } catch { values = null; }
    if (!Array.isArray(values) || values.length !== task.fields.length || values.some((v) => !String(v).trim()))
      return res.status(400).json({ error: 'Please fill every box in the form' });
    fieldResults = task.fields.map((f, i) => ({ ok: matches(f.answer, values[i]), expected: String(f.answer).split('|')[0] }));
    const right = fieldResults.filter((r) => r.ok).length;
    correct = right === fieldResults.length;
  } else if (task.type === 'essay') {
    if (answer.split(/\s+/).length < 15) return res.status(400).json({ error: 'Please write at least 15 words' });
    correct = true; needsReview = true;
  } else {
    correct = isCorrect(task, answer);
  }

  // Generate smart learning hint if incorrect
  let hint = '';
  if (!correct) {
    if (task.type === 'mock_form' && fieldResults) {
      const wrongIdx = fieldResults.findIndex((r) => !r.ok);
      if (wrongIdx !== -1 && task.fields[wrongIdx]?.hint) {
        hint = `Hint for ${task.fields[wrongIdx].label}: ${task.fields[wrongIdx].hint}`;
      } else {
        hint = 'Tip: Carefully verify formatting and spelling in each field.';
      }
    } else if (task.answer) {
      const cleanExpected = task.answer.split('|')[0].trim();
      hint = `Hint: Starts with "${cleanExpected.slice(0, 2)}" (${cleanExpected.length} letters). Topic: ${task.topic}.`;
    }
  }

  res.json({
    correct,
    isPractice: true,
    needsReview,
    xpEarned: 0,
    fieldResults,
    hint,
    explanation: task.explanation,
    correctAnswer: ['essay', 'mock_form'].includes(task.type) ? null : task.answer.split('|')[0],
    message: correct
      ? 'Well done! Practice makes perfect.'
      : 'Keep practicing! Review the explanation below and try again.',
  });
}));

/**
 * POST /tasks/sync-offline
 * Bulk sync queued answers when student re-establishes connectivity
 */
router.post('/tasks/sync-offline', requireAuth, requireRole('student'), wrap(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (items.length === 0) {
    return res.json({ syncedCount: 0, totalProcessed: 0, user: publicUser(req.user) });
  }

  let syncedCount = 0;
  let totalNewXp = 0;
  const levelBefore = levelFor(req.user.xp);

  for (const item of items) {
    const taskId = item.taskId || (typeof item.url === 'string' ? item.url.replace('/tasks/', '').replace('/submit', '') : null);
    if (!taskId) continue;

    const task = await Task.findById(taskId);
    if (!task) continue;

    if (task.classroom) {
      const isMember = await Classroom.exists({ _id: task.classroom, students: req.user._id, active: true });
      if (!isMember) continue;
    }

    // If submission already exists from a prior sync, treat as succeeded
    const existing = await Submission.findOne({ user: req.user._id, task: task._id });
    if (existing) {
      syncedCount++;
      continue;
    }

    const answer = String(item.answer || item.body?.answer || '').trim();
    if (!answer) continue;

    let correct, needsReview = false, xpEarned, fieldResults = null;
    if (task.type === 'mock_form') {
      let values;
      try { values = JSON.parse(answer); } catch { values = null; }
      if (Array.isArray(values)) {
        fieldResults = task.fields.map((f, i) => ({ ok: matches(f.answer, values[i]), expected: String(f.answer).split('|')[0] }));
        const right = fieldResults.filter((r) => r.ok).length;
        correct = right === fieldResults.length;
        xpEarned = correct ? task.xp : Math.max(2, Math.round((task.xp * right) / fieldResults.length));
      } else {
        correct = false;
        xpEarned = 2;
      }
    } else if (task.type === 'essay') {
      correct = true; needsReview = true; xpEarned = task.xp;
    } else {
      correct = isCorrect(task, answer);
      xpEarned = correct ? task.xp : 2;
    }

    await Submission.create({ user: req.user._id, task: task._id, answer, correct, needsReview, xpEarned });
    await award(req.user, xpEarned, `task:${task.title}`);
    totalNewXp += xpEarned;
    syncedCount++;
  }

  res.json({
    syncedCount,
    totalProcessed: items.length,
    newXp: totalNewXp,
    leveledUp: levelFor(req.user.xp) > levelBefore,
    user: publicUser(req.user),
  });
}));

export default router;

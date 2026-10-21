import express from 'express';
import { User, Task, Submission, Story, Classroom } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTaskSchema } from '../validators/schemas.js';
import { audioUpload } from '../middleware/upload.js';
import { hasCloudinary, cloudinary } from '../config/cloudinary.js';
import { draftTaskWithAI } from '../services/aiService.js';
import { award, todayIST } from '../services/gameService.js';
import { wrap } from '../utils/asyncWrap.js';

const router = express.Router();
const teacher = [requireAuth, requireRole('teacher')];

router.post('/teacher/upload-audio', ...teacher, (req, res) => {
  audioUpload.single('audio')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Audio upload failed' });
    if (!req.file) return res.status(400).json({ error: 'Please choose an audio file to upload' });

    if (hasCloudinary) {
      try {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'dulingo/audio',
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              return res.status(500).json({ error: 'Cloud audio upload failed' });
            }
            res.json({ url: result.secure_url, filename: result.public_id });
          }
        );
        uploadStream.end(req.file.buffer);
      } catch (ex) {
        console.error('Cloud upload exception:', ex);
        res.status(500).json({ error: 'Failed to process audio stream' });
      }
    } else {
      const audioUrl = `/uploads/audio/${req.file.filename}`;
      res.json({ url: audioUrl, filename: req.file.filename });
    }
  });
});

router.get('/teacher/overview', ...teacher, wrap(async (req, res) => {
  const teacherClasses = await Classroom.find({ teacher: req.user._id, active: true })
    .populate('students', 'name email xp streak')
    .sort({ createdAt: -1 });

  const selectedClassId = req.query.classroomId;
  let targetClass = null;
  if (selectedClassId) {
    targetClass = teacherClasses.find((c) => String(c._id) === String(selectedClassId));
  }

  let studentList = [];
  let studentIds = [];

  if (targetClass) {
    studentList = targetClass.students || [];
    studentIds = studentList.map((s) => s._id);
  } else if (teacherClasses.length > 0) {
    const studentMap = new Map();
    for (const c of teacherClasses) {
      for (const s of (c.students || [])) {
        studentMap.set(String(s._id), s);
      }
    }
    studentList = Array.from(studentMap.values()).sort((a, b) => (b.xp || 0) - (a.xp || 0));
    studentIds = studentList.map((s) => s._id);
  } else {
    studentList = await User.find({ role: 'student' }).sort({ xp: -1 });
    studentIds = studentList.map((s) => s._id);
  }

  const counts = await Submission.aggregate([
    { $match: { user: { $in: studentIds } } },
    { $group: { _id: '$user', done: { $sum: 1 } } },
  ]);
  const doneBy = new Map(counts.map((c) => [String(c._id), c.done]));

  const allTeacherClassIds = teacherClasses.map((c) => c._id);
  const taskQuery = targetClass
    ? { classroom: targetClass._id }
    : { $or: [{ createdBy: req.user._id }, { classroom: { $in: allTeacherClassIds } }] };

  const tasks = await Task.find(taskQuery)
    .populate('classroom', 'name code')
    .sort({ assignedDate: -1, createdAt: -1 })
    .limit(60);

  const reviews = await Submission.find({ needsReview: true, user: { $in: studentIds } })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('user', 'name')
    .populate('task', 'title');

  res.json({
    classrooms: teacherClasses.map((c) => ({
      id: c._id,
      name: c.name,
      subject: c.subject,
      code: c.code,
      studentCount: (c.students || []).length,
    })),
    selectedClassroomId: targetClass ? String(targetClass._id) : null,
    students: studentList.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      xp: s.xp || 0,
      streak: s.streak || 0,
      done: doneBy.get(String(s._id)) || 0,
    })),
    tasks: tasks.map((t) => ({
      id: t._id,
      title: t.title,
      topic: t.topic,
      type: t.type,
      xp: t.xp,
      assignedDate: t.assignedDate,
      dueDate: t.dueDate || null,
      dueTime: t.dueTime || '23:59',
      expiresAt: t.expiresAt || null,
      audioUrl: t.audioUrl || '',
      classroom: t.classroom ? { id: t.classroom._id, name: t.classroom.name, code: t.classroom.code } : null,
    })),
    essays: reviews.map((r) => ({
      id: r._id,
      student: r.user?.name,
      task: r.task?.title,
      answer: r.answer,
      feedbackText: r.feedbackText || '',
      at: r.createdAt,
    })),
  });
}));

router.post('/teacher/essays/:id/feedback', ...teacher, wrap(async (req, res) => {
  const { feedbackText, bonusXp } = req.body;
  if (!feedbackText || !feedbackText.trim()) {
    return res.status(400).json({ error: 'Feedback text is required' });
  }

  const sub = await Submission.findById(req.params.id).populate('user').populate('task');
  if (!sub) return res.status(404).json({ error: 'Essay submission not found' });

  sub.feedbackText = feedbackText.trim();
  sub.needsReview = false; // Mark reviewed
  sub.reviewedAt = new Date();

  const extra = Math.max(0, Math.min(Number(bonusXp) || 0, 50));
  if (extra > 0 && sub.user) {
    sub.xpEarned += extra;
    await award(sub.user, extra, `essay_feedback:${sub.task?.title || 'Essay'}`);
  }

  await sub.save();
  res.json({ ok: true, submissionId: sub._id });
}));

router.post('/teacher/ai-draft', ...teacher, wrap(async (req, res) => {
  const { topic, taskType } = req.body;
  if (!topic || !String(topic).trim()) {
    return res.status(400).json({ error: 'Please enter a topic to draft a task' });
  }
  const draft = await draftTaskWithAI({ topic: String(topic).trim(), taskType });
  res.json({ draft });
}));

router.post('/teacher/tasks', ...teacher, validate(createTaskSchema), wrap(async (req, res) => {
  const b = req.body;
  if (!b.title || !b.prompt || !['audio_mcq', 'fill_blank', 'essay', 'mock_form'].includes(b.type))
    return res.status(400).json({ error: 'Title, question and type are required' });
  const options = (b.options || []).map((o) => String(o).trim()).filter(Boolean);
  if (b.type === 'audio_mcq' && (options.length < 2 || !options.includes(String(b.answer).trim())))
    return res.status(400).json({ error: 'Give at least 2 options and make the answer one of them' });
  if (b.type === 'fill_blank' && !b.answer) return res.status(400).json({ error: 'Give the correct answer' });
  const fields = (b.fields || [])
    .map((f) => ({ label: String(f.label || '').trim(), answer: String(f.answer || '').trim(), hint: String(f.hint || '').trim(), placeholder: String(f.placeholder || '').trim() }))
    .filter((f) => f.label && f.answer);
  if (b.type === 'mock_form' && fields.length < 2) return res.status(400).json({ error: 'Add at least 2 form fields, each with a label and correct value' });

  if (!b.classroom || b.classroom === 'all' || b.classroom === 'public' || String(b.classroom).trim() === '') {
    return res.status(400).json({ error: 'Classroom is required. Teachers cannot publish public tasks; please select which classroom to publish this task to.' });
  }

  const cls = await Classroom.findOne({ _id: b.classroom, teacher: req.user._id, active: true });
  if (!cls) {
    return res.status(400).json({ error: 'Selected classroom not found or does not belong to you. Please select a valid classroom.' });
  }
  const classroomId = cls._id;

  const dueDate = b.dueDate ? String(b.dueDate).trim() : null;
  const dueTime = b.dueTime ? String(b.dueTime).trim() : '23:59';
  let expiresAt = null;
  if (dueDate) {
    try {
      expiresAt = new Date(`${dueDate}T${dueTime}:00`);
    } catch {
      expiresAt = null;
    }
  }

  const task = await Task.create({
    fields: b.type === 'mock_form' ? fields : [],
    title: b.title, topic: b.topic || 'General', type: b.type, prompt: b.prompt,
    audioText: b.audioText || '', audioUrl: b.audioUrl || '', options, answer: String(b.answer || '').trim(),
    explanation: b.explanation || '', xp: Math.min(Math.max(Number(b.xp) || 10, 1), 100),
    assignedDate: b.assignedDate || todayIST(), createdBy: req.user._id,
    dueDate,
    dueTime,
    expiresAt,
    classroom: classroomId,
    translations: b.translations || {},
  });
  res.json({ id: task._id });
}));

router.delete('/teacher/tasks/:id', ...teacher, wrap(async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  await Submission.deleteMany({ task: req.params.id });
  res.json({ ok: true });
}));

router.post('/teacher/stories', ...teacher, wrap(async (req, res) => {
  const { title, topic, text, audioUrl, translations } = req.body;
  if (!title || !text) return res.status(400).json({ error: 'Title and story text are required' });
  const story = await Story.create({
    title,
    topic: topic || 'General',
    text,
    audioUrl: audioUrl || '',
    translations: translations || {},
    createdBy: req.user._id,
  });
  res.json({ id: story._id });
}));

export default router;

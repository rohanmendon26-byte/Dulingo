import express from 'express';
import crypto from 'node:crypto';
import { Classroom, User, Task } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { wrap } from '../utils/asyncWrap.js';

const router = express.Router();

/**
 * Helper to generate a memorable, clean 6-character code
 * Format: 3 letters + 3 numbers (e.g., "DUL482")
 */
async function generateUniqueClassroomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // excluded easily confused I, O
  const digits = '23456789'; // excluded 0, 1

  for (let attempt = 0; attempt < 10; attempt++) {
    let code = '';
    for (let i = 0; i < 3; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    for (let i = 0; i < 3; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }

    const exists = await Classroom.exists({ code });
    if (!exists) return code;
  }

  // Fallback with timestamp slice
  return `CLS${Date.now().toString().slice(-4)}`;
}

/**
 * GET /classrooms/my
 * Get all classrooms for the current user
 * - Teachers get classes they created with student lists
 * - Students get classes they are enrolled in
 */
router.get(
  '/classrooms/my',
  requireAuth,
  wrap(async (req, res) => {
    if (req.user.role === 'teacher') {
      const list = await Classroom.find({ teacher: req.user._id, active: true })
        .populate('students', 'name email xp streak level')
        .sort({ createdAt: -1 });

      const classrooms = list.map((c) => ({
        id: c._id,
        name: c.name,
        subject: c.subject,
        description: c.description,
        code: c.code,
        studentCount: c.students.length,
        students: (c.students || []).map((s) => ({
          id: s._id,
          name: s.name,
          email: s.email,
          xp: s.xp || 0,
          streak: s.streak || 0,
        })),
        createdAt: c.createdAt,
      }));

      return res.json({ classrooms });
    }

    // Student view
    const list = await Classroom.find({ students: req.user._id, active: true })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    const classrooms = list.map((c) => ({
      id: c._id,
      name: c.name,
      subject: c.subject,
      description: c.description,
      code: c.code,
      teacherName: c.teacher?.name || c.teacherName || 'Teacher',
      studentCount: (c.students || []).length,
      createdAt: c.createdAt,
    }));

    res.json({ classrooms });
  })
);

/**
 * POST /classrooms
 * Teacher creates a new classroom
 */
router.post(
  '/classrooms',
  requireAuth,
  requireRole('teacher'),
  wrap(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const subject = String(req.body.subject || 'Civic Learning').trim();
    const description = String(req.body.description || '').trim();

    if (!name) {
      return res.status(400).json({ error: 'Classroom name is required' });
    }

    const code = await generateUniqueClassroomCode();

    const classroom = await Classroom.create({
      name,
      subject,
      description,
      code,
      teacher: req.user._id,
      teacherName: req.user.name || 'Teacher',
      students: [],
      active: true,
    });

    res.status(201).json({
      ok: true,
      classroom: {
        id: classroom._id,
        name: classroom.name,
        subject: classroom.subject,
        description: classroom.description,
        code: classroom.code,
        studentCount: 0,
        students: [],
        createdAt: classroom.createdAt,
      },
      message: `Classroom "${classroom.name}" created with code ${classroom.code}!`,
    });
  })
);

/**
 * POST /classrooms/join
 * Student joins a classroom using its 6-character code
 */
router.post(
  '/classrooms/join',
  requireAuth,
  requireRole('student'),
  wrap(async (req, res) => {
    const rawCode = String(req.body.code || '').trim().toUpperCase();
    if (!rawCode) {
      return res.status(400).json({ error: 'Please enter a classroom join code' });
    }

    const classroom = await Classroom.findOne({ code: rawCode, active: true }).populate('teacher', 'name');
    if (!classroom) {
      return res.status(404).json({ error: `No active classroom found for code "${rawCode}". Please check with your teacher.` });
    }

    const isAlreadyMember = classroom.students.some((sId) => String(sId) === String(req.user._id));

    if (!isAlreadyMember) {
      classroom.students.push(req.user._id);
      await classroom.save();

      // Also ensure it is in the student's classrooms array
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { classrooms: classroom._id },
      });
    }

    res.json({
      ok: true,
      alreadyJoined: isAlreadyMember,
      classroom: {
        id: classroom._id,
        name: classroom.name,
        subject: classroom.subject,
        code: classroom.code,
        teacherName: classroom.teacher?.name || classroom.teacherName || 'Teacher',
        studentCount: classroom.students.length,
      },
      message: isAlreadyMember
        ? `You are already enrolled in ${classroom.name}`
        : `Successfully joined ${classroom.name}! Assigned tasks will now appear on your dashboard.`,
    });
  })
);

/**
 * POST /classrooms/:id/leave
 * Student leaves a classroom
 */
router.post(
  '/classrooms/:id/leave',
  requireAuth,
  requireRole('student'),
  wrap(async (req, res) => {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    classroom.students = classroom.students.filter((sId) => String(sId) !== String(req.user._id));
    await classroom.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { classrooms: classroom._id },
    });

    res.json({ ok: true, message: `Left ${classroom.name}` });
  })
);

/**
 * DELETE /classrooms/:id
 * Teacher deletes/archives a classroom
 */
router.delete(
  '/classrooms/:id',
  requireAuth,
  requireRole('teacher'),
  wrap(async (req, res) => {
    const classroom = await Classroom.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found or unauthorized' });
    }

    // Remove classroom reference from enrolled students
    await User.updateMany({ classrooms: classroom._id }, { $pull: { classrooms: classroom._id } });

    // Remove classroom reference from assigned tasks (convert to unassigned or keep for history)
    await Task.updateMany({ classroom: classroom._id }, { $set: { classroom: null } });

    await Classroom.findByIdAndDelete(classroom._id);

    res.json({ ok: true, message: 'Classroom deleted successfully' });
  })
);

export default router;

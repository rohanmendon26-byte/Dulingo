import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be 60 characters or less'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  role: z.enum(['student', 'teacher']).optional().default('student'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

export const createClassroomSchema = z.object({
  name: z
    .string({ required_error: 'Classroom name is required' })
    .trim()
    .min(2, 'Classroom name must be at least 2 characters')
    .max(60, 'Classroom name must be 60 characters or less'),
  subject: z
    .string()
    .trim()
    .max(60, 'Subject must be 60 characters or less')
    .optional()
    .default('Civic Learning'),
  description: z
    .string()
    .trim()
    .max(300, 'Description must be 300 characters or less')
    .optional()
    .default(''),
});

export const joinClassroomSchema = z.object({
  code: z
    .string({ required_error: 'Classroom code is required' })
    .trim()
    .toUpperCase()
    .min(5, 'Invalid classroom code')
    .max(10, 'Invalid classroom code'),
});

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(120, 'Title must be 120 characters or less'),
  prompt: z
    .string({ required_error: 'Prompt is required' })
    .trim()
    .min(2, 'Prompt must be at least 2 characters'),
  type: z.enum(['audio_mcq', 'fill_blank', 'mock_form', 'essay'], {
    errorMap: () => ({ message: 'Task type must be audio_mcq, fill_blank, mock_form, or essay' }),
  }),
  classroom: z.string().optional(),
  classroomId: z.string().optional(),
  topic: z.string().trim().optional().default('General'),
  xp: z
    .coerce
    .number()
    .int()
    .min(1, 'XP must be at least 1')
    .max(100, 'XP cannot exceed 100')
    .optional()
    .default(10),
  assignedDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  options: z.array(z.string()).optional(),
  answer: z.string().optional().default(''),
  fields: z
    .array(
      z.object({
        label: z.string().optional(),
        answer: z.string().optional(),
        hint: z.string().optional(),
        placeholder: z.string().optional(),
      }).passthrough()
    )
    .optional(),
  explanation: z.string().optional().default(''),
  audioUrl: z.string().optional().nullable(),
  audioText: z.string().optional().default(''),
  translations: z.any().optional(),
}).passthrough();

export const submitTaskSchema = z.object({
  answer: z.string({ required_error: 'Answer is required' }),
});

export const reviewSubmissionSchema = z.object({
  approved: z.boolean({ required_error: 'Approval status is required' }),
  feedback: z.string().trim().max(500).optional().default(''),
});

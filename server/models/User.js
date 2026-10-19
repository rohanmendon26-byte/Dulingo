import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], default: 'student' },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: '' }, // YYYY-MM-DD (IST)
    streakFreeze: { type: Boolean, default: true }, // Has 1 active streak freeze / shield available
    freezeUsedDate: { type: String, default: '' }, // YYYY-MM-DD of when freeze was consumed
    badges: { type: [String], default: [] },
    storiesRead: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
export default User;

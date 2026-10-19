import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const submissionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    answer: { type: String, default: '' },
    correct: { type: Boolean, default: false },
    needsReview: { type: Boolean, default: false },
    feedbackText: { type: String, default: '' },
    reviewedAt: { type: Date },
    xpEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);
submissionSchema.index({ user: 1, task: 1 }, { unique: true });

export const Submission = model('Submission', submissionSchema);
export default Submission;

import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ['general', 'urgent', 'assignment', 'tip', 'civic_alert'],
      default: 'general',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      default: 'Teacher',
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pinned announcements first, then newest
announcementSchema.index({ active: 1, pinned: -1, createdAt: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);

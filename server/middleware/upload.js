import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { hasCloudinary } from '../config/cloudinary.js';

export const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
fs.mkdirSync(uploadDir, { recursive: true });

// Use memory storage when Cloudinary is configured, otherwise save to disk
const audioStorage = hasCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
        const safeBase = path.basename(file.originalname, ext).replace(/[^\w-]/g, '_').slice(0, 30);
        cb(null, `${Date.now()}-${safeBase}${ext}`);
      },
    });

export const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (.mp3, .wav, .ogg, .m4a, .aac, .webm) are allowed'));
    }
  },
});

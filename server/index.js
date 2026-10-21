import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import apiRouter from './routes/index.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') || true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Static uploads serving for local audio files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Mount API routes under /api
app.use('/api', apiRouter);

// Start server
const port = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(port, () => console.log(`Dulingo API running on :${port}`));
});

export default app;

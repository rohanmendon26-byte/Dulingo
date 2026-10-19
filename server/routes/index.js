import express from 'express';
import authRoutes from './authRoutes.js';
import taskRoutes from './taskRoutes.js';
import storyRoutes from './storyRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';
import teacherRoutes from './teacherRoutes.js';

const apiRouter = express.Router();

apiRouter.use(authRoutes);
apiRouter.use(taskRoutes);
apiRouter.use(storyRoutes);
apiRouter.use(leaderboardRoutes);
apiRouter.use(teacherRoutes);
apiRouter.get('/health', (_req, res) => res.json({ ok: true }));

export default apiRouter;

import express from 'express';
import authRoutes from './auth.js';
import gameRoutes from './games.js';
import userRoutes from './users.js';

const router = express.Router();

/**
 * @desc Main router that combines all route modules
 * @note All routes will be prefixed with /api when mounted in server.js
 */

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount user management routes
router.use('/users', userRoutes);

// Mount game routes
router.use('/games', gameRoutes);

// Add health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

export default router;

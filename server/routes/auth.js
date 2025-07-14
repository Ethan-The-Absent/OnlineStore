import express from 'express';
import AuthController from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper function for error handling
const handleError = (error, res, defaultStatus = 500) => {
  // Log detailed error information to console
  console.error('AUTH ERROR:', {
    message: error.message,
    stack: error.stack,
    status: error.status || defaultStatus,
    timestamp: new Date().toISOString()
  });

  // Send vague message to client
  return res.status(error.status || defaultStatus).json({
    message: 'Authentication error occurred. Please try again or contact support.'
  });
};

// Register route
router.post('/register', async (req, res) => {
  try {
    await AuthController.register(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    await AuthController.login(req, res);
  } catch (error) {
    handleError(error, res, 401);
  }
});

// Refresh token route
router.post('/refresh', async (req, res) => {
  try {
    await AuthController.refresh(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    await AuthController.logout(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

// Get current user route
router.get('/me', verifyToken, (req, res) => {
  try {
    const { _id, username, role, lastLogin } = req.user;
    return res.json({ _id, username, role, lastLogin });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;

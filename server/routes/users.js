import express from 'express';
import { verifyToken, isAdmin, isOwnerOrAdmin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route GET /users
 * @desc Get all users (admin only)
 * @access Private/Admin
 */
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const collection = User.getCollection();
    const users = await collection.find({}, { projection: { password: 0, refreshToken: 0 } }).toArray();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /users/:userId
 * @desc Get user by ID
 * @access Private (owner or admin)
 */
router.get('/:userId', verifyToken, isOwnerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Convert to plain object and remove sensitive data
    const userData = user.toJSON();
    return res.status(200).json(userData);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /users/:userId
 * @desc Update user
 * @access Private (owner or admin)
 */
router.put('/:userId', verifyToken, isOwnerOrAdmin, async (req, res) => {
  try {
    const { username, role } = req.body;
    const userId = req.params.userId;
    
    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if username is being changed and if it already exists
    if (username && username !== user.username) {
      const usernameExists = await User.usernameExists(username);
      if (usernameExists) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      user.username = username;
    }
    
    // Only allow role changes if the requester is an admin
    if (role && req.user.role === 'admin') {
      user.role = role;
    }
    
    // Update the user in the database
    const collection = User.getCollection();
    await collection.updateOne(
      { _id: user._id },
      { $set: { username: user.username, role: user.role } }
    );
    
    return res.status(200).json({ message: 'User updated successfully', user: user.toJSON() });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route DELETE /users/:userId
 * @desc Delete user
 * @access Private (admin only)
 */
router.delete('/:userId', verifyToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete the user
    const collection = User.getCollection();
    await collection.deleteOne({ _id: user._id });
    
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

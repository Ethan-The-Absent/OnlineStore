import express from 'express';
import { verifyToken, isAdmin, isOwnerOrAdmin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Game from '../models/Game.js';
import { parse } from 'path';
const router = express.Router();

// Error handling helper function
const handleError = (error, res, defaultStatus = 500) => {
  // Log detailed error information to console
  console.error('USER ERROR:', {
    message: error.message,
    stack: error.stack,
    status: error.status || defaultStatus,
    timestamp: new Date().toISOString()
  });

  // Send vague message to client
  return res.status(error.status || defaultStatus).json({
    message: 'User operation error occurred. Please try again or contact support.'
  });
};

/**
 * @route GET /users
 * @desc Get all users (admin only)
 * @access Private/Admin
 */
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const sanitizedUsersData = await User.findAll();
    return res.status(200).json(sanitizedUsersData);
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @route GET /user/:userId/cart
 * @des Get user cart by ID
 * @access Private (owner or admin)
 */
router.get('/:userId/cart', verifyToken, isOwnerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      const notFoundError = new Error('User not found');
      notFoundError.status = 404;
      throw notFoundError;
    }

    // Return the users cart
    const userCart = Array.from(user.cart);
    return res.status(200).json(userCart);
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @route PUT /user/:userId/cart
 * @des Add game to cart
 * @access Private (owner or admin)
 */
router.put('/:userId/cart', verifyToken, isOwnerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      const notFoundError = new Error('User not found');
      notFoundError.status = 404;
      throw notFoundError;
    }

    const gameId = parseInt(req.body.gameId);
    const parsedGameId = (typeof gameId === 'number' && gameId >= 0) ? gameId : null;
    if (parsedGameId === null) {
      // Invalid gameId provided
      const gameIdError = new Error(`An invalid gameId {${gameId}} was provided or none was received`);
      gameIdError.status = 400;
      throw gameIdError;
    }

    // Check to see if the game can be found in the database
    const game = await Game.findById(parsedGameId)
    if (!game) {
      const notFoundError = new Error('Game not found');
      notFoundError.status = 404;
      throw notFoundError;
    }

    // Add the game to the users cart
    user.addCartGame(game._id);

    // Return the users cart as an array
    const userCart = Array.from(user.cart);
    return res.status(200).json({ message: "Added game to cart", userCart: userCart });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @route DELETE /user/:userId/cart
 * @des Add game to cart
 * @access Private (owner or admin)
 */
router.delete('/:userId/cart', verifyToken, isOwnerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      const notFoundError = new Error('User not found');
      notFoundError.status = 404;
      throw notFoundError;
    }

    const gameId = parseInt(req.body.gameId);
    const parsedGameId = (typeof gameId === 'number' && gameId >= -1) ? gameId : null;
    if (parsedGameId === null) {
      // Invalid gameId provided
      const gameIdError = new Error('An invalid gameId was provided or non was received');
      gameIdError.status = 400;
      throw gameIdError;
    }

    // If gameId is -1, clear the cart
    if (gameId == -1) {
      user.clearCart();
      // Return the users cart as an array
      const userCart = Array.from(user.cart);

      return res.status(200).json({ message: "Cleared cart", userCart: userCart });
    } else {
      // Delete specific game from cart
      // Check to see if the game can be found in the database
      const game = await Game.findById(parsedGameId)
      if (!game) {
        const notFoundError = new Error('Game not found');
        notFoundError.status = 404;
        throw notFoundError;
      }

      // Remove the game from the cart
      user.removeCartGame(game._id);

      // Return the users cart as an array
      const userCart = Array.from(user.cart);
      return res.status(200).json({ message: "Removed game from cart", userCart: userCart });
    }
  } catch (error) {
    handleError(error, res);
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
      const notFoundError = new Error('User not found');
      notFoundError.status = 404;
      throw notFoundError;
    }

    // Convert to plain object and remove sensitive data
    const userData = user.toJSON();
    return res.status(200).json(userData);
  } catch (error) {
    handleError(error, res);
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
      const notFoundError = new Error('User not found');
      notFoundError.status = 404;
      throw notFoundError;
    }

    // Check if username is being changed and if it already exists
    if (username && username !== user.username) {
      const usernameExists = await User.usernameExists(username);
      if (usernameExists) {
        const usernameError = new Error('Username already exists');
        usernameError.status = 400;
        throw usernameError;
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
    handleError(error, res);
  }
});

/**
 * @route DELETE /users/:userId
 * @desc Delete user
 * @access Private/Admin
 */
router.delete('/:userId', verifyToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      const notFoundError = new Error('User not found');
      notFoundError.status = 404;
      throw notFoundError;
    }

    // Delete the user
    const collection = User.getCollection();
    await collection.deleteOne({ _id: user._id });

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;

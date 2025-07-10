import express from 'express';
import { verifyToken, isAdmin, isOwnerOrAdmin } from '../middleware/authMiddleware.js';
import Game from '../models/Game.js';

const router = express.Router();

// Error handling helper function
const handleError = (error, res, defaultStatus = 500) => {
  // Log detailed error information to console
  console.error('GAME ERROR:', {
    message: error.message,
    stack: error.stack,
    status: error.status || defaultStatus,
    timestamp: new Date().toISOString()
  });

  // Send vague message to client
  return res.status(error.status || defaultStatus).json({
    message: 'Game operation error occurred. Please try again or contact support.'
  });
};

/**
 * @route GET /games
 * @desc Get paginated list of games
 * @access Public
 * @query {number} page - Page number (0-indexed)
 * @query {number} pageSize - Number of items per page
 * @query {string} sortField - Field to sort by
 * @query {number} sortOrder - Sort direction (1 for ascending, -1 for descending)
 */
router.get('/', async (req, res) => {
  try {
    // Extract query parameters with defaults
    const page = parseInt(req.query.page) || 0;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortField = req.query.sortField || '_id';
    const sortOrder = parseInt(req.query.sortOrder) || 1;
    
    // Validate pagination parameters
    if (page < 0 || pageSize < 1 || pageSize > 100) {
      const validationError = new Error('Invalid pagination parameters');
      validationError.status = 400;
      throw validationError;
    }
    
    // Get paginated games using the Game model's findPaginated method
    const result = await Game.findPaginated(page, pageSize, sortField, sortOrder);
    
    return res.status(200).json(result);
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @route GET /games/search
 * @desc Search for games based on search term
 * @access Public
 * @query {string} q - Search term
 * @query {number} page - Page number (0-indexed)
 * @query {number} pageSize - Number of items per page
 * @query {string} sortField - Field to sort by
 * @query {number} sortOrder - Sort direction (1 for ascending, -1 for descending)
 */
router.get('/search', async (req, res) => {
  try {
    // Extract query parameters with defaults
    const searchTerm = req.query.q || '';
    const page = parseInt(req.query.page) || 0;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortField = req.query.sortField || 'name';
    const sortOrder = parseInt(req.query.sortOrder) || 1;
    
    // Validate pagination parameters
    if (page < 0 || pageSize < 1 || pageSize > 100) {
      const validationError = new Error('Invalid pagination parameters');
      validationError.status = 400;
      throw validationError;
    }
    
    // Validate search term
    if (!searchTerm.trim()) {
      const validationError = new Error('Search term is required');
      validationError.status = 400;
      throw validationError;
    }
    
    // Get search results using the Game model's search method
    const result = await Game.search(searchTerm, page, pageSize, sortField, sortOrder);
    
    return res.status(200).json(result);
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @route GET /games/:gameId
 * @desc Get game by ID
 * @access Public
 */
router.get('/:gameId', async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);

    if (!game) {
      const notFoundError = new Error('Game not found');
      notFoundError.status = 404;
      throw notFoundError;
    }

    // Convert to plain object and remove sensitive data
    const gameData = game.toJSON();
    return res.status(200).json(gameData);
  } catch (error) {
    handleError(error, res);
  }
});

export default router;

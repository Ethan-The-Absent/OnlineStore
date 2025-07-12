import express from 'express';
import { verifyToken, isAdmin, isOwnerOrAdmin } from '../middleware/authMiddleware.js';
import Game from '../models/Game.js';
import { parse } from 'path';

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
 * @query {number csv} ids - Comma seperated game id values to return instead of page
 */
router.get('/', async (req, res) => {
  try {
    // Extract query parameters with defaults
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortField = req.query.sortField || '_id';
    const sortOrder = parseInt(req.query.sortOrder, 10) || 1;
    const ids = req.query.ids ? req.query.ids.trim() : '';

    // If list of ids were provided, ignore other params and return the list
    // of games
    if (ids) {
      // Split string by comma, handle whitespace and empty string
      const rawIdStrings = ids.split(/,\s*/, 100).filter(s => s.trim() !== '');
      // If requesting too many games, throw an error
      if (rawIdStrings.length > 100) {
        const validationError = new Error("Requesting too many game's information");
        validationError.status = 400;
        throw validationError;
      }

      const parsedIds = new Set([]);
      for (const idStr of rawIdStrings) {
        const trimmedIdStr = idStr.trim();

        // Attempt to convert to integer
        const id = parseInt(trimmedIdStr, 10);

        if (isNaN(id) || id < 0) {
          const validationError = new Error("Invalid game id requested");
          validationError.status = 400;
          throw validationError;
        } else {
          parsedIds.add(id);
        }
      }

      const finalIds = [...parsedIds];
      const result = await Game.findManyIds(finalIds);

      return res.status(200).json(result);
    } else {
      // Validate pagination parameters
      if (page < 0 || pageSize < 1 || pageSize > 100) {
        const validationError = new Error('Invalid pagination parameters');
        validationError.status = 400;
        throw validationError;
      }

      // Get paginated games using the Game model's findPaginated method
      const result = await Game.findPaginated(page, pageSize, sortField, sortOrder);

      return res.status(200).json(result);
    }
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
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortField = req.query.sortField || 'name';
    const sortOrder = parseInt(req.query.sortOrder, 10) || 1;

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
    const providedId = parseInt(req.params.gameId, 10);
    const gameId = providedId >= 0 ? providedId : null;
    // Validate gameId
    if (gameId === null) {
      const validationError = new Error('Invalid gameId parameter');
      validationError.status = 400;
      throw validationError;
    }

    const game = await Game.findById(gameId);

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

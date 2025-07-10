import { ObjectId } from 'mongodb';
import database from '../db.js';

class Game {
  constructor(gameData) {
    this._id = gameData._id || null;
    this.name = gameData.name;
    this.developer = gameData.developer;
    this.publisher = gameData.publisher;
    this.positive = gameData.positive;
    this.negative = gameData.negative;
    this.owners = gameData.owners;
    this.price = gameData.price;
    this.initialPrice = gameData.initialPrice;
    this.discount = gameData.discount;
    this.languages = gameData.languages;
    this.genre = gameData.genre;
    this.ccu = gameData.ccu;
    this.tags = gameData.tags;
  }

  // Get game collection
  static getCollection() {
    return database.getCollection(process.env.MONGO_DB_GAME_COLLECTION);
  }

  // Find game by ID
  static async findById(id) {
    const collection = this.getCollection();
    const game = await collection.findOne({ _id: new ObjectId(id) });
    return game ? new Game(game) : null;
  }

  // Find game by name
  static async findByName(name) {
    const collection = this.getCollection();
    const games = await collection.find({ name }).toArray();
    return games.map((game) => new Game(game));
  }

  // New method for pagination
  static async findPaginated(page = 0, pageSize = 10, sortField = '_id', sortOrder = 1) {
    const collection = this.getCollection();
    
    // Ensure page and pageSize are numbers
    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);
    
    // Calculate number of documents to skip
    const skip = page * pageSize;
    
    // Create sort object
    const sort = {};
    sort[sortField] = sortOrder;
    
    // Get paginated results
    const games = await collection
      .find({})
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .toArray();
    
    // Get total count for pagination metadata
    const totalCount = await collection.countDocuments({});
    
    return {
      games: games.map(game => new Game(game)),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: skip + pageSize < totalCount,
        hasPrevPage: page > 0
      }
    };
  }

  /**
 * Search for games based on search term
 * @param {string} searchTerm - Term to search for in game name, developer, publisher, genre, and tags
 * @param {number} page - Page number (0-indexed)
 * @param {number} pageSize - Number of items per page
 * @param {string} sortField - Field to sort by
 * @param {number} sortOrder - Sort direction (1 for ascending, -1 for descending)
 * @returns {Promise<Object>} - Games and pagination metadata
 */
static async search(searchTerm, page = 0, pageSize = 10, sortField = '_id', sortOrder = 1) {
  const collection = this.getCollection();
  
  // Create a case-insensitive search query that looks in multiple fields
  const query = {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { developer: { $regex: searchTerm, $options: 'i' } },
      { publisher: { $regex: searchTerm, $options: 'i' } },
      { genre: { $regex: searchTerm, $options: 'i' } },
      { tags: { $regex: searchTerm, $options: 'i' } }
    ]
  };

  // Calculate documents to skip
  const skip = page * pageSize;
  
  // Create sort object
  const sort = {};
  sort[sortField] = sortOrder;
  
  // Get total count for pagination
  const totalCount = await collection.countDocuments(query);
  
  // Get paginated results
  const games = await collection
    .find(query)
    .sort(sort)
    .skip(skip)
    .limit(pageSize)
    .toArray();
  
  // Convert MongoDB documents to Game instances
  const gameInstances = games.map(game => new Game(game));
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;
  
  return {
    games: gameInstances.map(game => game.toJSON()),
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  };
}

  // Save game to database
  async save() {
    const collection = Game.getCollection();
    if (this._id) {
      // Update existing game
      const { _id, ...updateData } = this;
      await collection.updateOne(
        { _id: new ObjectId(_id) },
        { $set: updateData }
      );
      return this;
    } else {
      // Create new game
      const result = await collection.insertOne(this);
      this._id = result.insertedId;
      return this;
    }
  }
  
  toJSON() {
    return this;
  }
}

export default Game;

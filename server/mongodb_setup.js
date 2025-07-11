import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import { parse } from 'csv-parse';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * MongoDB Database Manager class
 * Handles database connection and operations using OOP principles
 */
class DatabaseManager {
  /**
   * Constructor for DatabaseManager
   * @param {string} url - MongoDB connection URL
   * @param {string} dbName - Database name
   */
  constructor(url, dbName) {
    this.url = url;
    this.dbName = dbName;
    this.client = null;
    this.db = null;
  }

  /**
   * Connect to MongoDB database
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      this.client = await MongoClient.connect(this.url);
      console.log("Connected to MongoDB server");
      this.db = this.client.db(this.dbName);
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  /**
   * Close the database connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client) {
      await this.client.close();
      console.log("Database connection closed");
    }
  }

  /**
   * Initialize database collections
   * @returns {Promise<void>}
   */
  async initializeCollections() {
    try {
      const collections = await this.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);

      // Create users collection if it doesn't exist
      if (!collectionNames.includes("users")) {
        await this.db.createCollection("users");
        console.log("Created users collection");
      }

      // Create games collection if it doesn't exist
      if (!collectionNames.includes("games")) {
        await this.db.createCollection("games");
        console.log("Created games collection");
      }

      // Create counters collection if it doesn't exist
      if (!collectionNames.includes("counters")) {
        await this.db.createCollection("counters");
        console.log("Created counters collection");
        
        // Initialize the game counter to start from 0
        const counters = this.db.collection("counters");
        await counters.insertOne({ _id: "gameId", sequence_value: 0 });
        console.log("Initialized game counter starting at 0");
      } else {
        // Check if gameId counter exists, create if not
        const counters = this.db.collection("counters");
        const gameCounter = await counters.findOne({ _id: "gameId" });
        if (!gameCounter) {
          await counters.insertOne({ _id: "gameId", sequence_value: 0 });
          console.log("Initialized game counter starting at 0");
        }
      }

      // Create indexes for better performance
      const users = this.db.collection("users");
      await users.createIndex({ "username": 1 }, { unique: true });
      await users.createIndex({ "refreshToken": 1 });

      const games = this.db.collection("games");
      await games.createIndex({ "_id": 1 });
      await games.createIndex({ "name": 1 });
      console.log("Created indexes on games collection");
    } catch (error) {
      console.error("Failed to initialize collections:", error);
      throw error;
    }
  }

  /**
   * Get the next sequence value for a counter
   * @param {string} counterName - Name of the counter
   * @returns {Promise<number>} - Next sequence value
   */
  async getNextSequence(counterName) {
    const counters = this.db.collection("counters");
    const result = await counters.findOneAndUpdate(
      { _id: counterName },
      { $inc: { sequence_value: 1 } },
      { returnDocument: 'before' }
    );
    return result.sequence_value;
  }

  /**
   * Import games from CSV file
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<void>}
   */
  async importGamesFromCSV(filePath) {
    try {
      console.log(`Importing games from CSV file: ${filePath}`);
      const gameData = await this.parseCSVFile(filePath);
      console.log(`Parsed ${gameData.length} games from CSV file`);
      
      if (gameData.length > 0) {
        const games = this.db.collection("games");
        
        // Insert games into the collection with sequential IDs from counter
        for (const game of gameData) {
          // Get next sequence value for game ID
          const gameId = await this.getNextSequence("gameId");
          
          // Use the counter value as the _id field
          game._id = gameId;
          
          // Insert the game with the counter as its ID
          await games.insertOne(game);
        }
        console.log(`Successfully imported ${gameData.length} games into the database`);
      }
    } catch (error) {
      console.error("Error importing games from CSV:", error);
      throw error;
    }
  }

  /**
   * Parse CSV file into game objects
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<Array>} - Array of game objects
   */
  async parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const games = [];
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
        .on('data', (row) => {
          // Process each row and extract only the fields used in Game.js
          const game = {
            name: row.name,
            developer: row.developer,
            publisher: row.publisher,
            positive: parseInt(row.positive, 10) || 0,
            negative: parseInt(row.negative, 10) || 0,
            owners: row.owners,
            price: parseInt(row.price, 10) || 0,
            initialPrice: parseInt(row.initialprice, 10) || 0,
            discount: parseInt(row.discount, 10) || 0,
            languages: row.languages.split(',').map(lang => lang.trim()),
            genre: row.genre,
            ccu: parseInt(row.ccu, 10) || 0,
            tags: this.parseTags(row.tags_json)
          };
          games.push(game);
        })
        .on('error', (error) => {
          reject(error);
        })
        .on('end', () => {
          resolve(games);
        });
    });
  }

  /**
   * Parse tags from string to object
   * @param {string} tagsString - JSON string of tags
   * @returns {Object} - Parsed tags object
   */
  parseTags(tagsString) {
    try {
      return JSON.parse(tagsString);
    } catch (error) {
      console.error("Failed to parse JSON string:", error);
      console.error("Problematic string:", tagsString);
      return {}; // Return empty object instead of throwing error for better resilience
    }
  }
}

/**
 * Main function to set up the database
 */
async function setupDatabase() {
  const dbManager = new DatabaseManager(
    process.env.MONGO_DB_URL,
    process.env.MONGO_DB
  );
  
  try {
    await dbManager.connect();
    await dbManager.initializeCollections();
    
    // Import games from CSV file if path is provided
    if (process.env.DATA_PATH) {
      const csvFilePath = path.resolve(process.env.DATA_PATH);
      await dbManager.importGamesFromCSV(csvFilePath);
    }
    
    console.log("Database setup complete!");
  } catch (error) {
    console.error("Database setup failed:", error);
  } finally {
    await dbManager.close();
  }
}

// Execute the setup function
setupDatabase();

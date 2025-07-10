import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB server
const mongoUrl = process.env.MONGO_DB_URL;

// Need to wrap in async function since top-level await isn't supported in all environments
async function setupDatabase() {
  try {
    // Connect to MongoDB server
    const client = await MongoClient.connect(mongoUrl);
    console.log("Connected to MongoDB server");
    
    // Define database name (should match your MONGO_DB env variable)
    const dbName = process.env.MONGO_DB;
    
    // Use or create the database
    const db = client.db(dbName);
    
    // Check if collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Create users collection if it doesn't exist
    if (!collectionNames.includes("users")) {
      await db.createCollection("users");
      console.log("Created users collection");
    }
    
    // Create games collection if it doesn't exist
    if (!collectionNames.includes("games")) {
      await db.createCollection("games");
      console.log("Created games collection");
    }
    
    // Create counters collection if it doesn't exist
    if (!collectionNames.includes("counters")) {
      await db.createCollection("counters");
      console.log("Created counters collection");
      
      // Initialize the game counter to start from 0
      const counters = db.collection("counters");
      await counters.insertOne({ _id: "gameId", sequence_value: 0 });
      console.log("Initialized game counter starting at 0");
    } else {
      // Check if gameId counter exists, create if not
      const counters = db.collection("counters");
      const gameCounter = await counters.findOne({ _id: "gameId" });
      if (!gameCounter) {
        await counters.insertOne({ _id: "gameId", sequence_value: 0 });
        console.log("Initialized game counter starting at 0");
      }
    }
    
    // Get reference to users collection
    const users = db.collection("users");
    
    // Create indexes for better performance
    await users.createIndex({ "username": 1 }, { unique: true });
    console.log("Created unique index on username field");
    
    await users.createIndex({ "refreshToken": 1 });
    console.log("Created index on refreshToken field");
    
    // Check for admin user
    const adminExists = await users.findOne({ role: "admin" });
    if (!adminExists) {
      console.log("No admin user found. You should create one using your application's registration endpoint.");
    }
    
    // Get reference to games collection
    const games = db.collection("games");
    
    // Create indexes for better performance
    await games.createIndex({ "name": 1 });
    console.log("Created index on name field");
    
    console.log("Database setup complete! ");
    
    // Close the connection when done
    await client.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Database setup failed:", error);
  }
}

// Execute the setup function
setupDatabase();

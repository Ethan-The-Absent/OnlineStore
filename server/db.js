import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Get the .env variables
dotenv.config();

// Mongo environment constants
const mongoUrl = process.env.MONGO_DB_URL;
const dbName = process.env.MONGO_DB;

class Database {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        if (this.db) return this.db;

        try {
            this.client = await MongoClient.connect(mongoUrl);
            this.db = this.client.db(dbName);
            console.log('Successfully connected to MongoDB');
            return this.db;
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    getCollection(collectionName) {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first');
        }
        return this.db.collection(collectionName);
    }

    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
            console.log('MongoDB connection closed')
        }
    }
}

// Create and export a singleton instance
const database = new Database();
export default database;
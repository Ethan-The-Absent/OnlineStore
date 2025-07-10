import { ObjectId } from 'mongodb';
import database from '../db.js';

class User {
  constructor(userData) {
    this._id = userData._id || null;
    this.username = userData.username;
    this.password = userData.password; // This should be already hashed before reaching here
    this.role = userData.role || 'user';
    this.createdAt = userData.createdAt || new Date();
    this.lastLogin = userData.lastLogin || null;
    this.refreshToken = userData.refreshToken || null;
  }

  // Get user collection
  static getCollection() {
    return database.getCollection(process.env.MONGO_DB_USER_COLLECTION);
  }

  // Find user by ID
  // id is a string
  static async findById(id) {
    const collection = this.getCollection();
    const user = await collection.findOne({ _id: ObjectId.createFromHexString(id) });
    return user ? new User(user) : null;
  }

  // Find user by username
  static async findByUsername(username) {
    const collection = this.getCollection();
    const user = await collection.findOne({ username });
    return user ? new User(user) : null;
  }

  // Find user by refresh token
  static async findByRefreshToken(refreshToken) {
    const collection = this.getCollection();
    const user = await collection.findOne({ refreshToken });
    return user ? new User(user) : null;
  }

  // Check if username exists
  static async usernameExists(username) {
    const collection = this.getCollection();
    const user = await collection.findOne({ username });
    return !!user;
  }

  // Save user to database
  async save() {
    const collection = User.getCollection();
    if (this._id) {
      // Update existing user
      const { _id, ...updateData } = this;
      await collection.updateOne(
        { _id: _id },
        { $set: updateData }
      );
      return this;
    } else {
      // Create new user
      const result = await collection.insertOne(this);
      this._id = result.insertedId;
      return this;
    }
  }

  // Update last login time
  async updateLastLogin() {
    this.lastLogin = new Date();
    return this.save();
  }

  // Update refresh token
  async setRefreshToken(token) {
    this.refreshToken = token;
    return this.save();
  }

  // Clear refresh token
  async clearRefreshToken() {
    this.refreshToken = null;
    return this.save();
  }

  // Convert to JSON (remove sensitive data)
  toJSON() {
    const { password, refreshToken, ...userWithoutSensitiveData } = this;
    return userWithoutSensitiveData;
  }
}

export default User;

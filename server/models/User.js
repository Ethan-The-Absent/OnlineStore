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

    /**
     * @type {Set<number>}
     */
    this.purchases = userData.purchases ?  new Set(userData.purchases) : new Set([]);

    /**
     * @type {Set<number>}
     */
    this.cart = userData.cart ?  new Set(userData.cart) : new Set([]);
  }

  // Get user collection
  static getCollection() {
    return database.getCollection(process.env.MONGO_DB_USER_COLLECTION);
  }

  // Find all users
  // Returns sanitized user info instead of all user info
  static async findAll() {
    const collection = this.getCollection();
    const users = await collection.find({}).toArray();
    return users.map(user => (new User(user)).minimalToJSON());
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
      updateData.cart = Array.from(this.cart)
      updateData.purchases = Array.from(this.purchases)

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

  // Add cart to purchases
  async addPurchasesFromCart() {
    this.purchases = this.purchases.union(this.cart);
    this.cart.clear()
    return this.save();
  }

  // Add game to cart
  // Removes game from cart if already purchased
  async addCartGame(gameId) {
    this.cart.add(gameId);
    this.cart = this.cartPurchaseDifference();
    return this.save();
  }

  // Remove game from cart
  async removeCartGame(gameId) {
    this.cart.delete(gameId)
    return this.save();
  }

  // Clear cart
  async clearCart() {
    this.cart.clear();
    return this.save();
  }

  // Creates a new cart with already purchased games removed
  cartPurchaseDifference() {
    return new Set([...this.cart].filter(x => !this.purchases.has(x)));
  }

  // Convert to JSON (remove sensitive data)
  toJSON() {
    const { password, refreshToken, ...userWithoutSensitiveData } = this;
    return userWithoutSensitiveData;
  }

  minimalToJSON() {
    const { _id, username, role, lastLogin } = this;
    return { _id, username, role, lastLogin };
  }
}

export default User;

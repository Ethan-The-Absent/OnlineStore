import { ObjectId } from 'mongodb';
import database from '../db.js';

class Order {
  constructor(orderData) {
    this._id = orderData._id || null;
    this.userId = orderData.userId;
    this.date = orderData.date || new Date();
    this.shipping = orderData.shipping;
    this.gameIds = orderData.gameIds;
    this.total = orderData.total;
  }

  // Get order collection
  static getCollection() {
    return database.getCollection(process.env.MONGO_DB_ORDER_COLLECTION);
  }

  // Find order by id
  static async findById(id) {
    const collection = this.getCollection();
    const order = await collection.findOne({ _id: ObjectId.createFromHexString(id) });
    return order ? new Order(order) : null;
  }

  // Find orders tied to user id
  static async findByUserId(userId) {
    const collection = this.getCollection();
    const orders = await collection.find({ userId: ObjectId.createFromHexString(userId)}).toArray();
    return orders.map(order => new Order(order));
  }

  // Save order to database
  async save() {
    const collection = Order.getCollection();
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

  // Convert to JSON
  toJSON() {
    return this;
  }
}

export default Order;
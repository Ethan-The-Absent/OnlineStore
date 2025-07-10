import express from 'express';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import cors from 'cors';
import database from './db.js';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';

// Get the .env variables
dotenv.config();
// Get secret env variables
dotenv.config({
  path: './.env.secret'
});

// Create main app
const app = express();
app.use(cors({
  credentials: true, // Used for refresh JWT cookie
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' // Allow requests from frontend
}));

app.use(cookieParser()); // Middleware to parse cookies for JWT
app.use(express.json()); // Middleware to parse JSON bodies
const PORT = process.env.PORT || 3000; // Port used to host the server

// Mount all API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Connect to MongoDB when server starts
(async () => {
  try {
    await database.connect();

    // Start server after successful connection
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await database.close();
  process.exit(0);
});

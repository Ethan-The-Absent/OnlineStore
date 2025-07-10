import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class AuthController {
  // Register a new user
  static async register(req, res) {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Check if username already exists
      const userExists = await User.usernameExists(username);
      if (userExists) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const user = new User({ username, password: hashedPassword });
      await user.save();

      // Return success without sending back the user object for security
      return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Find user by username
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Save refresh token to user
      await user.setRefreshToken(refreshToken);

      // Update last login time
      await user.updateLastLogin();

      // Calculate cookie expiry (convert JWT expiration string to milliseconds)
      const refreshExpiry = process.env.JWT_REFRESH_EXPIRATION.endsWith('d')
        ? parseInt(process.env.JWT_REFRESH_EXPIRATION) * 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000; // Default to 7 days if parsing fails

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: refreshExpiry,
        path: '/api/auth' // Restrict cookie to auth routes
      });

      // Send only access token in response body (for in-memory storage)
      return res.status(200).json({
        accessToken,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Refresh token
  static async refresh(req, res) {
    try {
      // Get refresh token from cookie instead of request body
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      // Find user by refresh token
      const user = await User.findByRefreshToken(refreshToken);
      if (!user) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      // Verify refresh token
      try {
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch (error) {
        await user.clearRefreshToken();
        // Clear the invalid cookie
        res.clearCookie('refreshToken', {
          httpOnly: true,
          sameSite: 'strict',
          path: '/api/auth'
        });
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      // Generate new tokens
      const accessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Update refresh token in database
      await user.setRefreshToken(newRefreshToken);

      // Calculate cookie expiry
      const refreshExpiry = process.env.JWT_REFRESH_EXPIRATION.endsWith('d')
        ? parseInt(process.env.JWT_REFRESH_EXPIRATION) * 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;

      // Set new refresh token as HTTP-only cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: refreshExpiry,
        path: '/api/auth'
      });

      // Send only access token in response body
      return res.status(200).json({ accessToken });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      // Get refresh token from cookie instead of request body
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      // Find user by refresh token
      const user = await User.findByRefreshToken(refreshToken);
      if (user) {
        // Clear refresh token in database
        await user.clearRefreshToken();
      }

      // Clear the refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'strict',
        path: '/api/auth'
      });

      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Generate access token
  static generateAccessToken(user) {
    return jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );
  }

  // Generate refresh token
  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRATION }
    );
  }
}

export default AuthController;

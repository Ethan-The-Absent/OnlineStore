import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to verify JWT access token
 * This should be used to protect routes that require authentication
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token is required' });
    }
    
    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach user to request object for use in protected routes
    req.user = {
      id: user._id,
      username: user.username,
      role: user.role || 'user' // Default to 'user' if role not specified
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has admin role
 * This should be used after verifyToken middleware
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Requires admin privileges' });
  }
  
  next();
};

/**
 * Middleware to check if user is accessing their own resource or is an admin
 * Useful for routes where users should only access their own data
 * Requires the route to have a userId parameter
 */
export const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Allow if admin or if the user is accessing their own resource
  if (req.user.role === 'admin' || req.user.id.toString() === req.params.userId) {
    next();
  } else {
    return res.status(403).json({ message: 'Unauthorized access' });
  }
};

export default {
    verifyToken,
    isAdmin,
    isOwnerOrAdmin,
  };
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const logger = require('../config/logger');

class AuthService {
  /**
   * Registers a new user.
   */
  async registerUser({ name, email, password, role }) {
    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('User already registered with this email');
      error.code = 'EMAIL_EXISTS';
      error.statusCode = 400;
      throw error;
    }

    const newUser = await UserRepository.create({
      name,
      email,
      password,
      role: role || 'customer'
    });

    logger.info(`AuthService: Registered new user [ID: ${newUser._id}, Role: ${newUser.role}]`);
    return this.sanitizeUser(newUser);
  }

  /**
   * Logs in a user, returns JWT and user profile.
   */
  async loginUser({ email, password }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.code = 'INVALID_CREDENTIALS';
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken(user._id, user.role);
    logger.info(`AuthService: User logged in [ID: ${user._id}, Role: ${user.role}]`);
    
    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Gets profile for a logged-in user.
   */
  async getUserProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      const error = new Error('User profile not found');
      error.code = 'USER_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }
    return this.sanitizeUser(user);
  }

  /**
   * Signs a JWT.
   */
  generateToken(userId, role) {
    const secret = process.env.JWT_SECRET || 'super_secret_restaurant_token_key';
    const expires = process.env.JWT_EXPIRES_IN || '7d';
    
    return jwt.sign({ id: userId, role }, secret, {
      expiresIn: expires
    });
  }

  /**
   * Sanitizes User object to omit sensitive fields.
   */
  sanitizeUser(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
  }
}

module.exports = new AuthService();

const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const logger = require('../config/logger');

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in cookies (preferred secure storage)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to authorization header Bearer token
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authorized to access this resource. Token missing.'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_restaurant_token_key');
    const user = await UserRepository.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The user belonging to this token no longer exists.'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn('AuthMiddleware: Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Not authorized. Token is invalid or expired.'
      }
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    logger.warn(`AuthMiddleware: Access denied to user ${req.user ? req.user.email : 'unknown'} - Admin role required.`);
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Administrator privileges required.'
      }
    });
  }
};

module.exports = {
  protect,
  adminOnly
};

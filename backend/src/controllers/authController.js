const AuthService = require('../services/AuthService');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [customer, admin]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or email already exists
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await AuthService.registerUser({ name, email, password, role });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user & get JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, cookie set
 *       401:
 *         description: Invalid credentials
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await AuthService.loginUser({ email, password });

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Clear cookies & logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      httpOnly: true,
      expires: new Date(Date.now() + 5000), // expires in 5s
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user profile
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns current user data
 *       401:
 *         description: Unauthorized
 */
const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getUserProfile(req.user._id);
    res.status(200).json({
      success: true,
      message: 'User profile retrieved',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe
};

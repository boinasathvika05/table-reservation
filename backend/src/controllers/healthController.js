const mongoose = require('mongoose');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verify application status
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Application is online and healthy
 *       503:
 *         description: Application is degraded
 */
const checkHealth = (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const uptime = process.uptime();
  const environment = process.env.NODE_ENV || 'development';

  if (isConnected) {
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      environment
    });
  } else {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected'
    });
  }
};

module.exports = {
  checkHealth
};

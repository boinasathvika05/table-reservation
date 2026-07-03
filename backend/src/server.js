const dotenv = require('dotenv');
const path = require('path');

// Load environment variables before importing app
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const { startScheduler } = require('./services/cron');

const PORT = process.env.PORT || 5000;
let server;

// Start Server Wrapper
const startServer = async () => {
  try {
    logger.info('✓ Environment loaded');

    // 1. Connect to Database
    await connectDB();

    // 2. Initialize Settings if not exist
    const SettingsRepository = require('./repositories/SettingsRepository');
    await SettingsRepository.getSettings();
    logger.info('✓ Restaurant Configurations Initialized');

    // 3. Initialize Background Cron Scheduler
    startScheduler();
    logger.info('✓ Cron Started');

    // 3. Start HTTP Listener
    server = app.listen(PORT, () => {
      logger.info('✓ Express Server Started');
      logger.info('✓ Swagger Ready');
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`Interactive API Docs available at http://localhost:${PORT}/api-docs`);
    });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down gracefully...', err);
      gracefulShutdown();
    });

    // Handle Uncaught Exceptions
    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION! Shutting down gracefully...', err);
      gracefulShutdown();
    });

  } catch (error) {
    logger.error('Server failed to start:', error);
    process.exit(1);
  }
};

// Graceful Shutdown Logic
const gracefulShutdown = () => {
  logger.info('Received shutdown signal. Starting graceful shutdown process...');
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      
      // Close Mongoose connection
      const mongoose = require('mongoose');
      mongoose.connection.close(false).then(() => {
        logger.info('Database connections closed. Exiting process.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

// Listen to System Signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();

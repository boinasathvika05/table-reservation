const mongoose = require('mongoose');
const logger = require('./logger');

const RETRY_DELAYS = [5000, 10000, 20000, 30000, 60000];
const MAX_ATTEMPTS = RETRY_DELAYS.length + 1;

const validateURI = (uri) => {
  if (!uri) {
    logger.error('Database configuration error: MONGO_URI is not configured in the environment variables.');
    return false;
  }
  
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    logger.error('Database configuration error: Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"');
    return false;
  }

  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    logger.error('Database configuration error: Connection string contains a placeholder like <db_password>. Please replace it with your actual database password.');
    return false;
  }

  if (uri.includes(' ')) {
    logger.error('Database configuration error: Connection string contains invalid space characters.');
    return false;
  }

  // Node's built-in URL parser fails on standard mongodb:// connection strings with multiple comma-separated hosts.
  // We will only run these checks if the URL can be parsed, otherwise we trust Mongoose to validate it.
  try {
    const url = new URL(uri);
    if (!url.hostname) {
      logger.error('Database configuration error: Invalid hostname in connection string.');
      return false;
    }
    if (url.username && !url.password) {
      logger.error('Database configuration error: Connection string specifies a username but is missing the password.');
      return false;
    }
    if (!url.pathname || url.pathname === '/') {
       logger.error('Database configuration error: Missing database name in connection string.');
       return false;
    }
  } catch (error) {
    logger.info('Note: Using a multi-host replica set URI which bypasses standard URL parsing validation. Delegating validation to Mongoose.');
  }

  return true;
};

const connectDB = async () => {
  logger.info(`Checking environment setup (NODE_ENV: ${process.env.NODE_ENV}, PORT: ${process.env.PORT})`);
  
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  
  if (!validateURI(uri)) {
    process.exit(1);
  }

  const maskedUri = uri.replace(/\/\/(.*):(.*)@/, '//***:***@');
  logger.info(`✓ Mongo URI validated. Connecting to: ${maskedUri}`);

  let parsedUrl;
  try {
    parsedUrl = new URL(uri);
  } catch(e) {}
  
  const host = parsedUrl ? parsedUrl.hostname : 'unknown';
  const dbName = parsedUrl && parsedUrl.pathname ? parsedUrl.pathname.substring(1) : 'unknown';

  logger.info(`\nTarget Host:\n${host}\nTarget Database:\n${dbName}\n`);

  // Enable verbose mongoose debugging
  mongoose.set('debug', true);
  logger.info('Verbose Mongoose query debugging enabled.');

  let attempts = 1;
  
  while (attempts <= MAX_ATTEMPTS) {
    try {
      logger.info(`Connecting to MongoDB... (Attempt ${attempts} of ${MAX_ATTEMPTS})`);
      
      const conn = await mongoose.connect(uri, {
        autoIndex: true,
      });
      
      logger.info('✓ MongoDB Connected Successfully!');
      logger.info(`✓ Connected Database: ${conn.connection.name}`);
      logger.info(`✓ Connected Host: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      logger.error(`\n=== MONGODB CONNECTION FAILURE (Attempt ${attempts}) ===`);
      logger.error(`Name: ${error.name}`);
      logger.error(`Message: ${error.message}`);
      logger.error(`Code: ${error.code}`);
      if (error.cause) logger.error(`Cause: ${error.cause}`);
      logger.error(`Stack: ${error.stack}`);
      logger.error('==================================================\n');

      const errMsg = error.message || String(error);
      
      logger.error('>>> DIAGNOSTIC ANALYSIS <<<');
      if (errMsg.includes('ECONNREFUSED') || errMsg.includes('ENOTFOUND')) {
        logger.error('Diagnosis: DNS Resolution or Network Connectivity Error.');
        logger.error('Action: Ensure the host is reachable from this exact machine (e.g., DNS is functioning, and no local firewall blocks outbound TCP connections).');
      } else if (errMsg.includes('bad auth') || errMsg.includes('Authentication failed')) {
         logger.error('Diagnosis: Authentication Error.');
         logger.error('Action: Check username and password for correctness, and ensure the user has privileges for this specific database.');
      } else if (errMsg.includes('IP') || errMsg.includes('whitelist')) {
         logger.error('Diagnosis: IP Whitelist Error.');
         logger.error('Action: Ensure this machine\'s public IP address is explicitly allowed in MongoDB Atlas Network Access settings.');
      } else if (errMsg.includes('SSL') || errMsg.includes('TLS')) {
         logger.error('Diagnosis: SSL/TLS Handshake Error.');
         logger.error('Action: Ensure the connection is securely established. Sometimes corporate networks or local antiviruses intercept SSL traffic.');
      } else {
        logger.error('Diagnosis: Unknown generic error. See stack trace above for details.');
      }
      
      if (attempts >= MAX_ATTEMPTS) {
        logger.error('\nMax database connection retries reached. Exiting cleanly.');
        process.exit(1);
      }
      
      const delay = RETRY_DELAYS[attempts - 1];
      logger.info(`\nRetrying database connection in ${delay / 1000}s...\n`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    }
  }
};

module.exports = connectDB;

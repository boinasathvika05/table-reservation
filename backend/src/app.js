const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS configuration (allowing cookie sharing via credentials)
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// 3. Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. Data sanitization against NoSQL injection
app.use(mongoSanitize());

// 5. Morgan Logging mapped to Winston stream
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// 6. Global API Rate Limiter
app.use('/api', apiLimiter);

// 7. Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const path = require('path');

// 8. Register Routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/settings', settingsRoutes);

// 9. API 404 handler (Any unknown /api route returns JSON)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.originalUrl} does not exist on this server.`
    }
  });
});

// 10. Serve static frontend assets in production
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// 11. React catch-all route (Any unknown frontend route returns index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// 12. Centralized Error Handler (Must be registered last)
app.use(errorHandler);

module.exports = app;

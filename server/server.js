const express = require('express');
const { createServer } = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import configurations
const connectDatabase = require('./config/database.js');
const { connectRedis } = require('./config/redis.js');
const { initializeSocket } = require('./config/socket.js');
const logger = require('./utils/logger.js');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler.js');

// Import routes
const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/user.routes.js');
const emergencyRoutes = require('./routes/emergency.routes.js');
const hospitalRoutes = require('./routes/hospital.routes.js');
const ambulanceRoutes = require('./routes/ambulance.routes.js');
const volunteerRoutes = require('./routes/volunteer.routes.js');
const donorRoutes = require('./routes/donor.routes.js');
const adminRoutes = require('./routes/admin.routes.js');

// Initialize Express app
const app = express();
const server = createServer(app);

// Port configuration
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// ============================================
// API ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HealthLink API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API version prefix
const API_PREFIX = '/api/v1';

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/emergency`, emergencyRoutes);
app.use(`${API_PREFIX}/hospitals`, hospitalRoutes);
app.use(`${API_PREFIX}/ambulances`, ambulanceRoutes);
app.use(`${API_PREFIX}/volunteers`, volunteerRoutes);
app.use(`${API_PREFIX}/donors`, donorRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use(errorHandler);

// ============================================
// DATABASE & SERVER INITIALIZATION
// ============================================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('MongoDB connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Initialize Socket.IO
    initializeSocket(server);
    logger.info('Socket.IO initialized');

    // Start HTTP server (bind to all interfaces so devices on the LAN can reach it)
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`
╔════════════════════════════════════════════════╗
║                                                ║
║     🏥 HealthLink Server Running              ║
║                                                ║
    ║     Environment: ${process.env.NODE_ENV?.toUpperCase().padEnd(29)}║
    ║     Port: ${PORT.toString().padEnd(38)}        ║
    ║     API: http://localhost:${PORT}${API_PREFIX.padEnd(17)}║
║                                                ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

// Start the server
startServer();

module.exports = app;

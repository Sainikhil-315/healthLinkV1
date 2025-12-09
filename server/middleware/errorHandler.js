const logger = require('../utils/logger.js');
const { SERVER_ERRORS, createError } = require('../utils/errorMessages.js');

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
function errorHandler (err, req, res, next) {
  // Log the error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.code || 'SERVER_001';

  // Handle specific error types
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VAL_001';
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: 'Validation error',
        errors
      }
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DB_001';
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
    
    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
        field
      }
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'VAL_008';
    message = `Invalid ${err.path}: ${err.value}`;
    
    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'AUTH_003';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'AUTH_004';
    message = 'Authentication token has expired';
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    errorCode = 'UPLOAD_001';
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum limit (5MB)';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else {
      message = 'File upload error';
    }
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    statusCode = 503;
    errorCode = 'SERVER_002';
    message = 'Database connection error';
  }

  // Rate limit errors
  if (err.status === 429) {
    statusCode = 429;
    errorCode = 'RATE_001';
    message = 'Too many requests. Please try again later';
  }

  // Development vs Production error response
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler - route not found
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'ROUTE_001';
  next(error);
};

/**
 * Async handler wrapper to catch async errors
 * Usage: asyncHandler(async (req, res) => { ... })
 */
function asyncHandler (fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(server) {
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', {
      message: err.message,
      stack: err.stack
    });

    // Close server gracefully
    server.close(() => {
      process.exit(1);
    });
  });
};

/**
 * Handle uncaught exceptions
 */
function handleUncaughtException() {
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
      message: err.message,
      stack: err.stack
    });

    process.exit(1);
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  handleUnhandledRejection,
  handleUncaughtException
};
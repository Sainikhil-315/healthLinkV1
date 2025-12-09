const multer = require('multer');
const path = require('path');
const { UPLOAD_ERRORS, createError } = require('../utils/errorMessages.js');
const logger = require('../utils/logger.js');

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter function
function fileFilter(req, file, cb) {
  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const allowedDocTypes = ['application/pdf'];
  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(UPLOAD_ERRORS.INVALID_FILE_TYPE), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

/**
 * Middleware for single file upload
 * @param {string} fieldName - Name of the file field
 */
function uploadSingle(fieldName) {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error('Multer error:', err);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json(createError(UPLOAD_ERRORS.FILE_TOO_LARGE));
        }
        
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        logger.error('Upload error:', err);
        return res.status(400).json(createError(UPLOAD_ERRORS.UPLOAD_FAILED));
      }
      
      next();
    });
  };
};

/**
 * Middleware for multiple file upload
 * @param {string} fieldName - Name of the file field
 * @param {number} maxCount - Maximum number of files
 */
function uploadMultiple(fieldName, maxCount = 5) {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error('Multer error:', err);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json(createError(UPLOAD_ERRORS.FILE_TOO_LARGE));
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Maximum ${maxCount} files allowed`
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        logger.error('Upload error:', err);
        return res.status(400).json(createError(UPLOAD_ERRORS.UPLOAD_FAILED));
      }
      
      next();
    });
  };
};

/**
 * Middleware for multiple fields with different file counts
 * @param {array} fields - Array of {name, maxCount} objects
 */
function uploadFields(fields) {
  return (req, res, next) => {
    const uploadMiddleware = upload.fields(fields);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error('Multer error:', err);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json(createError(UPLOAD_ERRORS.FILE_TOO_LARGE));
        }
        
        return res.status(400).json({
          success: false,
          message: err.message
        });
      } else if (err) {
        logger.error('Upload error:', err);
        return res.status(400).json(createError(UPLOAD_ERRORS.UPLOAD_FAILED));
      }
      
      next();
    });
  };
};

/**
 * Validate that a file was uploaded
 */
function requireFile(req, res, next) {
  if (!req.file) {
    return res.status(400).json(createError(UPLOAD_ERRORS.NO_FILE));
  }
  next();
};

/**
 * Validate that multiple files were uploaded
 * @param {number} minCount - Minimum number of files required
 */
function requireFiles(minCount = 1) {
  return (req, res, next) => {
    if (!req.files || req.files.length < minCount) {
      return res.status(400).json({
        success: false,
        message: `At least ${minCount} file(s) required`
      });
    }
    next();
  };
};

/**
 * Validate file type after upload
 * @param {string[]} allowedTypes - Array of allowed MIME types
 */
function validateFileType(allowedTypes) {
  return (req, res, next) => {
    if (!req.file) return next();
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json(createError(UPLOAD_ERRORS.INVALID_FILE_TYPE));
    }
    
    next();
  };
};

/**
 * Image only filter
 */
const imagesOnly = validateFileType(['image/jpeg', 'image/jpg', 'image/png']);

/**
 * PDF only filter
 */
const pdfOnly = validateFileType(['application/pdf']);

/**
 * Get file extension from mimetype
 * @param {string} mimetype - File mimetype
 * @returns {string} File extension
 */
function getFileExtension(mimetype) {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'application/pdf': 'pdf'
  };
  
  return extensions[mimetype] || 'bin';
};

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName);
  return `${timestamp}-${random}${extension}`;
};

/**
 * Convert file buffer to base64 (for Cloudinary upload)
 * @param {Buffer} buffer - File buffer
 * @returns {string} Base64 string
 */
function bufferToBase64(buffer) {
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  requireFile,
  requireFiles,
  validateFileType,
  imagesOnly,
  pdfOnly,
  getFileExtension,
  generateUniqueFilename,
  bufferToBase64
};
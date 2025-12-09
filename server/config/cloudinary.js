const { v2: cloudinary } = require('cloudinary');
const logger = require('../utils/logger.js');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Local file path or base64 string
 * @param {string} folder - Cloudinary folder name
 * @param {object} options - Additional upload options
 * @returns {Promise<object>} Upload result with URL
 */
async function uploadImage(filePath, folder = 'healthlink', options = {}) {
  try {
    const uploadOptions = {
      folder,
      resource_type: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto',
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    logger.info(`Image uploaded to Cloudinary: ${result.public_id}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Upload certificate/document
 * @param {string} filePath - Local file path
 * @param {string} userId - User ID for organization
 * @returns {Promise<object>} Upload result
 */
async function uploadCertificate(filePath, userId) {
  return uploadImage(filePath, `healthlink/certificates/${userId}`, {
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    max_file_size: 5000000 // 5MB
  });
};

/**
 * Upload emergency photo
 * @param {string} filePath - Local file path or base64
 * @param {string} incidentId - Incident ID
 * @returns {Promise<object>} Upload result
 */
async function uploadEmergencyPhoto(filePath, incidentId) {
  return uploadImage(filePath, `healthlink/emergencies/${incidentId}`, {
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' }
    ]
  });
};

/**
 * Upload profile picture
 * @param {string} filePath - Local file path
 * @param {string} userId - User ID
 * @returns {Promise<object>} Upload result
 */
async function uploadProfilePicture(filePath, userId) {
  return uploadImage(filePath, `healthlink/profiles/${userId}`, {
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' }
    ]
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      logger.info(`Image deleted from Cloudinary: ${publicId}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    return false;
  }
};

/**
 * Get optimized image URL
 * @param {string} publicId - Cloudinary public ID
 * @param {object} transformations - Image transformations
 * @returns {string} Optimized image URL
 */
function getOptimizedUrl(publicId, transformations = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    quality: 'auto:good',
    fetch_format: 'auto',
    ...transformations
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadCertificate,
  uploadEmergencyPhoto,
  uploadProfilePicture,
  deleteImage,
  getOptimizedUrl
};
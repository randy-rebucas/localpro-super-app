const cloudinary = require('cloudinary').v2;
const logger = require('./logger');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage configuration for different file types
const createStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: allowedFormats,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' }, // Limit image size
        { quality: 'auto' }, // Auto quality optimization
        { fetch_format: 'auto' } // Auto format selection
      ]
    }
  });
};

// Storage configurations for different modules
const storageConfigs = {
  // User profile images
  userProfiles: createStorage('localpro/users/profiles', ['jpg', 'jpeg', 'png']),

  // Marketplace product images
  marketplace: createStorage('localpro/marketplace', ['jpg', 'jpeg', 'png', 'gif']),

  // Academy course materials
  academy: createStorage('localpro/academy', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']),

  // Facility care images
  facilityCare: createStorage('localpro/facility-care', ['jpg', 'jpeg', 'png']),

  // Rental property images
  rentals: createStorage('localpro/rentals', ['jpg', 'jpeg', 'png', 'gif']),

  // Supply images
  supplies: createStorage('localpro/supplies', ['jpg', 'jpeg', 'png']),

  // Advertisement images
  ads: createStorage('localpro/ads', ['jpg', 'jpeg', 'png', 'gif']),

  // Trust verification documents
  trustVerification: createStorage('localpro/trust-verification', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']),

  // Communication attachments
  communication: createStorage('localpro/communication', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']),

  // Finance documents
  finance: createStorage('localpro/finance', ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']),

  // Analytics reports
  analytics: createStorage('localpro/analytics', ['pdf', 'xlsx', 'csv']),

  // LocalPro Plus premium content
  localproPlus: createStorage('localpro/plus', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'mp4', 'mp3']),

  // Job board files (logos, resumes)
  jobs: createStorage('localpro/jobs', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'])
};

// Create multer uploaders for each storage type
const uploaders = {};
Object.keys(storageConfigs).forEach(key => {
  uploaders[key] = multer({
    storage: storageConfigs[key],
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 5 // Maximum 5 files per upload
    },
    fileFilter: (req, file, cb) => {
      // Additional file validation can be added here
      cb(null, true);
    }
  });
});

// Utility functions
const cloudinaryUtils = {
  // Delete a file from Cloudinary
  deleteFile: async(publicId) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      logger.error('Error deleting file from Cloudinary:', error);
      throw error;
    }
  },

  // Get file info
  getFileInfo: async(publicId) => {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      logger.error('Error getting file info from Cloudinary:', error);
      throw error;
    }
  },

  // Transform image URL
  transformUrl: (publicId, transformations = {}) => {
    return cloudinary.url(publicId, transformations);
  },

  // Generate responsive image URLs
  generateResponsiveUrls: (publicId, widths = [320, 640, 1024, 1920]) => {
    return widths.map(width => ({
      width,
      url: cloudinary.url(publicId, { width, crop: 'scale', quality: 'auto' })
    }));
  }
};

module.exports = {
  cloudinary,
  uploaders,
  cloudinaryUtils,
  storageConfigs
};

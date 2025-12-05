const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage configuration for different file types
// Note: multer-storage-cloudinary v2.x uses factory function (no 'new') with flat options
const createStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']) => {
  return cloudinaryStorage({
    cloudinary: cloudinary,
    folder: folder,
    allowedFormats: allowedFormats,
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' }, // Limit image size
      { quality: 'auto' }, // Auto quality optimization
      { fetch_format: 'auto' } // Auto format selection
    ]
  });
};

// Create storage configuration for video files
const createVideoStorage = (folder, allowedFormats = ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv']) => {
  return cloudinaryStorage({
    cloudinary: cloudinary,
    folder: folder,
    allowedFormats: allowedFormats,
    params: {
      resource_type: 'video'
    },
    transformation: [
      { quality: 'auto' }, // Auto quality optimization
      { fetch_format: 'auto' } // Auto format selection
    ]
  });
};

// Storage configurations for different modules
const storageConfigs = {
  // User profile images
  userProfiles: createStorage('localpro/users/profiles', ['jpg', 'jpeg', 'png']),
  
  // Marketplace product images
  marketplace: createStorage('localpro/marketplace', ['jpg', 'jpeg', 'png', 'gif']),
  
  // Academy course materials (images, documents, thumbnails)
  academy: createStorage('localpro/academy', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']),
  
  // Academy course videos
  academyVideos: createVideoStorage('localpro/academy/videos', ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv', 'm4v', '3gp']),
  
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
  // Videos need larger file size limits
  const isVideoStorage = key.includes('Video') || key === 'academyVideos';
  const fileSizeLimit = isVideoStorage ? 500 * 1024 * 1024 : 10 * 1024 * 1024; // 500MB for videos, 10MB for others
  
  uploaders[key] = multer({ 
    storage: storageConfigs[key],
    limits: {
      fileSize: fileSizeLimit,
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
  deleteFile: async (publicId) => {
    try {
      const result = await cloudinary.v2.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      throw error;
    }
  },

  // Get file info
  getFileInfo: async (publicId) => {
    try {
      const result = await cloudinary.v2.api.resource(publicId);
      return result;
    } catch (error) {
      console.error('Error getting file info from Cloudinary:', error);
      throw error;
    }
  },

  // Transform image URL
  transformUrl: (publicId, transformations = {}) => {
    return cloudinary.v2.url(publicId, transformations);
  },

  // Generate responsive image URLs
  generateResponsiveUrls: (publicId, widths = [320, 640, 1024, 1920]) => {
    return widths.map(width => ({
      width,
      url: cloudinary.v2.url(publicId, { width, crop: 'scale', quality: 'auto' })
    }));
  }
};

module.exports = {
  cloudinary,
  uploaders,
  cloudinaryUtils,
  storageConfigs
};

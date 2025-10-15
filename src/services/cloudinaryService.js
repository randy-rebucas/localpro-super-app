const cloudinary = require('cloudinary').v2;

class CloudinaryService {
  constructor() {
    this.cloudinary = cloudinary;
    this.initialize();
  }

  /**
   * Initialize Cloudinary configuration
   */
  initialize() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload a single file to Cloudinary
   * @param {Object} file - File object from multer
   * @param {string} folder - Folder path in Cloudinary
   * @param {Object} options - Additional upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, folder = 'localpro', options = {}) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      const uploadOptions = {
        folder: folder,
        resource_type: 'auto',
        ...options
      };

      const result = await cloudinary.uploader.upload(file.path, uploadOptions);

      return {
        success: true,
        data: {
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          created_at: result.created_at
        }
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload multiple files to Cloudinary
   * @param {Array} files - Array of file objects from multer
   * @param {string} folder - Folder path in Cloudinary
   * @param {Object} options - Additional upload options
   * @returns {Promise<Object>} Upload results
   */
  async uploadMultipleFiles(files, folder = 'localpro', options = {}) {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files provided');
      }

      const uploadPromises = files.map(file => this.uploadFile(file, folder, options));
      const results = await Promise.all(uploadPromises);

      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);

      return {
        success: failed.length === 0,
        data: successful.map(result => result.data),
        errors: failed.map(result => result.error),
        total: files.length,
        successful: successful.length,
        failed: failed.length
      };
    } catch (error) {
      console.error('Cloudinary multiple upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a file from Cloudinary
   * @param {string} publicId - Public ID of the file to delete
   * @param {Object} options - Additional delete options
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(publicId, options = {}) {
    try {
      if (!publicId) {
        throw new Error('No public ID provided');
      }

      const result = await cloudinary.uploader.destroy(publicId, options);

      return {
        success: result.result === 'ok',
        data: result
      };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete multiple files from Cloudinary
   * @param {Array} publicIds - Array of public IDs to delete
   * @param {Object} options - Additional delete options
   * @returns {Promise<Object>} Delete results
   */
  async deleteMultipleFiles(publicIds, options = {}) {
    try {
      if (!publicIds || publicIds.length === 0) {
        throw new Error('No public IDs provided');
      }

      const deletePromises = publicIds.map(publicId => this.deleteFile(publicId, options));
      const results = await Promise.all(deletePromises);

      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);

      return {
        success: failed.length === 0,
        data: successful.map(result => result.data),
        errors: failed.map(result => result.error),
        total: publicIds.length,
        successful: successful.length,
        failed: failed.length
      };
    } catch (error) {
      console.error('Cloudinary multiple delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get file information from Cloudinary
   * @param {string} publicId - Public ID of the file
   * @returns {Promise<Object>} File information
   */
  async getFileInfo(publicId) {
    try {
      if (!publicId) {
        throw new Error('No public ID provided');
      }

      const result = await cloudinary.api.resource(publicId);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Cloudinary get file info error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate optimized URL for an image
   * @param {string} publicId - Public ID of the image
   * @param {string} transformation - Transformation type
   * @param {Object} options - Additional transformation options
   * @returns {string} Optimized URL
   */
  getOptimizedUrl(publicId, transformation = 'default', options = {}) {
    if (!publicId) {
      return null;
    }

    const transformations = {
      thumbnail: { width: 150, height: 150, crop: 'fill', quality: 'auto' },
      small: { width: 300, height: 300, crop: 'limit', quality: 'auto' },
      medium: { width: 600, height: 600, crop: 'limit', quality: 'auto' },
      large: { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      avatar: { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' },
      default: { quality: 'auto', fetch_format: 'auto' }
    };

    const transformationOptions = transformations[transformation] || transformations.default;
    const finalOptions = { ...transformationOptions, ...options };

    return cloudinary.url(publicId, finalOptions);
  }

  /**
   * Generate responsive image URLs
   * @param {string} publicId - Public ID of the image
   * @param {Array} widths - Array of widths for responsive images
   * @returns {Array} Array of responsive URLs
   */
  generateResponsiveUrls(publicId, widths = [320, 640, 1024, 1920]) {
    if (!publicId) {
      return [];
    }

    return widths.map(width => ({
      width,
      url: cloudinary.url(publicId, {
        width,
        crop: 'scale',
        quality: 'auto',
        fetch_format: 'auto'
      })
    }));
  }

  /**
   * Transform an existing image
   * @param {string} publicId - Public ID of the image
   * @param {Object} transformations - Transformation options
   * @returns {string} Transformed image URL
   */
  transformImage(publicId, transformations = {}) {
    if (!publicId) {
      return null;
    }

    return cloudinary.url(publicId, transformations);
  }

  /**
   * Create a video thumbnail
   * @param {string} publicId - Public ID of the video
   * @param {Object} options - Thumbnail options
   * @returns {string} Thumbnail URL
   */
  createVideoThumbnail(publicId, options = {}) {
    if (!publicId) {
      return null;
    }

    const defaultOptions = {
      width: 300,
      height: 200,
      crop: 'fill',
      quality: 'auto'
    };

    return cloudinary.url(publicId, { ...defaultOptions, ...options });
  }

  /**
   * Upload file from URL
   * @param {string} url - URL of the file to upload
   * @param {string} folder - Folder path in Cloudinary
   * @param {Object} options - Additional upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFromUrl(url, folder = 'localpro', options = {}) {
    try {
      if (!url) {
        throw new Error('No URL provided');
      }

      const uploadOptions = {
        folder: folder,
        resource_type: 'auto',
        ...options
      };

      const result = await cloudinary.uploader.upload(url, uploadOptions);

      return {
        success: true,
        data: {
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          created_at: result.created_at
        }
      };
    } catch (error) {
      console.error('Cloudinary upload from URL error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search for files in Cloudinary
   * @param {Object} searchOptions - Search criteria
   * @returns {Promise<Object>} Search results
   */
  async searchFiles(searchOptions = {}) {
    try {
      const result = await cloudinary.search
        .expression(searchOptions.expression || '')
        .sort_by(searchOptions.sortBy || 'created_at')
        .max_results(searchOptions.maxResults || 10)
        .execute();

      return {
        success: true,
        data: result.resources,
        total: result.total_count
      };
    } catch (error) {
      console.error('Cloudinary search error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a folder in Cloudinary
   * @param {string} folderName - Name of the folder
   * @returns {Promise<Object>} Creation result
   */
  async createFolder(folderName) {
    try {
      if (!folderName) {
        throw new Error('No folder name provided');
      }

      // Cloudinary doesn't have a direct folder creation API
      // Folders are created automatically when files are uploaded to them
      return {
        success: true,
        message: 'Folder will be created when files are uploaded to it'
      };
    } catch (error) {
      console.error('Cloudinary create folder error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats() {
    try {
      const result = await cloudinary.api.usage();

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Cloudinary usage stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CloudinaryService();
const { cloudinary, cloudinaryUtils } = require('../config/cloudinary');

class CloudinaryService {
  /**
   * Upload a single file to Cloudinary
   * @param {Object} file - Multer file object
   * @param {string} folder - Cloudinary folder path
   * @param {Object} options - Additional upload options
   * @returns {Promise<Object>} Upload result
   */
  static async uploadFile(file, folder = 'localpro/uploads', options = {}) {
    try {
      const uploadOptions = {
        folder,
        resource_type: 'auto', // Auto-detect file type
        quality: 'auto',
        fetch_format: 'auto',
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
   * @param {Array} files - Array of multer file objects
   * @param {string} folder - Cloudinary folder path
   * @param {Object} options - Additional upload options
   * @returns {Promise<Array>} Array of upload results
   */
  static async uploadMultipleFiles(files, folder = 'localpro/uploads', options = {}) {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, folder, options));
      const results = await Promise.all(uploadPromises);
      
      return {
        success: true,
        data: results.map(result => result.data).filter(Boolean),
        errors: results.filter(result => !result.success).map(result => result.error)
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
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteFile(publicId) {
    try {
      const result = await cloudinaryUtils.deleteFile(publicId);
      return {
        success: true,
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
   * @param {Array} publicIds - Array of Cloudinary public IDs
   * @returns {Promise<Object>} Deletion results
   */
  static async deleteMultipleFiles(publicIds) {
    try {
      const deletePromises = publicIds.map(publicId => this.deleteFile(publicId));
      const results = await Promise.all(deletePromises);
      
      return {
        success: true,
        data: results.map(result => result.data).filter(Boolean),
        errors: results.filter(result => !result.success).map(result => result.error)
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
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} File information
   */
  static async getFileInfo(publicId) {
    try {
      const result = await cloudinaryUtils.getFileInfo(publicId);
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
   * Generate transformed image URL
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} transformations - Image transformations
   * @returns {string} Transformed URL
   */
  static getTransformedUrl(publicId, transformations = {}) {
    return cloudinaryUtils.transformUrl(publicId, transformations);
  }

  /**
   * Generate responsive image URLs
   * @param {string} publicId - Cloudinary public ID
   * @param {Array} widths - Array of widths for responsive images
   * @returns {Array} Array of responsive URLs
   */
  static getResponsiveUrls(publicId, widths = [320, 640, 1024, 1920]) {
    return cloudinaryUtils.generateResponsiveUrls(publicId, widths);
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} url - Cloudinary URL
   * @returns {string} Public ID
   */
  static extractPublicId(url) {
    try {
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      return filename.split('.')[0];
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }

  /**
   * Validate file type
   * @param {string} mimetype - File MIME type
   * @param {Array} allowedTypes - Allowed MIME types
   * @returns {boolean} Whether file type is allowed
   */
  static validateFileType(mimetype, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']) {
    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file size
   * @param {number} size - File size in bytes
   * @param {number} maxSize - Maximum file size in bytes
   * @returns {boolean} Whether file size is valid
   */
  static validateFileSize(size, maxSize = 10 * 1024 * 1024) { // 10MB default
    return size <= maxSize;
  }

  /**
   * Get optimized image URL for different use cases
   * @param {string} publicId - Cloudinary public ID
   * @param {string} useCase - Use case (thumbnail, medium, large, original)
   * @returns {string} Optimized URL
   */
  static getOptimizedUrl(publicId, useCase = 'medium') {
    const transformations = {
      thumbnail: { width: 150, height: 150, crop: 'fill', quality: 'auto' },
      small: { width: 300, height: 300, crop: 'limit', quality: 'auto' },
      medium: { width: 600, height: 600, crop: 'limit', quality: 'auto' },
      large: { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      original: { quality: 'auto' }
    };

    return this.getTransformedUrl(publicId, transformations[useCase] || transformations.medium);
  }
}

module.exports = CloudinaryService;

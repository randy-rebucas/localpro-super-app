// Utility helper functions

/**
 * Generate a random string of specified length
 * @param {number} length - Length of the string to generate
 * @returns {string} Random string
 */
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Calculate distance between two coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Generate a unique order number
 * @returns {string} Unique order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

/**
 * Generate a unique booking reference
 * @returns {string} Unique booking reference
 */
const generateBookingReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BK-${timestamp}-${random}`.toUpperCase();
};

/**
 * Calculate loan EMI (Equated Monthly Installment)
 * @param {number} principal - Loan amount
 * @param {number} rate - Annual interest rate (percentage)
 * @param {number} tenure - Loan tenure in months
 * @returns {number} Monthly EMI amount
 */
const calculateEMI = (principal, rate, tenure) => {
  const monthlyRate = rate / (12 * 100);
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
              (Math.pow(1 + monthlyRate, tenure) - 1);
  return Math.round(emi * 100) / 100;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Generate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Pagination metadata
 */
const getPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Calculate rating average
 * @param {Array} ratings - Array of rating objects
 * @returns {object} Rating statistics
 */
const calculateRatingStats = (ratings) => {
  if (!ratings || ratings.length === 0) {
    return { average: 0, count: 0, breakdown: {} };
  }

  const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
  const average = total / ratings.length;
  const breakdown = ratings.reduce((acc, rating) => {
    acc[rating.rating] = (acc[rating.rating] || 0) + 1;
    return acc;
  }, {});

  return {
    average: Math.round(average * 10) / 10,
    count: ratings.length,
    breakdown
  };
};

/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @param {string} locale - Locale string (default: en-US)
 * @returns {string} Formatted date string
 */
const formatDate = (date, locale = 'en-US') => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

/**
 * Check if date is within business hours
 * @param {Date} date - Date to check
 * @param {string} timezone - Timezone (default: UTC)
 * @returns {boolean} True if within business hours
 */
const isBusinessHours = (date, _timezone = 'UTC') => {
  const hour = new Date(date).getHours();
  return hour >= 9 && hour <= 17; // 9 AM to 5 PM
};

module.exports = {
  generateRandomString,
  formatCurrency,
  calculateDistance,
  generateOrderNumber,
  generateBookingReference,
  calculateEMI,
  isValidEmail,
  isValidPhone,
  sanitizeInput,
  getPaginationMeta,
  calculateRatingStats,
  formatDate,
  isBusinessHours
};

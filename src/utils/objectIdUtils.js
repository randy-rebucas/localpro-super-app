/**
 * Utility functions for handling ObjectId validation and cleanup
 */

const mongoose = require('mongoose');

/**
 * Clean up empty string values for ObjectId fields in update data
 * @param {Object} data - The data object to clean
 * @param {Array} objectIdFields - Array of field paths that should be ObjectIds
 * @returns {Object} - Cleaned data object
 */
const cleanObjectIdFields = (data, objectIdFields = []) => {
  const cleaned = { ...data };
  
  // Default ObjectId fields in User model
  const defaultObjectIdFields = [
    'agency.agencyId',
    'referredBy',
    'settings',
    'statusUpdatedBy',
    'deletedBy',
    'localProPlusSubscription'
  ];
  
  const fieldsToCheck = [...defaultObjectIdFields, ...objectIdFields];
  
  fieldsToCheck.forEach(fieldPath => {
    const value = getNestedValue(cleaned, fieldPath);
    if (value === '' || value === null || value === undefined) {
      removeNestedField(cleaned, fieldPath);
    }
  });
  
  return cleaned;
};

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - The object to get value from
 * @param {string} path - The dot notation path
 * @returns {*} - The value at the path
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

/**
 * Remove nested field from object using dot notation
 * @param {Object} obj - The object to remove field from
 * @param {string} path - The dot notation path
 */
const removeNestedField = (obj, path) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  
  if (keys.length === 0) {
    delete obj[lastKey];
  } else {
    delete target[lastKey];
    // Clean up empty nested objects
    if (Object.keys(target).length === 0 && keys.length > 0) {
      const parent = keys.reduce((current, key) => current[key], obj);
      delete parent[keys[keys.length - 1]];
    }
  }
};

/**
 * Validate if a string is a valid ObjectId
 * @param {string} id - The string to validate
 * @returns {boolean} - True if valid ObjectId
 */
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate ObjectId fields in data object
 * @param {Object} data - The data object to validate
 * @param {Array} objectIdFields - Array of field paths that should be ObjectIds
 * @returns {Object} - Validation result with isValid and errors
 */
const validateObjectIdFields = (data, objectIdFields = []) => {
  const errors = [];
  
  objectIdFields.forEach(fieldPath => {
    const value = getNestedValue(data, fieldPath);
    if (value && !isValidObjectId(value)) {
      errors.push(`Invalid ObjectId format for field: ${fieldPath}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  cleanObjectIdFields,
  getNestedValue,
  removeNestedField,
  isValidObjectId,
  validateObjectIdFields
};

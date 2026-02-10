const Joi = require('joi');

// User validation schemas
// Note: phoneNumber is enforced as unique at the database level (User model)
// This ensures all mobile phone numbers are unique across the entire system
const phoneNumberSchema = Joi.string()
  .pattern(/^\+[1-9]\d{4,14}$/)
  .required()
  .messages({
    'string.pattern.base': 'Phone number must be in international format (+1234567890)'
  });

const emailSchema = Joi.string()
  .email()
  .optional()
  .messages({
    'string.email': 'Please provide a valid email address'
  });

// Auth validation schemas
const sendCodeSchema = Joi.object({
  phoneNumber: phoneNumberSchema
});

const verifyCodeSchema = Joi.object({
  phoneNumber: phoneNumberSchema,
  code: Joi.string().length(6).pattern(/^\d{6}$/).required(),
  firstName: Joi.string().min(2).max(50).when('$isNewUser', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  lastName: Joi.string().min(2).max(50).when('$isNewUser', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  email: emailSchema
});

// Marketplace validation schemas
const serviceSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(20).max(1000).required(),
  category: Joi.string().valid('cleaning', 'plumbing', 'electrical', 'moving', 'other').required(),
  subcategory: Joi.string().min(2).max(50).required(),
  pricing: Joi.object({
    type: Joi.string().valid('hourly', 'fixed', 'per_sqft', 'per_item').required(),
    basePrice: Joi.number().positive().required(),
    currency: Joi.string().default('USD')
  }).required(),
  serviceArea: Joi.array().items(Joi.string()).min(1).required(),
  features: Joi.array().items(Joi.string()).optional(),
  requirements: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(Joi.string().uri()).optional()
});

const bookingSchema = Joi.object({
  serviceId: Joi.string().hex().length(24).required(),
  providerId: Joi.string().hex().length(24).optional(),
  bookingDate: Joi.string().isoDate().required()
    .messages({
      'string.isoDate': 'Booking date must be in ISO 8601 format (YYYY-MM-DD)'
    }),
  bookingTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()
    .messages({
      'string.pattern.base': 'Booking time must be in HH:MM format (e.g., 14:30)'
    }),
  duration: Joi.number().positive().required()
    .messages({
      'number.positive': 'Duration must be a positive number (in hours)'
    }),
  paymentMethod: Joi.string().valid('cash', 'card', 'bank_transfer', 'paypal', 'paymaya', 'paymongo', 'gcash', 'wallet').optional(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().default('Philippines'),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).optional(),
      lng: Joi.number().min(-180).max(180).optional()
    }).optional()
  }).optional(),
  specialInstructions: Joi.string().max(1000).optional()
    .messages({
      'string.max': 'Special instructions cannot exceed 1000 characters'
    })
});

// Supplies validation schemas (delegated to feature module)
const { productSchema } = require('../../features/supplies/validators/suppliesValidator');

// Finance validation schemas
const loanApplicationSchema = Joi.object({
  type: Joi.string().valid('salary_advance', 'micro_loan', 'business_loan', 'equipment_loan').required(),
  amount: Joi.number().positive().max(100000).required(),
  purpose: Joi.string().min(10).max(200).required(),
  term: Joi.object({
    duration: Joi.number().min(1).max(60).required(), // months
    interestRate: Joi.number().min(0).max(50).required(), // percentage
    repaymentFrequency: Joi.string().valid('weekly', 'bi-weekly', 'monthly').default('monthly')
  }).required(),
  documents: Joi.array().items(Joi.object({
    type: Joi.string().valid('income_proof', 'bank_statement', 'id_document', 'business_license', 'other').required(),
    url: Joi.string().uri().required()
  })).optional()
});

// Validate MongoDB ObjectId format
const validateObjectId = (id) => {
  return !!(id && id.match(/^[0-9a-fA-F]{24}$/));
};

/**
 * Check if a phone number already exists in the system
 * This is a helper function to check uniqueness before database operations
 * Note: The User model enforces uniqueness at the database level, but this
 * can be used for early validation and better error messages
 * @param {string} phoneNumber - Phone number to check
 * @param {Object} UserModel - Mongoose User model
 * @param {string} excludeUserId - Optional user ID to exclude from check (for updates)
 * @returns {Promise<boolean>} - True if phone number exists, false otherwise
 */
const checkPhoneNumberExists = async (phoneNumber, UserModel, excludeUserId = null) => {
  if (!phoneNumber || !UserModel) return false;
  
  const query = { phoneNumber };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  
  const existingUser = await UserModel.findOne(query);
  return !!existingUser;
};

// Middleware to validate ObjectId in params
const validateObjectIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    next();
  };
};

// Validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessage
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  sendCodeSchema,
  verifyCodeSchema,
  serviceSchema,
  bookingSchema,
  productSchema,
  loanApplicationSchema,
  phoneNumberSchema,
  validateObjectId,
  validateObjectIdParam,
  validate,
  checkPhoneNumberExists
};
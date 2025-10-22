const Joi = require('joi');

// User validation schemas
const phoneNumberSchema = Joi.string()
  .pattern(/^\+[1-9]\d{1,14}$/)
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
  code: Joi.string().length(6).required(),
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
  bookingDate: Joi.date().greater('now').required(),
  duration: Joi.number().positive().required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required()
  }).required(),
  specialInstructions: Joi.string().max(500).optional()
});

// Supplies validation schemas
const productSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(500).required(),
  category: Joi.string().valid('cleaning_supplies', 'tools', 'materials', 'equipment').required(),
  subcategory: Joi.string().min(2).max(50).required(),
  brand: Joi.string().min(2).max(50).required(),
  sku: Joi.string().min(3).max(50).required(),
  pricing: Joi.object({
    retailPrice: Joi.number().positive().required(),
    wholesalePrice: Joi.number().positive().optional(),
    currency: Joi.string().default('USD')
  }).required(),
  inventory: Joi.object({
    quantity: Joi.number().min(0).required(),
    minStock: Joi.number().min(0).default(10),
    maxStock: Joi.number().min(0).optional(),
    location: Joi.string().optional()
  }).required(),
  specifications: Joi.object({
    weight: Joi.string().optional(),
    dimensions: Joi.string().optional(),
    material: Joi.string().optional(),
    color: Joi.string().optional(),
    warranty: Joi.string().optional()
  }).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isSubscriptionEligible: Joi.boolean().default(false)
});

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
  return id && id.match(/^[0-9a-fA-F]{24}$/);
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
  validateObjectId,
  validateObjectIdParam,
  validate
};
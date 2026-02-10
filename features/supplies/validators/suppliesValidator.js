const Joi = require('joi');

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

module.exports = {
  productSchema
};

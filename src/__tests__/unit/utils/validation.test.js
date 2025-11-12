const Joi = require('joi');
const {
  sendCodeSchema,
  verifyCodeSchema,
  serviceSchema,
  bookingSchema,
  productSchema,
  loanApplicationSchema,
  validateObjectId,
  validateObjectIdParam,
  validate
} = require('../../../utils/validation');

describe('Validation Utility', () => {
  describe('validateObjectId', () => {
    test('should validate correct ObjectId format', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(validateObjectId(validId)).toBe(true);
    });

    test('should reject invalid ObjectId format', () => {
      expect(validateObjectId('invalid')).toBe(false);
      expect(validateObjectId('123')).toBe(false);
      expect(validateObjectId('')).toBe(false);
      expect(validateObjectId(null)).toBe(false);
    });

    test('should accept uppercase hex characters', () => {
      const validId = '507F1F77BCF86CD799439011';
      expect(validateObjectId(validId)).toBe(true);
    });
  });

  describe('validateObjectIdParam middleware', () => {
    test('should call next() for valid ObjectId', () => {
      const req = { params: { id: '507f1f77bcf86cd799439011' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateObjectIdParam('id')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid ObjectId', () => {
      const req = { params: { id: 'invalid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateObjectIdParam('id')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validate middleware', () => {
    test('should call next() for valid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });

      const req = {
        body: { name: 'John', age: 30 }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body.name).toBe('John');
    });

    test('should return 400 for invalid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required()
      });

      const req = {
        body: { name: 'John' } // Missing age
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should validate query parameters', () => {
      const schema = Joi.object({
        page: Joi.number().required()
      });

      const req = {
        query: { page: 1 }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validate(schema, 'query')(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('sendCodeSchema', () => {
    test('should validate correct phone number', () => {
      const { error } = sendCodeSchema.validate({
        phoneNumber: '+1234567890'
      });
      expect(error).toBeUndefined();
    });

    test('should reject invalid phone number', () => {
      const { error } = sendCodeSchema.validate({
        phoneNumber: '1234567890'
      });
      expect(error).toBeDefined();
    });
  });

  describe('verifyCodeSchema', () => {
    test('should validate correct verification data', () => {
      const { error } = verifyCodeSchema.validate({
        phoneNumber: '+1234567890',
        code: '123456'
      });
      expect(error).toBeUndefined();
    });

    test('should reject invalid code format', () => {
      const { error } = verifyCodeSchema.validate({
        phoneNumber: '+1234567890',
        code: '12345' // Too short
      });
      expect(error).toBeDefined();
    });
  });

  describe('serviceSchema', () => {
    test('should validate correct service data', () => {
      const serviceData = {
        title: 'Home Cleaning Service',
        description: 'Professional home cleaning service with attention to detail',
        category: 'cleaning',
        subcategory: 'deep_cleaning',
        pricing: {
          type: 'fixed',
          basePrice: 100,
          currency: 'USD'
        },
        serviceArea: ['New York', 'Brooklyn']
      };

      const { error } = serviceSchema.validate(serviceData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid category', () => {
      const serviceData = {
        title: 'Service',
        description: 'Description',
        category: 'invalid_category',
        subcategory: 'sub',
        pricing: {
          type: 'fixed',
          basePrice: 100
        },
        serviceArea: ['Area']
      };

      const { error } = serviceSchema.validate(serviceData);
      expect(error).toBeDefined();
    });
  });

  describe('bookingSchema', () => {
    test('should validate correct booking data', () => {
      const bookingData = {
        serviceId: '507f1f77bcf86cd799439011',
        bookingDate: new Date(Date.now() + 86400000), // Tomorrow
        duration: 2,
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      };

      const { error } = bookingSchema.validate(bookingData);
      expect(error).toBeUndefined();
    });

    test('should reject past booking date', () => {
      const bookingData = {
        serviceId: '507f1f77bcf86cd799439011',
        bookingDate: new Date(Date.now() - 86400000), // Yesterday
        duration: 2,
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      };

      const { error } = bookingSchema.validate(bookingData);
      expect(error).toBeDefined();
    });
  });

  describe('productSchema', () => {
    test('should validate correct product data', () => {
      const productData = {
        name: 'Cleaning Supplies Kit',
        description: 'Complete cleaning supplies kit for home use',
        category: 'cleaning_supplies',
        subcategory: 'kit',
        brand: 'Brand Name',
        sku: 'SKU123',
        pricing: {
          retailPrice: 50
        },
        inventory: {
          quantity: 100,
          minStock: 10
        }
      };

      const { error } = productSchema.validate(productData);
      expect(error).toBeUndefined();
    });
  });

  describe('loanApplicationSchema', () => {
    test('should validate correct loan application data', () => {
      const loanData = {
        type: 'salary_advance',
        amount: 5000,
        purpose: 'Emergency expenses for medical bills',
        term: {
          duration: 12,
          interestRate: 5,
          repaymentFrequency: 'monthly'
        }
      };

      const { error } = loanApplicationSchema.validate(loanData);
      expect(error).toBeUndefined();
    });

    test('should reject amount exceeding maximum', () => {
      const loanData = {
        type: 'salary_advance',
        amount: 200000, // Exceeds max of 100000
        purpose: 'Purpose',
        term: {
          duration: 12,
          interestRate: 5
        }
      };

      const { error } = loanApplicationSchema.validate(loanData);
      expect(error).toBeDefined();
    });
  });
});


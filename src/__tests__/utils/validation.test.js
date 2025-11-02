/**
 * Tests for validation.js utility
 */

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
} = require('../../utils/validation');

describe('Validation Utilities', () => {
  describe('validateObjectId', () => {
    it('should validate correct ObjectId format', () => {
      expect(validateObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(validateObjectId('507F1F77BCF86CD799439011')).toBe(true); // Case insensitive
    });

    it('should reject invalid ObjectId format', () => {
      expect(validateObjectId('invalid')).toBe(false);
      expect(validateObjectId('507f1f77bcf86cd79943901')).toBe(false); // Too short
      expect(validateObjectId('507f1f77bcf86cd7994390111')).toBe(false); // Too long
      expect(validateObjectId('')).toBe(false);
      expect(validateObjectId(null)).toBe(false);
      expect(validateObjectId(undefined)).toBe(false);
    });
  });

  describe('validateObjectIdParam middleware', () => {
    it('should pass valid ObjectId', () => {
      const req = { params: { id: '507f1f77bcf86cd799439011' } };
      const res = {};
      const next = jest.fn();

      const middleware = validateObjectIdParam('id');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid ObjectId', () => {
      const req = { params: { id: 'invalid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = validateObjectIdParam('id');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid id format'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle custom param name', () => {
      const req = { params: { userId: 'invalid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = validateObjectIdParam('userId');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid userId format'
      });
    });
  });

  describe('validate middleware', () => {
    it('should pass valid data', () => {
      const schema = require('joi').object({
        name: require('joi').string().required(),
        age: require('joi').number().required()
      });

      const req = { body: { name: 'John', age: 30 } };
      const res = {};
      const next = jest.fn();

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.name).toBe('John');
      expect(req.body.age).toBe(30);
    });

    it('should reject invalid data', () => {
      const schema = require('joi').object({
        name: require('joi').string().required(),
        age: require('joi').number().required()
      });

      const req = { body: { name: 'John' } }; // Missing age
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.any(String)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should strip unknown fields', () => {
      const schema = require('joi').object({
        name: require('joi').string().required()
      });

      const req = { body: { name: 'John', extra: 'field' } };
      const res = {};
      const next = jest.fn();

      const middleware = validate(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.name).toBe('John');
      expect(req.body.extra).toBeUndefined();
    });

    it('should validate query params when property is "query"', () => {
      const schema = require('joi').object({
        page: require('joi').number().min(1).required()
      });

      const req = { query: { page: 1 } };
      const res = {};
      const next = jest.fn();

      const middleware = validate(schema, 'query');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(1);
    });
  });

  describe('sendCodeSchema', () => {
    it('should validate correct phone number', () => {
      const { error, value } = sendCodeSchema.validate({
        phoneNumber: '+1234567890'
      });
      expect(error).toBeUndefined();
      expect(value.phoneNumber).toBe('+1234567890');
    });

    it('should reject invalid phone number format', () => {
      const { error } = sendCodeSchema.validate({
        phoneNumber: '1234567890' // Missing +
      });
      expect(error).toBeDefined();
    });

    it('should require phone number', () => {
      const { error } = sendCodeSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('verifyCodeSchema', () => {
    it('should validate correct verification code', () => {
      const { error, value } = verifyCodeSchema.validate({
        phoneNumber: '+1234567890',
        code: '123456'
      });
      expect(error).toBeUndefined();
      expect(value.phoneNumber).toBe('+1234567890');
      expect(value.code).toBe('123456');
    });

    it('should require 6-digit code', () => {
      const { error } = verifyCodeSchema.validate({
        phoneNumber: '+1234567890',
        code: '12345' // Too short
      });
      expect(error).toBeDefined();
    });

    it('should require numeric code', () => {
      const { error } = verifyCodeSchema.validate({
        phoneNumber: '+1234567890',
        code: 'abcdef' // Not numeric
      });
      expect(error).toBeDefined();
    });

    it('should require firstName for new users', () => {
      const { error } = verifyCodeSchema.validate({
        phoneNumber: '+1234567890',
        code: '123456'
      }, { context: { isNewUser: true } });
      // When isNewUser is true, firstName is required
      // Note: This tests the conditional requirement
      expect(error).toBeDefined();
    });
  });

  describe('serviceSchema', () => {
    it('should validate correct service object', () => {
      const { error, value } = serviceSchema.validate({
        title: 'House Cleaning Service',
        description: 'Professional house cleaning service for your home',
        category: 'cleaning',
        subcategory: 'residential',
        pricing: {
          type: 'hourly',
          basePrice: 50,
          currency: 'USD'
        },
        serviceArea: ['New York']
      });
      expect(error).toBeUndefined();
      expect(value.title).toBe('House Cleaning Service');
    });

    it('should reject invalid category', () => {
      const { error } = serviceSchema.validate({
        title: 'Test',
        description: 'Test description',
        category: 'invalid',
        subcategory: 'test',
        pricing: { type: 'hourly', basePrice: 50 },
        serviceArea: ['NYC']
      });
      expect(error).toBeDefined();
    });

    it('should validate pricing types', () => {
      const validTypes = ['hourly', 'fixed', 'per_sqft', 'per_item'];
      validTypes.forEach(type => {
        const { error } = serviceSchema.validate({
          title: 'Test Service Title', // Must be at least 5 characters
          description: 'Test description that is long enough', // Must be at least 20 characters
          category: 'cleaning',
          subcategory: 'test',
          pricing: { type, basePrice: 50 },
          serviceArea: ['NYC']
        });
        expect(error).toBeUndefined();
      });
    });
  });

  describe('bookingSchema', () => {
    it('should validate correct booking object', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const { error, value } = bookingSchema.validate({
        serviceId: '507f1f77bcf86cd799439011',
        bookingDate: futureDate,
        duration: 2,
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      });
      expect(error).toBeUndefined();
      expect(value.serviceId).toBe('507f1f77bcf86cd799439011');
    });

    it('should reject past booking date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const { error } = bookingSchema.validate({
        serviceId: '507f1f77bcf86cd799439011',
        bookingDate: pastDate,
        duration: 2,
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      });
      expect(error).toBeDefined();
    });
  });

  describe('productSchema', () => {
    it('should validate correct product object', () => {
      const { error, value } = productSchema.validate({
        name: 'Cleaning Supplies Set',
        description: 'Complete set of professional cleaning supplies',
        category: 'cleaning_supplies',
        subcategory: 'detergents',
        brand: 'ProClean',
        sku: 'CLN-001',
        pricing: {
          retailPrice: 29.99,
          wholesalePrice: 19.99,
          currency: 'USD'
        },
        inventory: {
          quantity: 100,
          minStock: 10
        }
      });
      expect(error).toBeUndefined();
      expect(value.name).toBe('Cleaning Supplies Set');
    });

    it('should reject invalid category', () => {
      const { error } = productSchema.validate({
        name: 'Test',
        description: 'Test description',
        category: 'invalid',
        subcategory: 'test',
        brand: 'Test',
        sku: 'TST-001',
        pricing: { retailPrice: 10 },
        inventory: { quantity: 10 }
      });
      expect(error).toBeDefined();
    });
  });

  describe('loanApplicationSchema', () => {
    it('should validate correct loan application', () => {
      const { error, value } = loanApplicationSchema.validate({
        type: 'salary_advance',
        amount: 5000,
        purpose: 'Emergency funds for business expenses',
        term: {
          duration: 12,
          interestRate: 5,
          repaymentFrequency: 'monthly'
        }
      });
      expect(error).toBeUndefined();
      expect(value.type).toBe('salary_advance');
    });

    it('should reject invalid loan type', () => {
      const { error } = loanApplicationSchema.validate({
        type: 'invalid_type',
        amount: 5000,
        purpose: 'Test purpose',
        term: {
          duration: 12,
          interestRate: 5
        }
      });
      expect(error).toBeDefined();
    });

    it('should reject amount exceeding max', () => {
      const { error } = loanApplicationSchema.validate({
        type: 'business_loan',
        amount: 200000, // Exceeds max of 100000
        purpose: 'Large business expansion',
        term: {
          duration: 24,
          interestRate: 10
        }
      });
      expect(error).toBeDefined();
    });
  });
});


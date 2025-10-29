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
} = require('../../src/utils/validation');

describe('Validation Utilities', () => {
  describe('Phone Number Validation', () => {
    it('should validate correct phone number formats', () => {
      const validPhoneNumbers = [
        '+1234567890',
        '+44123456789',
        '+8612345678901',
        '+33123456789',
        '+5511999999999'
      ];

      validPhoneNumbers.forEach(phoneNumber => {
        const { error } = sendCodeSchema.validate({ phoneNumber });
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid phone number formats', () => {
      const invalidPhoneNumbers = [
        '1234567890', // Missing +
        '+0123456789', // Starting with 0
        '+123', // Too short
        'invalid', // Not a number
        '+12345678901234567890', // Too long
        '+', // Just plus sign
        '++1234567890', // Double plus
        '+123-456-7890', // Contains dashes
        '+123 456 7890' // Contains spaces
      ];

      invalidPhoneNumbers.forEach(phoneNumber => {
        const { error } = sendCodeSchema.validate({ phoneNumber });
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('international format');
      });
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        const { error } = verifyCodeSchema.validate({ 
          phoneNumber: '+1234567890',
          code: '123456',
          email 
        });
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@.com',
        'test@example.',
        'test@example..com'
      ];

      invalidEmails.forEach(email => {
        const { error } = verifyCodeSchema.validate({ 
          phoneNumber: '+1234567890',
          code: '123456',
          email 
        });
        expect(error).toBeDefined();
      });
    });
  });

  describe('Verification Code Validation', () => {
    it('should validate correct verification code formats', () => {
      const validCodes = ['123456', '000000', '999999', '654321'];

      validCodes.forEach(code => {
        const { error } = verifyCodeSchema.validate({ 
          phoneNumber: '+1234567890',
          code 
        });
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid verification code formats', () => {
      const invalidCodes = [
        '12345', // Too short
        '1234567', // Too long
        '12345a', // Contains letter
        '12 3456', // Contains space
        '12-3456', // Contains dash
        '', // Empty
        '12345.6' // Contains dot
      ];

      invalidCodes.forEach(code => {
        const { error } = verifyCodeSchema.validate({ 
          phoneNumber: '+1234567890',
          code 
        });
        expect(error).toBeDefined();
      });
    });
  });

  describe('Service Validation', () => {
    it('should validate complete service data', () => {
      const validService = {
        title: 'House Cleaning Service',
        description: 'Professional house cleaning service with eco-friendly products and experienced staff.',
        category: 'cleaning',
        subcategory: 'residential',
        pricing: {
          type: 'hourly',
          basePrice: 25,
          currency: 'USD'
        },
        serviceArea: ['New York', 'Brooklyn'],
        features: ['Eco-friendly', 'Insured'],
        requirements: ['Access to water', 'Parking space'],
        images: ['https://example.com/image1.jpg']
      };

      const { error } = serviceSchema.validate(validService);
      expect(error).toBeUndefined();
    });

    it('should reject service with missing required fields', () => {
      const incompleteService = {
        title: 'House Cleaning Service'
        // Missing description, category, etc.
      };

      const { error } = serviceSchema.validate(incompleteService);
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThan(0);
    });

    it('should validate service categories', () => {
      const validCategories = ['cleaning', 'plumbing', 'electrical', 'moving', 'other'];
      
      validCategories.forEach(category => {
        const service = {
          title: 'Test Service',
          description: 'Test description with enough characters',
          category,
          subcategory: 'test',
          pricing: { type: 'hourly', basePrice: 25 },
          serviceArea: ['Test Area']
        };

        const { error } = serviceSchema.validate(service);
        expect(error).toBeUndefined();
      });
    });

    it('should validate pricing types', () => {
      const validPricingTypes = ['hourly', 'fixed', 'per_sqft', 'per_item'];
      
      validPricingTypes.forEach(type => {
        const service = {
          title: 'Test Service',
          description: 'Test description with enough characters',
          category: 'cleaning',
          subcategory: 'test',
          pricing: { type, basePrice: 25 },
          serviceArea: ['Test Area']
        };

        const { error } = serviceSchema.validate(service);
        expect(error).toBeUndefined();
      });
    });

    it('should validate positive base price', () => {
      const service = {
        title: 'Test Service',
        description: 'Test description with enough characters',
        category: 'cleaning',
        subcategory: 'test',
        pricing: { type: 'hourly', basePrice: -10 }, // Negative price
        serviceArea: ['Test Area']
      };

      const { error } = serviceSchema.validate(service);
      expect(error).toBeDefined();
    });
  });

  describe('Booking Validation', () => {
    it('should validate complete booking data', () => {
      const validBooking = {
        serviceId: '507f1f77bcf86cd799439011',
        bookingDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 120, // 2 hours
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        specialInstructions: 'Please ring the doorbell twice'
      };

      const { error } = bookingSchema.validate(validBooking);
      expect(error).toBeUndefined();
    });

    it('should reject booking with past date', () => {
      const pastBooking = {
        serviceId: '507f1f77bcf86cd799439011',
        bookingDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        duration: 120,
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      };

      const { error } = bookingSchema.validate(pastBooking);
      expect(error).toBeDefined();
    });

    it('should validate ObjectId format for serviceId', () => {
      const invalidBooking = {
        serviceId: 'invalid-id',
        bookingDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 120,
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      };

      const { error } = bookingSchema.validate(invalidBooking);
      expect(error).toBeDefined();
    });

    it('should validate positive duration', () => {
      const booking = {
        serviceId: '507f1f77bcf86cd799439011',
        bookingDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: -60, // Negative duration
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      };

      const { error } = bookingSchema.validate(booking);
      expect(error).toBeDefined();
    });
  });

  describe('Product Validation', () => {
    it('should validate complete product data', () => {
      const validProduct = {
        name: 'Professional Cleaning Kit',
        description: 'Complete cleaning kit with eco-friendly products and professional tools.',
        category: 'cleaning_supplies',
        subcategory: 'kits',
        brand: 'EcoClean',
        sku: 'ECK-001',
        pricing: {
          retailPrice: 49.99,
          wholesalePrice: 35.00,
          currency: 'USD'
        },
        inventory: {
          quantity: 100,
          minStock: 10,
          maxStock: 500,
          location: 'Warehouse A'
        },
        specifications: {
          weight: '2.5 kg',
          dimensions: '30x20x15 cm',
          material: 'Plastic',
          color: 'Blue',
          warranty: '1 year'
        },
        images: ['https://example.com/product1.jpg'],
        tags: ['eco-friendly', 'professional'],
        isSubscriptionEligible: true
      };

      const { error } = productSchema.validate(validProduct);
      expect(error).toBeUndefined();
    });

    it('should validate product categories', () => {
      const validCategories = ['cleaning_supplies', 'tools', 'materials', 'equipment'];
      
      validCategories.forEach(category => {
        const product = {
          name: 'Test Product',
          description: 'Test product description',
          category,
          subcategory: 'test',
          brand: 'Test Brand',
          sku: 'TEST-001',
          pricing: { retailPrice: 25 },
          inventory: { quantity: 10 }
        };

        const { error } = productSchema.validate(product);
        expect(error).toBeUndefined();
      });
    });

    it('should validate inventory quantities', () => {
      const product = {
        name: 'Test Product',
        description: 'Test product description',
        category: 'cleaning_supplies',
        subcategory: 'test',
        brand: 'Test Brand',
        sku: 'TEST-001',
        pricing: { retailPrice: 25 },
        inventory: { 
          quantity: -5, // Negative quantity
          minStock: 10 
        }
      };

      const { error } = productSchema.validate(product);
      expect(error).toBeDefined();
    });
  });

  describe('Loan Application Validation', () => {
    it('should validate complete loan application', () => {
      const validLoan = {
        type: 'salary_advance',
        amount: 5000,
        purpose: 'Emergency medical expenses',
        term: {
          duration: 12, // months
          interestRate: 15.5, // percentage
          repaymentFrequency: 'monthly'
        },
        documents: [
          {
            type: 'income_proof',
            url: 'https://example.com/income.pdf'
          },
          {
            type: 'bank_statement',
            url: 'https://example.com/bank.pdf'
          }
        ]
      };

      const { error } = loanApplicationSchema.validate(validLoan);
      expect(error).toBeUndefined();
    });

    it('should validate loan types', () => {
      const validTypes = ['salary_advance', 'micro_loan', 'business_loan', 'equipment_loan'];
      
      validTypes.forEach(type => {
        const loan = {
          type,
          amount: 1000,
          purpose: 'Test purpose',
          term: { duration: 6, interestRate: 10 }
        };

        const { error } = loanApplicationSchema.validate(loan);
        expect(error).toBeUndefined();
      });
    });

    it('should validate loan amount limits', () => {
      const loan = {
        type: 'salary_advance',
        amount: 150000, // Exceeds max limit
        purpose: 'Test purpose',
        term: { duration: 6, interestRate: 10 }
      };

      const { error } = loanApplicationSchema.validate(loan);
      expect(error).toBeDefined();
    });

    it('should validate term duration limits', () => {
      const loan = {
        type: 'salary_advance',
        amount: 1000,
        purpose: 'Test purpose',
        term: { 
          duration: 72, // Exceeds max duration
          interestRate: 10 
        }
      };

      const { error } = loanApplicationSchema.validate(loan);
      expect(error).toBeDefined();
    });

    it('should validate interest rate limits', () => {
      const loan = {
        type: 'salary_advance',
        amount: 1000,
        purpose: 'Test purpose',
        term: { 
          duration: 6,
          interestRate: 60 // Exceeds max interest rate
        }
      };

      const { error } = loanApplicationSchema.validate(loan);
      expect(error).toBeDefined();
    });

    it('should validate document types', () => {
      const validDocTypes = ['income_proof', 'bank_statement', 'id_document', 'business_license', 'other'];
      
      validDocTypes.forEach(docType => {
        const loan = {
          type: 'salary_advance',
          amount: 1000,
          purpose: 'Test purpose',
          term: { duration: 6, interestRate: 10 },
          documents: [{
            type: docType,
            url: 'https://example.com/doc.pdf'
          }]
        };

        const { error } = loanApplicationSchema.validate(loan);
        expect(error).toBeUndefined();
      });
    });
  });

  describe('ObjectId Validation', () => {
    it('should validate correct ObjectId format', () => {
      const validObjectIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '000000000000000000000000',
        'ffffffffffffffffffffffff'
      ];

      validObjectIds.forEach(id => {
        expect(validateObjectId(id)).toBe(true);
      });
    });

    it('should reject invalid ObjectId format', () => {
      const invalidObjectIds = [
        'invalid-id',
        '507f1f77bcf86cd79943901', // Too short
        '507f1f77bcf86cd799439011g', // Invalid character
        '507f1f77bcf86cd7994390111', // Too long
        '', // Empty string
        null,
        undefined
      ];

      invalidObjectIds.forEach(id => {
        expect(validateObjectId(id)).toBe(false);
      });
    });
  });

  describe('Validation Middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = { body: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should pass validation for valid data', () => {
      req.body = { phoneNumber: '+1234567890' };
      
      const middleware = validate(sendCodeSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid data', () => {
      req.body = { phoneNumber: 'invalid-phone' };
      
      const middleware = validate(sendCodeSchema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.any(String)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate query parameters', () => {
      req.query = { page: '1', limit: '10' };
      
      const querySchema = Joi.object({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().min(1).max(100).default(10)
      });
      
      const middleware = validate(querySchema, 'query');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(1);
      expect(req.query.limit).toBe(10);
    });
  });

  describe('ObjectId Parameter Validation', () => {
    let req, res, next;

    beforeEach(() => {
      req = { params: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should pass validation for valid ObjectId', () => {
      req.params.id = '507f1f77bcf86cd799439011';
      
      const middleware = validateObjectIdParam('id');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return error for invalid ObjectId', () => {
      req.params.id = 'invalid-id';
      
      const middleware = validateObjectIdParam('id');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid id format'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should use custom parameter name', () => {
      req.params.userId = 'invalid-id';
      
      const middleware = validateObjectIdParam('userId');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid userId format'
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty objects', () => {
      const { error } = sendCodeSchema.validate({});
      expect(error).toBeDefined();
    });

    it('should handle null values', () => {
      const { error } = sendCodeSchema.validate({ phoneNumber: null });
      expect(error).toBeDefined();
    });

    it('should handle undefined values', () => {
      const { error } = sendCodeSchema.validate({ phoneNumber: undefined });
      expect(error).toBeDefined();
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const { error } = serviceSchema.validate({
        title: longString,
        description: 'Valid description',
        category: 'cleaning',
        subcategory: 'test',
        pricing: { type: 'hourly', basePrice: 25 },
        serviceArea: ['Test Area']
      });
      expect(error).toBeDefined();
    });

    it('should handle special characters in phone numbers', () => {
      const specialChars = ['+1-234-567-8900', '+1 (234) 567-8900', '+1.234.567.8900'];
      
      specialChars.forEach(phone => {
        const { error } = sendCodeSchema.validate({ phoneNumber: phone });
        expect(error).toBeDefined();
      });
    });
  });
});
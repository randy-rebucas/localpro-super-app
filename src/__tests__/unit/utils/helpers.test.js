const {
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
} = require('../../../utils/helpers');

describe('Helpers Utility', () => {
  describe('generateRandomString', () => {
    test('should generate a string of default length (8)', () => {
      const result = generateRandomString();
      expect(result).toHaveLength(8);
      expect(typeof result).toBe('string');
    });

    test('should generate a string of specified length', () => {
      const result = generateRandomString(16);
      expect(result).toHaveLength(16);
    });

    test('should generate different strings on each call', () => {
      const result1 = generateRandomString();
      const result2 = generateRandomString();
      expect(result1).not.toBe(result2);
    });

    test('should only contain alphanumeric characters', () => {
      const result = generateRandomString(100);
      expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('formatCurrency', () => {
    test('should format USD currency by default', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    test('should format PHP currency', () => {
      const result = formatCurrency(1234.56, 'PHP');
      expect(result).toContain('₱');
      expect(result).toContain('1,234.56');
    });

    test('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    test('should handle negative amounts', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('-');
    });
  });

  describe('calculateDistance', () => {
    test('should calculate distance between two coordinates', () => {
      // New York to Los Angeles approximate distance: ~3944 km
      const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    test('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });

    test('should handle negative coordinates', () => {
      const distance = calculateDistance(-40.7128, -74.0060, -34.0522, -118.2437);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('generateOrderNumber', () => {
    test('should generate order number with ORD prefix', () => {
      const result = generateOrderNumber();
      expect(result).toMatch(/^ORD-/);
    });

    test('should generate unique order numbers', () => {
      const result1 = generateOrderNumber();
      const result2 = generateOrderNumber();
      expect(result1).not.toBe(result2);
    });

    test('should be uppercase', () => {
      const result = generateOrderNumber();
      expect(result).toBe(result.toUpperCase());
    });
  });

  describe('generateBookingReference', () => {
    test('should generate booking reference with BK prefix', () => {
      const result = generateBookingReference();
      expect(result).toMatch(/^BK-/);
    });

    test('should generate unique booking references', () => {
      const result1 = generateBookingReference();
      const result2 = generateBookingReference();
      expect(result1).not.toBe(result2);
    });

    test('should be uppercase', () => {
      const result = generateBookingReference();
      expect(result).toBe(result.toUpperCase());
    });
  });

  describe('calculateEMI', () => {
    test('should calculate EMI correctly', () => {
      const principal = 100000;
      const rate = 10; // 10% annual
      const tenure = 12; // 12 months
      const emi = calculateEMI(principal, rate, tenure);
      
      expect(emi).toBeGreaterThan(0);
      expect(emi).toBeLessThan(principal);
      expect(typeof emi).toBe('number');
    });

    test('should handle zero interest rate', () => {
      const emi = calculateEMI(100000, 0, 12);
      expect(emi).toBeCloseTo(100000 / 12, 2);
    });

    test('should round to 2 decimal places', () => {
      const emi = calculateEMI(100000, 10, 12);
      const decimalPlaces = (emi.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('isValidEmail', () => {
    test('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@example')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    test('should validate correct phone numbers', () => {
      expect(isValidPhone('+1234567890')).toBe(true);
      expect(isValidPhone('+639123456789')).toBe(true);
      expect(isValidPhone('+441234567890')).toBe(true);
    });

    test('should reject invalid phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(false); // Missing +
      expect(isValidPhone('+01234567890')).toBe(false); // Starts with 0
      expect(isValidPhone('+123')).toBe(false); // Too short
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    test('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('<div>content</div>')).toBe('divcontent/div');
    });

    test('should return non-string input as-is', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
    });
  });

  describe('getPaginationMeta', () => {
    test('should calculate pagination metadata correctly', () => {
      const result = getPaginationMeta(2, 10, 25);
      
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.totalItems).toBe(25);
      expect(result.itemsPerPage).toBe(10);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(true);
      expect(result.nextPage).toBe(3);
      expect(result.prevPage).toBe(1);
    });

    test('should handle first page', () => {
      const result = getPaginationMeta(1, 10, 25);
      expect(result.hasPrevPage).toBe(false);
      expect(result.prevPage).toBe(null);
    });

    test('should handle last page', () => {
      const result = getPaginationMeta(3, 10, 25);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextPage).toBe(null);
    });

    test('should handle empty results', () => {
      const result = getPaginationMeta(1, 10, 0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
    });
  });

  describe('calculateRatingStats', () => {
    test('should calculate average rating correctly', () => {
      const ratings = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 5 }
      ];
      const result = calculateRatingStats(ratings);
      
      expect(result.average).toBe(4.3);
      expect(result.count).toBe(4);
    });

    test('should return breakdown by rating', () => {
      const ratings = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 }
      ];
      const result = calculateRatingStats(ratings);
      
      expect(result.breakdown[5]).toBe(2);
      expect(result.breakdown[4]).toBe(1);
      expect(result.breakdown[3]).toBe(1);
    });

    test('should handle empty ratings array', () => {
      const result = calculateRatingStats([]);
      expect(result.average).toBe(0);
      expect(result.count).toBe(0);
      expect(result.breakdown).toEqual({});
    });

    test('should handle null/undefined ratings', () => {
      const result1 = calculateRatingStats(null);
      const result2 = calculateRatingStats(undefined);
      
      expect(result1.average).toBe(0);
      expect(result2.average).toBe(0);
    });
  });

  describe('formatDate', () => {
    test('should format date correctly', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const result = formatDate(date);
      
      expect(result).toContain('2025');
      expect(result).toContain('January');
      expect(result).toContain('15');
    });

    test('should handle date string', () => {
      const result = formatDate('2025-01-15T10:30:00Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('isBusinessHours', () => {
    test('should return true for business hours (9 AM - 5 PM)', () => {
      const date = new Date('2025-01-15T14:00:00Z'); // 2 PM UTC (within 9-17)
      expect(isBusinessHours(date)).toBe(true);
    });

    test('should return false for early morning', () => {
      const date = new Date('2025-01-15T06:00:00Z'); // 6 AM UTC (before 9 AM)
      expect(isBusinessHours(date)).toBe(false);
    });

    test('should return false for evening', () => {
      const date = new Date('2025-01-15T20:00:00Z'); // 8 PM UTC (after 5 PM)
      expect(isBusinessHours(date)).toBe(false);
    });

    test('should return true at 9 AM UTC', () => {
      const date = new Date('2025-01-15T09:00:00Z');
      expect(isBusinessHours(date)).toBe(true);
    });

    test('should return true at 5 PM UTC', () => {
      const date = new Date('2025-01-15T17:00:00Z');
      expect(isBusinessHours(date)).toBe(true);
    });

    test('should return false at 8:59 AM UTC', () => {
      const date = new Date('2025-01-15T08:59:00Z');
      expect(isBusinessHours(date)).toBe(false);
    });

    test('should return true at 5:01 PM UTC (function only checks hours)', () => {
      // Note: Since the function only checks hours, 17:01 still has hour = 17, so it's included
      const date = new Date('2025-01-15T17:01:00Z');
      expect(isBusinessHours(date)).toBe(true);
    });

    test('should return false at 6 PM UTC', () => {
      const date = new Date('2025-01-15T18:00:00Z');
      expect(isBusinessHours(date)).toBe(false);
    });
  });
});


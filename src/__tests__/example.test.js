/**
 * Example test file to demonstrate Jest setup
 * This file can be removed once you start writing actual tests
 */

describe('Example Test Suite', () => {
  describe('Basic Math Operations', () => {
    test('should add two numbers correctly', () => {
      expect(1 + 1).toBe(2);
    });

    test('should multiply two numbers correctly', () => {
      expect(2 * 3).toBe(6);
    });
  });

  describe('String Operations', () => {
    test('should concatenate strings', () => {
      expect('Hello' + ' ' + 'World').toBe('Hello World');
    });

    test('should check string length', () => {
      expect('test'.length).toBe(4);
    });
  });

  describe('Array Operations', () => {
    test('should filter array elements', () => {
      const numbers = [1, 2, 3, 4, 5];
      const evenNumbers = numbers.filter(n => n % 2 === 0);
      expect(evenNumbers).toEqual([2, 4]);
    });

    test('should map array elements', () => {
      const numbers = [1, 2, 3];
      const doubled = numbers.map(n => n * 2);
      expect(doubled).toEqual([2, 4, 6]);
    });
  });
});


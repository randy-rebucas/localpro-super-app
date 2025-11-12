const TemplateEngine = require('../../../utils/templateEngine');
const fs = require('fs');
const path = require('path');

describe('Template Engine', () => {
  let templateEngine;

  beforeEach(() => {
    // Create a new instance for each test
    templateEngine = require('../../../utils/templateEngine');
  });

  describe('Template Loading', () => {
    test('should load default templates', () => {
      const templates = templateEngine.getAvailableTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    test('should have welcome template', () => {
      expect(templateEngine.hasTemplate('welcome')).toBe(true);
    });

    test('should have booking-confirmation template', () => {
      expect(templateEngine.hasTemplate('booking-confirmation')).toBe(true);
    });
  });

  describe('Template Rendering', () => {
    test('should render template with simple data', () => {
      const data = {
        firstName: 'John'
      };

      const result = templateEngine.render('welcome', data);

      expect(result).toContain('John');
      expect(result).toContain('Welcome');
    });

    test('should replace placeholders', () => {
      templateEngine.setTemplate('test', 'Hello {{name}}');
      const result = templateEngine.render('test', { name: 'World' });

      expect(result).toBe('Hello World');
    });

    test('should handle nested placeholders', () => {
      templateEngine.setTemplate('test', 'Hello {{user.name}}');
      const result = templateEngine.render('test', { user: { name: 'John' } });

      expect(result).toBe('Hello John');
    });

    test('should handle missing placeholders', () => {
      templateEngine.setTemplate('test', 'Hello {{name}}');
      const result = templateEngine.render('test', {});

      expect(result).toBe('Hello {{name}}');
    });

    test('should throw error for non-existent template', () => {
      expect(() => {
        templateEngine.render('non-existent', {});
      }).toThrow();
    });
  });

  describe('Conditional Blocks', () => {
    test('should render conditional block when condition is true', () => {
      templateEngine.setTemplate('test', '{{#if show}}Visible{{/if}}');
      const result = templateEngine.render('test', { show: true });

      expect(result).toBe('Visible');
    });

    test('should not render conditional block when condition is false', () => {
      templateEngine.setTemplate('test', '{{#if show}}Visible{{/if}}');
      const result = templateEngine.render('test', { show: false });

      expect(result).toBe('');
    });
  });

  describe('Loop Blocks', () => {
    test('should render loop block', () => {
      templateEngine.setTemplate('test', '{{#each items}}{{this}}{{/each}}');
      const result = templateEngine.render('test', { items: ['a', 'b', 'c'] });

      expect(result).toBe('abc');
    });

    test('should handle empty array in loop', () => {
      templateEngine.setTemplate('test', '{{#each items}}{{this}}{{/each}}');
      const result = templateEngine.render('test', { items: [] });

      expect(result).toBe('');
    });

    test('should handle nested properties in loop', () => {
      templateEngine.setTemplate('test', '{{#each items}}{{this.name}}{{/each}}');
      const result = templateEngine.render('test', {
        items: [{ name: 'John' }, { name: 'Jane' }]
      });

      expect(result).toBe('JohnJane');
    });
  });

  describe('Template Management', () => {
    test('should add template', () => {
      templateEngine.setTemplate('custom', 'Custom Template');
      expect(templateEngine.hasTemplate('custom')).toBe(true);
    });

    test('should remove template', () => {
      templateEngine.setTemplate('temp', 'Temp');
      templateEngine.removeTemplate('temp');
      expect(templateEngine.hasTemplate('temp')).toBe(false);
    });

    test('should get available templates', () => {
      const templates = templateEngine.getAvailableTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe('renderTemplate (async alias)', () => {
    test('should work as async function', async () => {
      const data = { firstName: 'John' };
      const result = await templateEngine.renderTemplate('welcome', data);

      expect(result).toContain('John');
    });
  });

  describe('Complex Templates', () => {
    test('should render booking confirmation template', () => {
      const data = {
        clientName: 'John Doe',
        serviceTitle: 'Home Cleaning',
        bookingDate: 'January 15, 2025',
        bookingTime: '10:00 AM',
        duration: 2,
        totalAmount: 100
      };

      const result = templateEngine.render('booking-confirmation', data);

      expect(result).toContain('John Doe');
      expect(result).toContain('Home Cleaning');
      expect(result).toContain('January 15, 2025');
    });

    test('should render order confirmation template', () => {
      const data = {
        customerName: 'Jane Doe',
        orderNumber: 'ORD-123',
        totalAmount: 50,
        status: 'confirmed'
      };

      const result = templateEngine.render('order-confirmation', data);

      expect(result).toContain('Jane Doe');
      expect(result).toContain('ORD-123');
    });
  });
});


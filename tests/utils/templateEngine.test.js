const templateEngine = require('../../src/utils/templateEngine');

describe('Template Engine', () => {
  beforeEach(() => {
    // Clear templates before each test
    templateEngine.templates.clear();
    // Reload templates
    templateEngine.loadTemplates();
  });

  describe('Template Loading', () => {
    it('should load default templates when no template directory exists', () => {
      const availableTemplates = templateEngine.getAvailableTemplates();
      expect(availableTemplates.length).toBeGreaterThan(0);
      expect(availableTemplates).toContain('welcome');
      expect(availableTemplates).toContain('booking-confirmation');
    });

    it('should have all required templates', () => {
      const requiredTemplates = [
        'welcome',
        'booking-confirmation',
        'order-confirmation',
        'loan-approval',
        'job-application-notification',
        'application-status-update',
        'referral-invitation',
        'referral-reward-notification'
      ];

      requiredTemplates.forEach(templateName => {
        expect(templateEngine.hasTemplate(templateName)).toBe(true);
      });
    });
  });

  describe('Template Rendering', () => {
    it('should render simple placeholders correctly', () => {
      const result = templateEngine.render('welcome', {
        firstName: 'John'
      });

      expect(result).toContain('Hi <strong>John</strong>');
      expect(result).toContain('Welcome to LocalPro Super App!');
    });

    it('should render nested placeholders correctly', () => {
      const result = templateEngine.render('booking-confirmation', {
        clientName: 'Jane Doe',
        serviceTitle: 'House Cleaning',
        bookingDate: 'January 15, 2024',
        bookingTime: '10:00 AM',
        duration: 2,
        totalAmount: 150
      });

      expect(result).toContain('Hi <strong>Jane Doe</strong>');
      expect(result).toContain('House Cleaning');
      expect(result).toContain('January 15, 2024');
      expect(result).toContain('10:00 AM');
      expect(result).toContain('2 hours');
      expect(result).toContain('$150');
    });

    it('should handle missing data gracefully', () => {
      const result = templateEngine.render('welcome', {
        firstName: 'John'
        // missing other data
      });

      expect(result).toContain('Hi <strong>John</strong>');
      expect(result).toContain('{{app_url}}'); // Should keep placeholder if data missing
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        templateEngine.render('non-existent-template', {});
      }).toThrow("Template 'non-existent-template' not found");
    });
  });

  describe('Conditional Blocks', () => {
    it('should process conditional blocks correctly', () => {
      const template = 'Hello {{name}}{{#if showDetails}} - Details: {{details}}{{/if}}';
      templateEngine.setTemplate('test-conditional', template);

      const resultWithDetails = templateEngine.render('test-conditional', {
        name: 'John',
        showDetails: true,
        details: 'VIP Customer'
      });

      expect(resultWithDetails).toContain('Hello John - Details: VIP Customer');

      const resultWithoutDetails = templateEngine.render('test-conditional', {
        name: 'Jane',
        showDetails: false,
        details: 'Regular Customer'
      });

      expect(resultWithoutDetails).toContain('Hello Jane');
      expect(resultWithoutDetails).not.toContain('Details:');
    });
  });

  describe('Loop Processing', () => {
    it('should process loop blocks correctly', () => {
      const template = 'Items:{{#each items}} {{this.name}} ({{this.price}}){{/each}}';
      templateEngine.setTemplate('test-loop', template);

      const result = templateEngine.render('test-loop', {
        items: [
          { name: 'Item 1', price: '$10' },
          { name: 'Item 2', price: '$20' }
        ]
      });

      expect(result).toContain('Items: Item 1 ($10) Item 2 ($20)');
    });

    it('should handle empty arrays in loops', () => {
      const template = 'Items:{{#each items}} {{this.name}}{{/each}}';
      templateEngine.setTemplate('test-empty-loop', template);

      const result = templateEngine.render('test-empty-loop', {
        items: []
      });

      expect(result).toBe('Items:');
    });
  });

  describe('Template Management', () => {
    it('should add new template', () => {
      const templateContent = 'Hello {{name}}!';
      templateEngine.setTemplate('custom-template', templateContent);

      expect(templateEngine.hasTemplate('custom-template')).toBe(true);
      expect(templateEngine.getAvailableTemplates()).toContain('custom-template');
    });

    it('should remove template', () => {
      templateEngine.setTemplate('temp-template', 'Test content');
      expect(templateEngine.hasTemplate('temp-template')).toBe(true);

      templateEngine.removeTemplate('temp-template');
      expect(templateEngine.hasTemplate('temp-template')).toBe(false);
    });

    it('should reload templates', () => {
      const initialCount = templateEngine.getAvailableTemplates().length;
      
      templateEngine.setTemplate('test-reload', 'Test content');
      expect(templateEngine.getAvailableTemplates().length).toBe(initialCount + 1);

      templateEngine.reloadTemplates();
      expect(templateEngine.getAvailableTemplates().length).toBe(initialCount);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data object', () => {
      const result = templateEngine.render('welcome', {});
      expect(result).toContain('{{firstName}}'); // Should keep placeholder
    });

    it('should handle null data', () => {
      const result = templateEngine.render('welcome', null);
      expect(result).toContain('{{firstName}}'); // Should keep placeholder
    });

    it('should handle undefined data', () => {
      const result = templateEngine.render('welcome', undefined);
      expect(result).toContain('{{firstName}}'); // Should keep placeholder
    });

    it('should handle special characters in data', () => {
      const result = templateEngine.render('welcome', {
        firstName: 'John & Jane <script>alert("test")</script>'
      });

      expect(result).toContain('John & Jane <script>alert("test")</script>');
    });
  });

  describe('Async Rendering', () => {
    it('should support async renderTemplate method', async () => {
      const result = await templateEngine.renderTemplate('welcome', {
        firstName: 'Async User'
      });

      expect(result).toContain('Hi <strong>Async User</strong>');
    });
  });
});

const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

class TemplateEngine {
  constructor() {
    this.templates = new Map();
    this.templateDir = path.join(__dirname, '../templates/email');
    this.loadTemplates();
  }

  /**
   * Load all email templates from the templates directory
   */
  loadTemplates() {
    try {
      if (fs.existsSync(this.templateDir)) {
        const files = fs.readdirSync(this.templateDir);
        files.forEach(file => {
          if (file.endsWith('.html')) {
            const templateName = file.replace('.html', '');
            const templatePath = path.join(this.templateDir, file);
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            this.templates.set(templateName, templateContent);
          }
        });
      } else {
        // In development environment or when templates don't exist, create some basic templates
        if (process.env.NODE_ENV === 'development') {
          this.createDefaultTemplates();
        }
      }
    } catch (error) {
      logger.error('Error loading email templates:', error);
      // Create default templates as fallback
      this.createDefaultTemplates();
    }
  }

  /**
   * Create default templates for testing and development
   */
  createDefaultTemplates() {
    /* eslint-disable no-undef */
    const defaultTemplates = {
      'welcome': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Welcome to LocalPro Super App!</h1>
          <p>Hi {{firstName}},</p>
          <p>Thank you for joining LocalPro Super App! We're excited to have you on board.</p>
          <p>Best regards,<br>The LocalPro Team</p>
        </div>
      `,
      'booking-confirmation': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Booking Confirmed!</h1>
          <p>Hi {{clientName}},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Booking Details</h3>
            <p><strong>Service:</strong> {{serviceTitle}}</p>
            <p><strong>Date:</strong> {{bookingDate}}</p>
            <p><strong>Time:</strong> {{bookingTime}}</p>
            <p><strong>Duration:</strong> {{duration}} hours</p>
            <p><strong>Total Amount:</strong> ${'$'}{{totalAmount}}</p>
          </div>
          <p>Best regards,<br>The LocalPro Team</p>
        </div>
      `,
      'order-confirmation': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Order Confirmed!</h1>
          <p>Hi {{customerName}},</p>
          <p>Thank you for your order. Here are the details:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> {{orderNumber}}</p>
            <p><strong>Total Amount:</strong> ${'$'}{{totalAmount}}</p>
            <p><strong>Status:</strong> {{status}}</p>
          </div>
          <p>Best regards,<br>The LocalPro Team</p>
        </div>
      `,
      'loan-approval': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #27ae60;">Congratulations! Your loan has been approved.</h1>
          <p>Hi {{borrowerName}},</p>
          <p>We're pleased to inform you that your loan application has been approved.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Loan Details</h3>
            <p><strong>Loan Type:</strong> {{loanType}}</p>
            <p><strong>Approved Amount:</strong> ${'$'}{{approvedAmount}}</p>
            <p><strong>Interest Rate:</strong> {{interestRate}}% per annum</p>
            <p><strong>Term:</strong> {{loanDuration}} months</p>
          </div>
          <p>You will receive the disbursement within 2-3 business days.</p>
          <p>Best regards,<br>The LocalPro Finance Team</p>
        </div>
      `,
      'job-application-notification': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">New Job Application</h1>
          <p>You have received a new job application for {{jobTitle}}.</p>
          <p>Best regards,<br>The LocalPro Team</p>
        </div>
      `,
      'application-status-update': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Application Status Update</h1>
          <p>Hi {{applicantName}},</p>
          <p>Your application for {{jobTitle}} has been updated.</p>
          <p>Best regards,<br>The LocalPro Team</p>
        </div>
      `,
      'referral-invitation': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">You're Invited to Join LocalPro!</h1>
          <p>{{referrerName}} has invited you to join LocalPro.</p>
          <p>Best regards,<br>The LocalPro Team</p>
        </div>
      `,
      'referral-reward-notification': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #27ae60;">🎉 You earned ${'$'}{{rewardAmount}} from your referral!</h1>
          <p>Congratulations! You've earned a reward for your referral.</p>
          <p>Best regards,<br>The LocalPro Team</p>
        </div>
      `
    };
    /* eslint-enable no-undef */

    Object.entries(defaultTemplates).forEach(([name, content]) => {
      this.templates.set(name, content);
    });
  }

  /**
   * Render a template with data
   * @param {string} templateName - Name of the template
   * @param {object} data - Data to inject into the template
   * @returns {string} Rendered HTML
   */
  render(templateName, data = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return this.replacePlaceholders(template, data);
  }

  /**
   * Render a template with data (alias for render)
   * @param {string} templateName - Name of the template
   * @param {object} data - Data to inject into the template
   * @returns {string} Rendered HTML
   */
  async renderTemplate(templateName, data = {}) {
    return this.render(templateName, data);
  }

  /**
   * Replace placeholders in template with data
   * @param {string} template - Template content
   * @param {object} data - Data to replace placeholders
   * @returns {string} Processed template
   */
  replacePlaceholders(template, data) {
    // Handle null or undefined data
    if (!data || typeof data !== 'object') {
      data = {};
    }

    let processedTemplate = template;

    // Replace simple placeholders {{key}}
    processedTemplate = processedTemplate.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });

    // Replace nested placeholders {{object.key}}
    processedTemplate = processedTemplate.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, objKey, propKey) => {
      return data[objKey] && data[objKey][propKey] !== undefined ? data[objKey][propKey] : match;
    });

    // Replace array placeholders {{array[index]}}
    processedTemplate = processedTemplate.replace(/\{\{(\w+)\[(\d+)\]\}\}/g, (match, arrayKey, index) => {
      return data[arrayKey] && data[arrayKey][parseInt(index)] !== undefined ? data[arrayKey][parseInt(index)] : match;
    });

    // Handle conditional blocks {{#if condition}}...{{/if}}
    processedTemplate = this.processConditionals(processedTemplate, data);

    // Handle loops {{#each array}}...{{/each}}
    processedTemplate = this.processLoops(processedTemplate, data);

    return processedTemplate;
  }

  /**
   * Process conditional blocks in template
   * @param {string} template - Template content
   * @param {object} data - Data for conditionals
   * @returns {string} Processed template
   */
  processConditionals(template, data) {
    return template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      if (data[condition]) {
        return content;
      }
      return '';
    });
  }

  /**
   * Process loop blocks in template
   * @param {string} template - Template content
   * @param {object} data - Data for loops
   * @returns {string} Processed template
   */
  processLoops(template, data) {
    return template.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, content) => {
      if (Array.isArray(data[arrayKey])) {
        return data[arrayKey].map(item => {
          let itemContent = content;
          // Replace {{this}} with current item
          itemContent = itemContent.replace(/\{\{this\}\}/g, item);
          // Replace {{this.property}} with item property
          itemContent = itemContent.replace(/\{\{this\.(\w+)\}\}/g, (match, prop) => {
            return item[prop] !== undefined ? item[prop] : match;
          });
          return itemContent;
        }).join('');
      }
      return '';
    });
  }

  /**
   * Get list of available templates
   * @returns {Array} Array of template names
   */
  getAvailableTemplates() {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if template exists
   * @param {string} templateName - Name of the template
   * @returns {boolean} Whether template exists
   */
  hasTemplate(templateName) {
    return this.templates.has(templateName);
  }

  /**
   * Add or update a template
   * @param {string} templateName - Name of the template
   * @param {string} content - Template content
   */
  setTemplate(templateName, content) {
    this.templates.set(templateName, content);
  }

  /**
   * Remove a template
   * @param {string} templateName - Name of the template
   */
  removeTemplate(templateName) {
    this.templates.delete(templateName);
  }

  /**
   * Reload templates from disk
   */
  reloadTemplates() {
    this.templates.clear();
    this.loadTemplates();
  }
}

module.exports = new TemplateEngine();
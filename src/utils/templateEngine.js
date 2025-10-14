// Simple template engine for email templates
const fs = require('fs');
const path = require('path');

class TemplateEngine {
  constructor() {
    this.templateCache = new Map();
    this.templateDir = path.join(__dirname, '../templates/email');
  }

  /**
   * Load template from file system
   * @param {string} templateName - Name of the template file (without .html)
   * @returns {string} Template content
   */
  loadTemplate(templateName) {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    try {
      const templatePath = path.join(this.templateDir, `${templateName}.html`);
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      this.templateCache.set(templateName, templateContent);
      return templateContent;
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Load base template
   * @returns {string} Base template content
   */
  loadBaseTemplate() {
    return this.loadTemplate('base');
  }

  /**
   * Simple template variable replacement
   * @param {string} template - Template string
   * @param {object} variables - Variables to replace
   * @returns {string} Rendered template
   */
  replaceVariables(template, variables) {
    let rendered = template;

    // Replace simple variables {{variable}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, variables[key] || '');
    });

    // Handle conditional blocks {{#if condition}}...{{/if}}
    rendered = this.processConditionals(rendered, variables);

    // Handle loops {{#each items}}...{{/each}}
    rendered = this.processLoops(rendered, variables);

    return rendered;
  }

  /**
   * Process conditional blocks
   * @param {string} template - Template string
   * @param {object} variables - Variables object
   * @returns {string} Processed template
   */
  processConditionals(template, variables) {
    const conditionalRegex = /{{#if\s+(\w+)}}(.*?){{\/if}}/gs;
    
    return template.replace(conditionalRegex, (match, condition, content) => {
      if (variables[condition]) {
        return content;
      }
      return '';
    });
  }

  /**
   * Process loop blocks
   * @param {string} template - Template string
   * @param {object} variables - Variables object
   * @returns {string} Processed template
   */
  processLoops(template, variables) {
    const loopRegex = /{{#each\s+(\w+)}}(.*?){{\/each}}/gs;
    
    return template.replace(loopRegex, (match, arrayName, content) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) {
        return '';
      }

      return array.map(item => {
        let itemContent = content;
        Object.keys(item).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          itemContent = itemContent.replace(regex, item[key] || '');
        });
        return itemContent;
      }).join('');
    });
  }

  /**
   * Render a complete email template
   * @param {string} templateName - Name of the template
   * @param {object} variables - Variables to replace
   * @returns {string} Complete HTML email
   */
  render(templateName, variables) {
    try {
      // Load base template
      const baseTemplate = this.loadBaseTemplate();
      
      // Load content template
      const contentTemplate = this.loadTemplate(templateName);
      
      // Prepare variables with defaults
      const templateVariables = {
        current_year: new Date().getFullYear(),
        website_url: process.env.WEBSITE_URL || 'https://localpro.com',
        support_url: process.env.SUPPORT_URL || 'https://localpro.com/support',
        privacy_url: process.env.PRIVACY_URL || 'https://localpro.com/privacy',
        terms_url: process.env.TERMS_URL || 'https://localpro.com/terms',
        app_url: process.env.APP_URL || 'https://app.localpro.com',
        facebook_url: process.env.FACEBOOK_URL || 'https://facebook.com/localpro',
        twitter_url: process.env.TWITTER_URL || 'https://twitter.com/localpro',
        linkedin_url: process.env.LINKEDIN_URL || 'https://linkedin.com/company/localpro',
        instagram_url: process.env.INSTAGRAM_URL || 'https://instagram.com/localpro',
        app_store_url: process.env.APP_STORE_URL || 'https://apps.apple.com/app/localpro',
        play_store_url: process.env.PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.localpro',
        app_store_badge: process.env.APP_STORE_BADGE || 'https://via.placeholder.com/120x40/000000/FFFFFF?text=App+Store',
        play_store_badge: process.env.PLAY_STORE_BADGE || 'https://via.placeholder.com/120x40/000000/FFFFFF?text=Google+Play',
        ...variables
      };

      // Replace content in base template
      const renderedContent = this.replaceVariables(contentTemplate, templateVariables);
      const finalTemplate = this.replaceVariables(baseTemplate, {
        ...templateVariables,
        content: renderedContent
      });

      return finalTemplate;
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
  }
}

module.exports = new TemplateEngine();

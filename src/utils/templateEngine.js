const fs = require('fs');
const path = require('path');

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
      }
    } catch (error) {
      console.error('Error loading email templates:', error);
    }
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
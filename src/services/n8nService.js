/**
 * n8n Workflow Integration Service
 * 
 * Handles communication with n8n workflows for automation execution
 */

const axios = require('axios');
const logger = require('../config/logger');

class N8nService {
  constructor() {
    this.baseURL = process.env.N8N_BASE_URL || process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY;
    this.webhookPath = process.env.N8N_WEBHOOK_PATH || '/webhook';
    
    // Workflow name to webhook ID mapping
    this.workflowMapping = {
      'booking-reminders': process.env.N8N_WORKFLOW_BOOKING_REMINDERS,
      'paypal-webhook': process.env.N8N_WORKFLOW_PAYPAL_WEBHOOK,
      'user-onboarding': process.env.N8N_WORKFLOW_USER_ONBOARDING,
      'referral-processing': process.env.N8N_WORKFLOW_REFERRAL,
      'job-application': process.env.N8N_WORKFLOW_JOB_APPLICATION,
      'subscription-management': process.env.N8N_WORKFLOW_SUBSCRIPTION,
      'email-marketing': process.env.N8N_WORKFLOW_EMAIL_MARKETING,
      'analytics-reporting': process.env.N8N_WORKFLOW_ANALYTICS,
      'provider-verification': process.env.N8N_WORKFLOW_PROVIDER_VERIFICATION,
      'escrow-management': process.env.N8N_WORKFLOW_ESCROW,
      'client-booking': process.env.N8N_WORKFLOW_CLIENT_BOOKING,
      'client-support': process.env.N8N_WORKFLOW_CLIENT_SUPPORT,
      'human-escalation': process.env.N8N_WORKFLOW_HUMAN_ESCALATION
    };
  }

  /**
   * Trigger a workflow by name or webhook ID
   */
  async triggerWorkflow(workflowNameOrId, data = {}) {
    try {
      let webhookUrl;
      
      // Check if it's a webhook ID (UUID format)
      if (this.isUUID(workflowNameOrId)) {
        webhookUrl = `${this.baseURL}${this.webhookPath}/${workflowNameOrId}`;
      } else {
        // Look up workflow by name
        const webhookId = this.workflowMapping[workflowNameOrId];
        if (!webhookId) {
          throw new Error(`Workflow mapping not found for: ${workflowNameOrId}`);
        }
        webhookUrl = `${this.baseURL}${this.webhookPath}/${webhookId}`;
      }

      logger.info('Triggering n8n workflow', {
        workflow: workflowNameOrId,
        url: webhookUrl.replace(/\/[^/]+$/, '/***') // Mask webhook ID in logs
      });

      const response = await axios.post(webhookUrl, data, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey })
        },
        timeout: 30000
      });

      return {
        success: true,
        executionId: response.data?.executionId || response.headers['x-n8n-execution-id'] || 'unknown',
        data: response.data,
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to trigger n8n workflow', {
        workflow: workflowNameOrId,
        error: error.message,
        response: error.response?.data
      });

      // If n8n is not available, log but don't fail
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        logger.warn('n8n service unavailable, workflow not executed', {
          workflow: workflowNameOrId
        });
        return {
          success: false,
          error: 'n8n service unavailable',
          executionId: null
        };
      }

      return {
        success: false,
        error: error.message,
        executionId: null
      };
    }
  }

  /**
   * Check if string is UUID format
   */
  isUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Get workflow execution status (if n8n API is available)
   */
  async getExecutionStatus(executionId) {
    if (!this.apiKey) {
      logger.warn('n8n API key not configured, cannot get execution status');
      return null;
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/api/v1/executions/${executionId}`,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );

      return {
        executionId,
        status: response.data.status,
        finished: response.data.finished,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to get execution status', {
        executionId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Register a workflow mapping
   */
  registerWorkflow(name, webhookId) {
    this.workflowMapping[name] = webhookId;
    logger.info('Registered n8n workflow', { name, webhookId });
  }
}

module.exports = new N8nService();

const cron = require('node-cron');
const EmailCampaign = require('../models/EmailCampaign');
const EmailMarketingService = require('./emailMarketingService');
const logger = require('../config/logger');

/**
 * Automated Email Campaign Processor
 * Handles scheduled and recurring email campaigns
 */
class AutomatedCampaignProcessor {
  constructor() {
    this.isRunning = false;
    this.processingCampaigns = new Set(); // Track campaigns being processed to avoid duplicates
  }

  /**
   * Start the automated campaign processor
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Automated campaign processor is already running');
      return;
    }

    // Check for campaigns ready to send (every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
      await this.processScheduledCampaigns();
      await this.processRecurringCampaigns();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Clean up processing tracking set daily
    cron.schedule('0 0 * * *', () => {
      this.processingCampaigns.clear();
      logger.info('Cleared campaign processing tracking set');
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    this.isRunning = true;
    logger.info('✅ Automated campaign processor started');
  }

  /**
   * Stop the automated campaign processor
   */
  stop() {
    this.isRunning = false;
    logger.info('Automated campaign processor stopped');
  }

  /**
   * Process scheduled campaigns that are ready to send
   */
  async processScheduledCampaigns() {
    try {
      const campaigns = await EmailCampaign.getScheduledCampaigns();
      
      if (campaigns.length === 0) {
        return;
      }

      logger.info(`Found ${campaigns.length} scheduled campaign(s) ready to send`);

      for (const campaign of campaigns) {
        // Skip if already processing
        if (this.processingCampaigns.has(campaign._id.toString())) {
          continue;
        }

        try {
          this.processingCampaigns.add(campaign._id.toString());
          
          logger.info(`Processing scheduled campaign: ${campaign._id} - ${campaign.name}`);
          
          // Send the campaign
          const result = await EmailMarketingService.sendCampaign(campaign._id);
          
          if (result.success) {
            logger.info(`Scheduled campaign sent successfully: ${campaign._id}`, {
              recipientCount: result.data?.recipientCount
            });
          } else {
            logger.error(`Failed to send scheduled campaign: ${campaign._id}`, {
              error: result.error
            });
            
            // Update campaign status to failed
            campaign.status = 'failed';
            campaign.sendingProgress.errors.push({
              error: result.error,
              timestamp: new Date()
            });
            await campaign.save();
          }
        } catch (error) {
          logger.error(`Error processing scheduled campaign ${campaign._id}:`, error);
          
          // Update campaign status to failed
          try {
            campaign.status = 'failed';
            campaign.sendingProgress.errors.push({
              error: error.message,
              timestamp: new Date()
            });
            await campaign.save();
          } catch (saveError) {
            logger.error(`Failed to update campaign status: ${campaign._id}`, saveError);
          }
        } finally {
          // Remove from processing set after a delay to allow processing to complete
          setTimeout(() => {
            this.processingCampaigns.delete(campaign._id.toString());
          }, 60000); // Remove after 1 minute
        }
      }
    } catch (error) {
      logger.error('Error in processScheduledCampaigns', error);
    }
  }

  /**
   * Process recurring campaigns
   */
  async processRecurringCampaigns() {
    try {
      const campaigns = await EmailCampaign.getRecurringCampaigns();
      
      if (campaigns.length === 0) {
        return;
      }

      logger.info(`Found ${campaigns.length} recurring campaign(s) to check`);

      for (const campaign of campaigns) {
        try {
          // Check if it's time to send based on recurring schedule
          if (!this.shouldSendRecurringCampaign(campaign)) {
            continue;
          }

          // Skip if already processing
          if (this.processingCampaigns.has(campaign._id.toString())) {
            continue;
          }

          this.processingCampaigns.add(campaign._id.toString());

          logger.info(`Processing recurring campaign: ${campaign._id} - ${campaign.name}`);

          // Create a new campaign instance for this recurrence
          const newCampaign = await this.createRecurringInstance(campaign);
          
          if (newCampaign) {
            // Send the new campaign instance
            const result = await EmailMarketingService.sendCampaign(newCampaign._id);
            
            if (result.success) {
              logger.info(`Recurring campaign instance sent: ${newCampaign._id}`, {
                recipientCount: result.data?.recipientCount,
                parentCampaign: campaign._id
              });
            } else {
              logger.error(`Failed to send recurring campaign instance: ${newCampaign._id}`, {
                error: result.error
              });
            }
          }
        } catch (error) {
          logger.error(`Error processing recurring campaign ${campaign._id}:`, error);
        } finally {
          setTimeout(() => {
            this.processingCampaigns.delete(campaign._id.toString());
          }, 60000);
        }
      }
    } catch (error) {
      logger.error('Error in processRecurringCampaigns', error);
    }
  }

  /**
   * Check if a recurring campaign should be sent now
   */
  shouldSendRecurringCampaign(campaign) {
    if (!campaign.schedule?.recurring) {
      return false;
    }

    const now = new Date();
    const recurring = campaign.schedule.recurring;
    
    // Check if end date has passed
    if (recurring.endDate && new Date(recurring.endDate) < now) {
      return false;
    }

    // Get last sent date
    const lastSent = campaign.analytics?.lastSentAt || campaign.createdAt;
    const lastSentDate = new Date(lastSent);
    
    // Check frequency
    switch (recurring.frequency) {
      case 'daily':
        // Send if last sent was more than 24 hours ago
        return (now - lastSentDate) >= 24 * 60 * 60 * 1000;
        
      case 'weekly':
        // Send if it's the right day of week and last sent was more than 7 days ago
        const dayOfWeek = now.getDay();
        if (recurring.dayOfWeek !== undefined && dayOfWeek !== recurring.dayOfWeek) {
          return false;
        }
        return (now - lastSentDate) >= 7 * 24 * 60 * 60 * 1000;
        
      case 'biweekly':
        // Send if last sent was more than 14 days ago
        return (now - lastSentDate) >= 14 * 24 * 60 * 60 * 1000;
        
      case 'monthly':
        // Send if it's the right day of month and last sent was more than 30 days ago
        const dayOfMonth = now.getDate();
        if (recurring.dayOfMonth !== undefined && dayOfMonth !== recurring.dayOfMonth) {
          return false;
        }
        return (now - lastSentDate) >= 30 * 24 * 60 * 60 * 1000;
        
      default:
        return false;
    }
  }

  /**
   * Create a new instance of a recurring campaign
   */
  async createRecurringInstance(parentCampaign) {
    try {
      // Create a copy of the campaign for this recurrence
      const newCampaignData = {
        name: `${parentCampaign.name} - ${new Date().toLocaleDateString()}`,
        subject: parentCampaign.subject,
        previewText: parentCampaign.previewText,
        type: parentCampaign.type,
        content: parentCampaign.content,
        sender: parentCampaign.sender,
        audience: parentCampaign.audience,
        schedule: {
          type: 'immediate', // This instance sends immediately
          timezone: parentCampaign.schedule.timezone
        },
        status: 'scheduled',
        abTest: parentCampaign.abTest,
        createdBy: parentCampaign.createdBy,
        isRecurringInstance: true,
        parentCampaign: parentCampaign._id
      };

      const newCampaign = await EmailCampaign.create(newCampaignData);
      
      // Update parent campaign's last sent date
      parentCampaign.analytics.lastSentAt = new Date();
      await parentCampaign.save();

      logger.info(`Created recurring campaign instance: ${newCampaign._id}`, {
        parentCampaign: parentCampaign._id
      });

      return newCampaign;
    } catch (error) {
      logger.error('Error creating recurring campaign instance', error);
      return null;
    }
  }

  /**
   * Retry failed campaigns
   */
  async retryFailedCampaigns() {
    try {
      const failedCampaigns = await EmailCampaign.find({
        status: 'failed',
        isDeleted: false,
        'sendingProgress.retryCount': { $lt: 3 } // Max 3 retries
      });

      for (const campaign of failedCampaigns) {
        try {
          // Increment retry count
          if (!campaign.sendingProgress.retryCount) {
            campaign.sendingProgress.retryCount = 0;
          }
          campaign.sendingProgress.retryCount++;

          // Reset status to scheduled
          campaign.status = 'scheduled';
          await campaign.save();

          logger.info(`Retrying failed campaign: ${campaign._id}`, {
            retryCount: campaign.sendingProgress.retryCount
          });

          // Send the campaign
          await EmailMarketingService.sendCampaign(campaign._id);
        } catch (error) {
          logger.error(`Error retrying campaign ${campaign._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in retryFailedCampaigns', error);
    }
  }
}

module.exports = new AutomatedCampaignProcessor();


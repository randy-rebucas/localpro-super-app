/**
 * Email Marketing Service
 * Handles email campaign operations, sending, and tracking
 */

const EmailCampaign = require('../models/EmailCampaign');
const EmailSubscriber = require('../models/EmailSubscriber');
const { EmailEvent, EmailDailyStats } = require('../models/EmailAnalytics');
const EmailService = require('./emailService');
const templateEngine = require('../utils/templateEngine');
const logger = require('../config/logger');
const crypto = require('crypto');

class EmailMarketingService {
  constructor() {
    this.batchSize = parseInt(process.env.EMAIL_BATCH_SIZE) || 100;
    this.batchDelay = parseInt(process.env.EMAIL_BATCH_DELAY) || 1000; // ms between batches
    this.trackingDomain = process.env.TRACKING_DOMAIN || process.env.FRONTEND_URL || 'http://localhost:3000';
    this.apiDomain = process.env.API_DOMAIN || process.env.BACKEND_URL || 'http://localhost:5000';
  }

  // ==================== CAMPAIGN MANAGEMENT ====================

  /**
   * Create a new email campaign
   */
  async createCampaign(data, userId) {
    try {
      // Extract links from HTML content for tracking
      const links = this.extractLinks(data.content?.html || '');
      
      const campaign = await EmailCampaign.create({
        ...data,
        links,
        createdBy: userId
      });
      
      logger.info(`Email campaign created: ${campaign._id}`, { campaignId: campaign._id, name: campaign.name });
      return { success: true, data: campaign };
    } catch (error) {
      logger.error('Error creating email campaign:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(campaignId, updates, userId) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }
      
      if (!['draft', 'scheduled'].includes(campaign.status)) {
        return { success: false, error: 'Cannot edit campaign in current status' };
      }
      
      // Update links if content changed
      if (updates.content?.html) {
        updates.links = this.extractLinks(updates.content.html);
      }
      
      updates.updatedBy = userId;
      Object.assign(campaign, updates);
      await campaign.save();
      
      logger.info(`Email campaign updated: ${campaignId}`);
      return { success: true, data: campaign };
    } catch (error) {
      logger.error('Error updating email campaign:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId) {
    try {
      const campaign = await EmailCampaign.findOne({ _id: campaignId, isDeleted: false })
        .populate('createdBy', 'firstName lastName email');
      
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }
      
      return { success: true, data: campaign };
    } catch (error) {
      logger.error('Error fetching campaign:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List campaigns with filters
   */
  async listCampaigns(options = {}) {
    try {
      const { page = 1, limit = 20, status, type, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      
      const query = { isDeleted: false };
      
      if (status) query.status = status;
      if (type) query.type = type;
      if (search) {
        query.$text = { $search: search };
      }
      
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
      
      const [campaigns, total] = await Promise.all([
        EmailCampaign.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('createdBy', 'firstName lastName'),
        EmailCampaign.countDocuments(query)
      ]);
      
      return {
        success: true,
        data: {
          campaigns,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      logger.error('Error listing campaigns:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete (soft) a campaign
   */
  async deleteCampaign(campaignId, userId) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }
      
      if (campaign.status === 'sending') {
        return { success: false, error: 'Cannot delete campaign while sending' };
      }
      
      await campaign.softDelete(userId);
      
      logger.info(`Email campaign deleted: ${campaignId}`);
      return { success: true, message: 'Campaign deleted successfully' };
    } catch (error) {
      logger.error('Error deleting campaign:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Duplicate a campaign
   */
  async duplicateCampaign(campaignId, newName) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }
      
      const newCampaign = await campaign.duplicate(newName);
      
      logger.info(`Email campaign duplicated: ${campaignId} -> ${newCampaign._id}`);
      return { success: true, data: newCampaign };
    } catch (error) {
      logger.error('Error duplicating campaign:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== CAMPAIGN SENDING ====================

  /**
   * Send a campaign immediately or schedule it
   */
  async sendCampaign(campaignId) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }
      
      if (!['draft', 'scheduled'].includes(campaign.status)) {
        return { success: false, error: `Cannot send campaign in ${campaign.status} status` };
      }
      
      // Get target audience
      const subscribers = await this.getTargetAudience(campaign);
      
      if (subscribers.length === 0) {
        return { success: false, error: 'No subscribers match the campaign criteria' };
      }
      
      // Update campaign with recipient count
      campaign.analytics.totalRecipients = subscribers.length;
      campaign.status = 'sending';
      campaign.sendingProgress.startedAt = new Date();
      campaign.sendingProgress.totalBatches = Math.ceil(subscribers.length / this.batchSize);
      await campaign.save();
      
      // Start sending in background
      this.processCampaignSending(campaign, subscribers).catch(error => {
        logger.error(`Campaign sending failed: ${campaignId}`, error);
      });
      
      logger.info(`Campaign sending started: ${campaignId}`, { recipientCount: subscribers.length });
      return { 
        success: true, 
        message: 'Campaign sending started',
        data: {
          recipientCount: subscribers.length,
          estimatedTime: Math.ceil(subscribers.length / this.batchSize) * (this.batchDelay / 1000)
        }
      };
    } catch (error) {
      logger.error('Error sending campaign:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process campaign sending in batches
   */
  async processCampaignSending(campaign, subscribers) {
    const batches = this.chunkArray(subscribers, this.batchSize);
    let sentCount = 0;
    let deliveredCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      // Check if campaign was paused or cancelled
      const currentCampaign = await EmailCampaign.findById(campaign._id);
      if (currentCampaign.status === 'paused' || currentCampaign.status === 'cancelled') {
        logger.info(`Campaign ${campaign._id} was ${currentCampaign.status}, stopping`);
        break;
      }
      
      const batch = batches[i];
      const results = await Promise.allSettled(
        batch.map(subscriber => this.sendToSubscriber(campaign, subscriber))
      );
      
      // Process results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          sentCount++;
          if (result.value.delivered) deliveredCount++;
        } else {
          errorCount++;
          campaign.sendingProgress.errors.push({
            subscriberId: batch[index]._id,
            email: batch[index].email,
            error: result.reason?.message || result.value?.error || 'Unknown error',
            timestamp: new Date()
          });
        }
      });
      
      // Update progress
      campaign.sendingProgress.currentBatch = i + 1;
      campaign.sendingProgress.lastProcessedAt = new Date();
      campaign.analytics.sent = sentCount;
      campaign.analytics.delivered = deliveredCount;
      await campaign.save();
      
      // Delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        await this.delay(this.batchDelay);
      }
    }
    
    // Mark campaign as complete
    campaign.status = 'sent';
    campaign.sendingProgress.completedAt = new Date();
    await campaign.save();
    
    logger.info(`Campaign ${campaign._id} completed`, { sent: sentCount, delivered: deliveredCount, errors: errorCount });
  }

  /**
   * Send email to a single subscriber
   */
  async sendToSubscriber(campaign, subscriber) {
    try {
      // Generate personalized content
      const personalizedHtml = this.personalizeContent(campaign.content.html, subscriber, campaign);
      
      // Add tracking pixel for open tracking
      const trackedHtml = this.addOpenTracking(personalizedHtml, campaign._id, subscriber._id);
      
      // Replace links with tracked links
      const finalHtml = this.addClickTracking(trackedHtml, campaign._id, subscriber._id);
      
      // Send email
      const result = await EmailService.sendEmail(
        subscriber.email,
        this.personalizeSubject(campaign.subject, subscriber),
        finalHtml
      );
      
      if (result.success) {
        // Record sent event
        await EmailEvent.recordEvent({
          campaign: campaign._id,
          subscriber: subscriber._id,
          email: subscriber.email,
          eventType: 'sent',
          messageId: result.messageId
        });
        
        // Update subscriber
        await subscriber.recordEmailSent(campaign._id);
        
        // Update daily stats
        await EmailDailyStats.updateStats(new Date(), campaign._id, { sent: 1 });
        
        return { success: true, delivered: true };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      logger.error(`Error sending to ${subscriber.email}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get target audience for a campaign
   */
  async getTargetAudience(campaign) {
    const query = {
      status: 'subscribed',
      isDeleted: false
    };
    
    const audience = campaign.audience;
    
    // Filter by preference based on campaign type
    const preferenceMap = {
      newsletter: 'newsletter',
      promotional: 'promotional',
      announcement: 'announcements',
      digest: 'weeklyDigest'
    };
    
    if (preferenceMap[campaign.type]) {
      query[`preferences.${preferenceMap[campaign.type]}`] = true;
    }
    
    // Filter by roles
    if (audience.roles && audience.roles.length > 0) {
      // Need to join with User collection
      const User = require('../models/User');
      const usersWithRoles = await User.find({ roles: { $in: audience.roles } }).select('_id');
      const userIds = usersWithRoles.map(u => u._id);
      query.user = { $in: userIds };
    }
    
    // Filter by location
    if (audience.locations && audience.locations.length > 0) {
      const locationConditions = audience.locations.map(loc => {
        const condition = {};
        if (loc.city) condition['location.city'] = loc.city;
        if (loc.state) condition['location.state'] = loc.state;
        if (loc.country) condition['location.country'] = loc.country;
        return condition;
      });
      query.$or = locationConditions;
    }
    
    // Filter by tags
    if (audience.tags && audience.tags.length > 0) {
      query.tags = { $in: audience.tags };
    }
    
    // Filter by specific subscriber IDs
    if (audience.type === 'manual' && audience.subscriberIds?.length > 0) {
      query._id = { $in: audience.subscriberIds };
    }
    
    // Exclude specific subscribers
    if (audience.excludeIds && audience.excludeIds.length > 0) {
      query._id = { ...query._id, $nin: audience.excludeIds };
    }
    
    // Activity filters
    if (audience.activityFilter) {
      const af = audience.activityFilter;
      
      if (af.lastActiveWithin) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - af.lastActiveWithin);
        query['engagement.lastOpenedAt'] = { $gte: cutoff };
      }
      
      if (af.registeredAfter) {
        query.subscribedAt = { $gte: af.registeredAfter };
      }
      
      if (af.registeredBefore) {
        query.subscribedAt = { ...query.subscribedAt, $lte: af.registeredBefore };
      }
    }
    
    return EmailSubscriber.find(query);
  }

  /**
   * Estimate audience size for a campaign
   */
  async estimateAudience(audience) {
    try {
      // Build same query as getTargetAudience but just count
      const query = {
        status: 'subscribed',
        isDeleted: false
      };
      
      // Apply basic filters
      if (audience.roles && audience.roles.length > 0) {
        const User = require('../models/User');
        const usersWithRoles = await User.find({ roles: { $in: audience.roles } }).select('_id');
        query.user = { $in: usersWithRoles.map(u => u._id) };
      }
      
      if (audience.locations && audience.locations.length > 0) {
        const locationConditions = audience.locations.map(loc => {
          const condition = {};
          if (loc.city) condition['location.city'] = loc.city;
          if (loc.state) condition['location.state'] = loc.state;
          if (loc.country) condition['location.country'] = loc.country;
          return condition;
        });
        query.$or = locationConditions;
      }
      
      const count = await EmailSubscriber.countDocuments(query);
      return { success: true, data: { estimatedRecipients: count } };
    } catch (error) {
      logger.error('Error estimating audience:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== TRACKING ====================

  /**
   * Record email open
   */
  async recordOpen(campaignId, subscriberId, metadata = {}) {
    try {
      const [campaign, subscriber] = await Promise.all([
        EmailCampaign.findById(campaignId),
        EmailSubscriber.findById(subscriberId)
      ]);
      
      if (!campaign || !subscriber) {
        return { success: false, error: 'Campaign or subscriber not found' };
      }
      
      // Check if this is a unique open
      const existingOpen = await EmailEvent.findOne({
        campaign: campaignId,
        subscriber: subscriberId,
        eventType: 'opened'
      });
      
      const isUnique = !existingOpen;
      
      // Record event
      await EmailEvent.recordEvent({
        campaign: campaignId,
        subscriber: subscriberId,
        email: subscriber.email,
        eventType: 'opened',
        deviceInfo: metadata.deviceInfo,
        location: metadata.location,
        isUnique
      });
      
      // Update campaign analytics
      await campaign.incrementOpen(isUnique);
      
      // Update subscriber engagement
      await subscriber.recordOpen(campaignId);
      
      // Update daily stats
      const statsUpdate = { opens: 1 };
      if (isUnique) statsUpdate.uniqueOpens = 1;
      await EmailDailyStats.updateStats(new Date(), campaignId, statsUpdate);
      
      return { success: true };
    } catch (error) {
      logger.error('Error recording open:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record link click
   */
  async recordClick(campaignId, subscriberId, linkUrl, metadata = {}) {
    try {
      const [campaign, subscriber] = await Promise.all([
        EmailCampaign.findById(campaignId),
        EmailSubscriber.findById(subscriberId)
      ]);
      
      if (!campaign || !subscriber) {
        return { success: false, error: 'Campaign or subscriber not found' };
      }
      
      // Check if this is a unique click
      const existingClick = await EmailEvent.findOne({
        campaign: campaignId,
        subscriber: subscriberId,
        eventType: 'clicked'
      });
      
      const isUnique = !existingClick;
      
      // Find link label
      const link = campaign.links.find(l => l.url === linkUrl);
      
      // Record event
      await EmailEvent.recordEvent({
        campaign: campaignId,
        subscriber: subscriberId,
        email: subscriber.email,
        eventType: 'clicked',
        metadata: {
          linkUrl,
          linkLabel: link?.label
        },
        deviceInfo: metadata.deviceInfo,
        location: metadata.location,
        isUnique
      });
      
      // Update campaign analytics
      await campaign.incrementClick(linkUrl, isUnique);
      
      // Update subscriber engagement
      await subscriber.recordClick(campaignId, linkUrl);
      
      // Update daily stats
      const statsUpdate = { clicks: 1 };
      if (isUnique) statsUpdate.uniqueClicks = 1;
      await EmailDailyStats.updateStats(new Date(), campaignId, statsUpdate);
      
      return { success: true };
    } catch (error) {
      logger.error('Error recording click:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record bounce
   */
  async recordBounce(campaignId, subscriberId, bounceType, reason) {
    try {
      const [campaign, subscriber] = await Promise.all([
        EmailCampaign.findById(campaignId),
        EmailSubscriber.findById(subscriberId)
      ]);
      
      if (!campaign || !subscriber) {
        return { success: false, error: 'Campaign or subscriber not found' };
      }
      
      // Record event
      await EmailEvent.recordEvent({
        campaign: campaignId,
        subscriber: subscriberId,
        email: subscriber.email,
        eventType: 'bounced',
        metadata: {
          bounceType,
          bounceReason: reason
        }
      });
      
      // Update campaign
      await campaign.recordBounce(bounceType);
      
      // Update subscriber
      await subscriber.recordBounce(bounceType, reason);
      
      // Update daily stats
      await EmailDailyStats.updateStats(new Date(), campaignId, { bounces: 1 });
      
      return { success: true };
    } catch (error) {
      logger.error('Error recording bounce:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== SUBSCRIBER MANAGEMENT ====================

  /**
   * Subscribe a new email
   */
  async subscribe(email, data = {}) {
    try {
      // Check if already exists
      let subscriber = await EmailSubscriber.findByEmail(email);
      
      if (subscriber) {
        if (subscriber.status === 'subscribed') {
          return { success: false, error: 'Email already subscribed' };
        }
        
        // Resubscribe
        await subscriber.resubscribe();
        return { success: true, data: subscriber, message: 'Successfully resubscribed' };
      }
      
      // Create new subscriber
      subscriber = await EmailSubscriber.create({
        email,
        ...data,
        status: data.doubleOptIn === false ? 'subscribed' : 'pending'
      });
      
      // Send confirmation email if double opt-in required
      if (subscriber.status === 'pending') {
        await this.sendConfirmationEmail(subscriber);
      }
      
      logger.info(`New subscriber: ${email}`);
      return { success: true, data: subscriber };
    } catch (error) {
      logger.error('Error subscribing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirm subscription (double opt-in)
   */
  async confirmSubscription(token) {
    try {
      const subscriber = await EmailSubscriber.findByConfirmationToken(token);
      
      if (!subscriber) {
        return { success: false, error: 'Invalid or expired confirmation token' };
      }
      
      await subscriber.confirmSubscription();
      
      logger.info(`Subscription confirmed: ${subscriber.email}`);
      return { success: true, data: subscriber };
    } catch (error) {
      logger.error('Error confirming subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unsubscribe by token
   */
  async unsubscribe(token, reason, feedback) {
    try {
      const subscriber = await EmailSubscriber.findByUnsubscribeToken(token);
      
      if (!subscriber) {
        return { success: false, error: 'Invalid unsubscribe token' };
      }
      
      await subscriber.unsubscribe(reason, feedback);
      
      logger.info(`Unsubscribed: ${subscriber.email}`);
      return { success: true, message: 'Successfully unsubscribed' };
    } catch (error) {
      logger.error('Error unsubscribing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update subscriber preferences
   */
  async updatePreferences(subscriberId, preferences) {
    try {
      const subscriber = await EmailSubscriber.findById(subscriberId);
      
      if (!subscriber) {
        return { success: false, error: 'Subscriber not found' };
      }
      
      await subscriber.updatePreferences(preferences);
      
      return { success: true, data: subscriber };
    } catch (error) {
      logger.error('Error updating preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get subscriber by ID or email
   */
  async getSubscriber(identifier) {
    try {
      let subscriber;
      
      if (identifier.includes('@')) {
        subscriber = await EmailSubscriber.findByEmail(identifier);
      } else {
        subscriber = await EmailSubscriber.findById(identifier);
      }
      
      if (!subscriber || subscriber.isDeleted) {
        return { success: false, error: 'Subscriber not found' };
      }
      
      return { success: true, data: subscriber };
    } catch (error) {
      logger.error('Error getting subscriber:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List subscribers with filters
   */
  async listSubscribers(options = {}) {
    try {
      const { page = 1, limit = 50, status, tags, lists, search, sortBy = 'subscribedAt', sortOrder = 'desc' } = options;
      
      const query = { isDeleted: false };
      
      if (status) query.status = status;
      if (tags && tags.length) query.tags = { $in: tags };
      if (lists && lists.length) query.lists = { $in: lists };
      if (search) {
        query.$text = { $search: search };
      }
      
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
      
      const [subscribers, total] = await Promise.all([
        EmailSubscriber.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit),
        EmailSubscriber.countDocuments(query)
      ]);
      
      return {
        success: true,
        data: {
          subscribers,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      logger.error('Error listing subscribers:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import subscribers from array
   */
  async importSubscribers(subscribers, options = {}) {
    try {
      const results = {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };
      
      for (const sub of subscribers) {
        try {
          if (!sub.email) {
            results.skipped++;
            continue;
          }
          
          const existing = await EmailSubscriber.findByEmail(sub.email);
          
          if (existing) {
            if (options.updateExisting) {
              Object.assign(existing, sub);
              existing.source = 'import';
              await existing.save();
              results.updated++;
            } else {
              results.skipped++;
            }
          } else {
            await EmailSubscriber.create({
              ...sub,
              source: 'import',
              status: options.confirmStatus || 'subscribed',
              doubleOptIn: { required: false, confirmed: true }
            });
            results.imported++;
          }
        } catch (error) {
          results.errors.push({ email: sub.email, error: error.message });
        }
      }
      
      logger.info(`Subscribers imported`, results);
      return { success: true, data: results };
    } catch (error) {
      logger.error('Error importing subscribers:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId) {
    try {
      const campaign = await EmailCampaign.findById(campaignId);
      
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }
      
      const [eventAnalytics, linkClicks, deviceBreakdown, locationBreakdown, hourlyDistribution] = await Promise.all([
        EmailEvent.getCampaignAnalytics(campaignId),
        EmailEvent.getClicksByLink(campaignId),
        EmailEvent.getDeviceBreakdown(campaignId),
        EmailEvent.getLocationBreakdown(campaignId),
        EmailEvent.getHourlyDistribution(campaignId)
      ]);
      
      return {
        success: true,
        data: {
          overview: {
            ...campaign.analytics,
            openRate: campaign.openRate,
            clickRate: campaign.clickRate,
            bounceRate: campaign.bounceRate,
            unsubscribeRate: campaign.unsubscribeRate,
            deliveryRate: campaign.deliveryRate
          },
          events: eventAnalytics,
          linkClicks,
          deviceBreakdown,
          locationBreakdown,
          hourlyDistribution
        }
      };
    } catch (error) {
      logger.error('Error getting campaign analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get overall email marketing stats
   */
  async getOverallStats(startDate, endDate) {
    try {
      const [campaignStats, subscriberStats, eventStats, dailyStats] = await Promise.all([
        EmailCampaign.getCampaignStats(startDate, endDate),
        EmailSubscriber.getSubscriberStats(),
        EmailEvent.getOverallStats(startDate, endDate),
        EmailDailyStats.getAggregatedStats(startDate, endDate)
      ]);
      
      return {
        success: true,
        data: {
          campaigns: campaignStats,
          subscribers: subscriberStats,
          events: eventStats,
          aggregated: dailyStats[0] || {}
        }
      };
    } catch (error) {
      logger.error('Error getting overall stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get top performing campaigns
   */
  async getTopCampaigns(limit = 10, metric = 'openRate') {
    try {
      const campaigns = await EmailCampaign.getTopPerformingCampaigns(limit, metric);
      return { success: true, data: campaigns };
    } catch (error) {
      logger.error('Error getting top campaigns:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Personalize email content with subscriber data
   */
  personalizeContent(html, subscriber, campaign) {
    const data = {
      firstName: subscriber.firstName || 'there',
      lastName: subscriber.lastName || '',
      fullName: subscriber.fullName,
      email: subscriber.email,
      unsubscribeUrl: `${this.apiDomain}/api/email-marketing/unsubscribe/${subscriber.unsubscribeToken}`,
      preferencesUrl: `${this.trackingDomain}/email-preferences/${subscriber._id}`,
      campaignName: campaign.name,
      currentYear: new Date().getFullYear()
    };
    
    // Add custom fields
    if (subscriber.customFields) {
      subscriber.customFields.forEach((value, key) => {
        data[key] = value;
      });
    }
    
    return templateEngine.replacePlaceholders(html, data);
  }

  /**
   * Personalize subject line
   */
  personalizeSubject(subject, subscriber) {
    return subject
      .replace(/\{\{firstName\}\}/g, subscriber.firstName || 'there')
      .replace(/\{\{lastName\}\}/g, subscriber.lastName || '')
      .replace(/\{\{email\}\}/g, subscriber.email);
  }

  /**
   * Add open tracking pixel
   */
  addOpenTracking(html, campaignId, subscriberId) {
    const trackingPixel = `<img src="${this.apiDomain}/api/email-marketing/track/open/${campaignId}/${subscriberId}" width="1" height="1" style="display:none;" alt="" />`;
    
    // Insert before closing body tag
    if (html.includes('</body>')) {
      return html.replace('</body>', `${trackingPixel}</body>`);
    }
    
    return html + trackingPixel;
  }

  /**
   * Replace links with tracked links
   */
  addClickTracking(html, campaignId, subscriberId) {
    const linkRegex = /href="(https?:\/\/[^"]+)"/g;
    
    return html.replace(linkRegex, (match, url) => {
      // Don't track unsubscribe links
      if (url.includes('unsubscribe')) {
        return match;
      }
      
      const encodedUrl = encodeURIComponent(url);
      const trackedUrl = `${this.apiDomain}/api/email-marketing/track/click/${campaignId}/${subscriberId}?url=${encodedUrl}`;
      return `href="${trackedUrl}"`;
    });
  }

  /**
   * Extract links from HTML content
   */
  extractLinks(html) {
    const linkRegex = /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([^<]*)<\/a>/g;
    const links = [];
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      links.push({
        url: match[1],
        label: match[2].trim() || match[1],
        clicks: 0
      });
    }
    
    return links;
  }

  /**
   * Send confirmation email for double opt-in
   */
  async sendConfirmationEmail(subscriber) {
    const token = subscriber.generateConfirmationToken();
    await subscriber.save();
    
    const confirmUrl = `${this.apiDomain}/api/email-marketing/confirm/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #667eea; margin: 0; }
          .content { color: #333; line-height: 1.6; }
          .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LocalPro</h1>
          </div>
          <div class="content">
            <h2>Confirm Your Subscription</h2>
            <p>Hi ${subscriber.firstName || 'there'},</p>
            <p>Thank you for subscribing to LocalPro updates! Please confirm your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${confirmUrl}" class="button">Confirm Subscription</a>
            </p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't subscribe to our newsletter, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LocalPro Super App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return EmailService.sendEmail(subscriber.email, 'Confirm your LocalPro subscription', html);
  }

  /**
   * Chunk array into batches
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate tracking ID
   */
  generateTrackingId() {
    return crypto.randomBytes(16).toString('hex');
  }
}

module.exports = new EmailMarketingService();


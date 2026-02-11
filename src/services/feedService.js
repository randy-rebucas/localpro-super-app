const Feed = require('../models/Feed');
const Activity = require('../models/Activity');
const Job = require('../models/Job');
const Ad = require('../models/Ads');
const Academy = require('../models/Academy');
const Agency = require('../models/Agency');
// const Rental = require('../models/Rentals');
// const Referral = require('../models/Referral');
const { logger } = require('../utils/logger');

/**
 * FeedService - Unified feed aggregation and management
 * 
 * This service provides:
 * - Content aggregation from multiple sources
 * - Personalized feed generation
 * - Feed item creation and management
 * - Trending and featured content
 * - Feed analytics and insights
 */
class FeedService {
  /**
   * Get aggregated feed for user
   * Combines native feed items with real-time content from various sources
   */
  async getAggregatedFeed(user, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        contentTypes = [],
        categories = [],
        timeframe = '7d',
        sortBy = 'relevance',
        includeRealtime = true
      } = options;

      // Get feed items from Feed collection
      const feedResult = await Feed.getPersonalizedFeed(user, {
        page,
        limit,
        contentTypes,
        categories,
        timeframe,
        sortBy
      });

      // Optionally enrich with real-time content
      if (includeRealtime && page === 1) {
        const realtimeItems = await this.getRealtimeContent(user, {
          limit: Math.min(5, limit),
          contentTypes,
          categories
        });

        // Merge and sort
        feedResult.items = this.mergeFeedItems(feedResult.items, realtimeItems, sortBy);
      }

      return feedResult;
    } catch (error) {
      logger.error('Failed to get aggregated feed', error, { userId: user.id });
      throw error;
    }
  }

  /**
   * Get real-time content from various sources
   */
  async getRealtimeContent(user, options = {}) {
    const { limit = 5, contentTypes = [] } = options; // categories = []
    const items = [];

    try {
      // Fetch from multiple sources in parallel
      const promises = [];

      if (!contentTypes.length || contentTypes.includes('job')) {
        promises.push(this.getRecentJobs(user, 2));
      }

      if (!contentTypes.length || contentTypes.includes('course')) {
        promises.push(this.getRecentCourses(user, 2));
      }

      if (!contentTypes.length || contentTypes.includes('ad') || contentTypes.includes('promo')) {
        promises.push(this.getRecentAdsPromos(user, 2));
      }

      if (!contentTypes.length || contentTypes.includes('activity')) {
        promises.push(this.getRecentActivities(user, 2));
      }

      if (!contentTypes.length || contentTypes.includes('agency')) {
        promises.push(this.getRecentAgencies(user, 1));
      }

      const results = await Promise.allSettled(promises);
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          items.push(...result.value);
        }
      });

      // Sort by recency and limit
      return items
        .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get realtime content', error);
      return items;
    }
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(user, limit = 5) {
    try {
      const jobs = await Job.find({
        status: 'open',
        isDeleted: false,
        expiresAt: { $gt: new Date() }
      })
      .populate('employer', 'firstName lastName avatar')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

      return jobs.map(job => ({
        _id: job._id,
        contentType: 'job',
        contentId: job._id,
        contentModel: 'Job',
        author: job.employer,
        title: job.title,
        description: job.description?.substring(0, 200),
        summary: `${job.company?.name} is hiring: ${job.title}`,
        category: job.category?.name,
        media: job.company?.logo ? {
          type: 'image',
          url: job.company.logo.url,
          thumbnail: job.company.logo.url
        } : null,
        publishedAt: job.createdAt,
        cta: {
          text: 'Apply Now',
          type: 'apply'
        },
        metadata: {
          salary: job.salary,
          location: job.company?.location,
          type: job.type
        }
      }));
    } catch (error) {
      logger.error('Failed to get recent jobs', error);
      return [];
    }
  }

  /**
   * Get recent courses
   */
  async getRecentCourses(user, limit = 5) {
    try {
      const courses = await Academy.find({
        status: 'published',
        isDeleted: false
      })
      .populate('instructor', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

      return courses.map(course => ({
        _id: course._id,
        contentType: 'course',
        contentId: course._id,
        contentModel: 'Academy',
        author: course.instructor,
        title: course.title,
        description: course.description?.substring(0, 200),
        summary: `New course: ${course.title}`,
        category: course.category,
        media: course.thumbnail ? {
          type: 'image',
          url: course.thumbnail.url,
          thumbnail: course.thumbnail.url
        } : null,
        publishedAt: course.createdAt,
        cta: {
          text: 'Enroll Now',
          type: 'enroll'
        },
        metadata: {
          duration: course.duration,
          level: course.level,
          price: course.pricing?.amount,
          enrollmentCount: course.enrollments?.length
        }
      }));
    } catch (error) {
      logger.error('Failed to get recent courses', error);
      return [];
    }
  }

  /**
   * Get recent ads and promos
   */
  async getRecentAdsPromos(user, limit = 5) {
    try {
      const ads = await Ad.find({
        status: 'active',
        isDeleted: false,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      })
      .populate('createdBy', 'firstName lastName avatar')
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit)
      .lean();

      return ads.map(ad => ({
        _id: ad._id,
        contentType: ad.type === 'promotional' ? 'promo' : 'ad',
        contentId: ad._id,
        contentModel: 'Ad',
        author: ad.createdBy,
        title: ad.title,
        description: ad.description?.substring(0, 200),
        summary: ad.title,
        category: ad.category,
        media: ad.images?.[0] ? {
          type: 'image',
          url: ad.images[0].url,
          thumbnail: ad.images[0].url
        } : null,
        images: ad.images,
        publishedAt: ad.startDate,
        isFeatured: ad.priority > 5,
        cta: ad.callToAction ? {
          text: ad.callToAction.text,
          url: ad.callToAction.url,
          type: 'link'
        } : null,
        metadata: {
          discount: ad.discount,
          validUntil: ad.endDate
        }
      }));
    } catch (error) {
      logger.error('Failed to get recent ads/promos', error);
      return [];
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(user, limit = 5) {
    try {
      const activities = await Activity.find({
        isDeleted: false,
        isVisible: true,
        visibility: 'public'
      })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

      return activities.map(activity => ({
        _id: activity._id,
        contentType: 'activity',
        contentId: activity._id,
        contentModel: 'Activity',
        author: activity.user,
        title: activity.action,
        description: activity.description,
        summary: activity.description,
        category: activity.category,
        publishedAt: activity.createdAt,
        metadata: {
          type: activity.type,
          points: activity.points
        }
      }));
    } catch (error) {
      logger.error('Failed to get recent activities', error);
      return [];
    }
  }

  /**
   * Get recent agencies
   */
  async getRecentAgencies(user, limit = 3) {
    try {
      const agencies = await Agency.find({
        status: 'active',
        isDeleted: false
      })
      .populate('owner', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

      return agencies.map(agency => ({
        _id: agency._id,
        contentType: 'agency',
        contentId: agency._id,
        contentModel: 'Agency',
        author: agency.owner,
        title: agency.name,
        description: agency.description?.substring(0, 200),
        summary: `New agency: ${agency.name}`,
        category: 'agency',
        media: agency.logo ? {
          type: 'image',
          url: agency.logo.url,
          thumbnail: agency.logo.url
        } : null,
        publishedAt: agency.createdAt,
        cta: {
          text: 'View Agency',
          type: 'view'
        },
        metadata: {
          memberCount: agency.members?.length,
          location: agency.location
        }
      }));
    } catch (error) {
      logger.error('Failed to get recent agencies', error);
      return [];
    }
  }

  /**
   * Merge and sort feed items
   */
  mergeFeedItems(feedItems, realtimeItems, sortBy = 'relevance') {
    const merged = [...feedItems];
    
    // Add realtime items that aren't already in feed
    realtimeItems.forEach(rtItem => {
      const exists = merged.some(item => 
        item.contentId?.toString() === rtItem.contentId?.toString() &&
        item.contentType === rtItem.contentType
      );
      
      if (!exists) {
        merged.push(rtItem);
      }
    });

    // Sort merged items
    switch (sortBy) {
      case 'recent':
        return merged.sort((a, b) => 
          new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt)
        );
      case 'trending':
        return merged.sort((a, b) => 
          (b.analytics?.engagementRate || 0) - (a.analytics?.engagementRate || 0)
        );
      case 'popular':
        return merged.sort((a, b) => 
          (b.analytics?.views || 0) - (a.analytics?.views || 0)
        );
      default: // relevance
        return merged.sort((a, b) => {
          const aScore = (a.isFeatured ? 1000 : 0) + (a.priority || 0);
          const bScore = (b.isFeatured ? 1000 : 0) + (b.priority || 0);
          if (aScore !== bScore) return bScore - aScore;
          return new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt);
        });
    }
  }

  /**
   * Create feed item
   */
  async createFeedItem(contentType, contentId, data) {
    try {
      const feedItem = new Feed({
        contentType,
        contentId,
        ...data
      });

      await feedItem.save();
      await feedItem.populate('author', 'firstName lastName avatar role');

      logger.info('Feed item created', {
        feedItemId: feedItem._id,
        contentType,
        contentId
      });

      return feedItem;
    } catch (error) {
      logger.error('Failed to create feed item', error, { contentType, contentId });
      throw error;
    }
  }

  /**
   * Get trending content
   */
  async getTrending(options = {}) {
    const { limit = 10, timeframe = '24h' } = options;
    
    try {
      return await Feed.getTrending(limit, timeframe);
    } catch (error) {
      logger.error('Failed to get trending content', error);
      throw error;
    }
  }

  /**
   * Get featured content
   */
  async getFeatured(limit = 5) {
    try {
      return await Feed.getFeatured(limit);
    } catch (error) {
      logger.error('Failed to get featured content', error);
      throw error;
    }
  }

  /**
   * Track feed item view
   */
  async trackView(feedItemId, userId) {
    try {
      const feedItem = await Feed.findById(feedItemId);
      if (!feedItem) {
        throw new Error('Feed item not found');
      }

      await feedItem.addInteraction(userId, 'view');
      
      logger.info('Feed view tracked', { feedItemId, userId });
      return feedItem;
    } catch (error) {
      logger.error('Failed to track feed view', error, { feedItemId, userId });
      throw error;
    }
  }

  /**
   * Track feed item interaction
   */
  async trackInteraction(feedItemId, userId, type) {
    try {
      const feedItem = await Feed.findById(feedItemId);
      if (!feedItem) {
        throw new Error('Feed item not found');
      }

      await feedItem.addInteraction(userId, type);
      
      logger.info('Feed interaction tracked', { feedItemId, userId, type });
      return feedItem;
    } catch (error) {
      logger.error('Failed to track feed interaction', error, { feedItemId, userId, type });
      throw error;
    }
  }

  /**
   * Get feed analytics
   */
  async getFeedAnalytics(userId, timeframe = '30d') {
    try {
      const timeframes = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000
      };

      const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['30d']));

      const feedItems = await Feed.find({
        author: userId,
        isDeleted: false,
        publishedAt: { $gte: since }
      });

      const analytics = {
        totalItems: feedItems.length,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalComments: 0,
        totalEngagement: 0,
        averageEngagementRate: 0,
        byContentType: {}
      };

      feedItems.forEach(item => {
        analytics.totalViews += item.analytics.views;
        analytics.totalLikes += item.analytics.likes;
        analytics.totalShares += item.analytics.shares;
        analytics.totalComments += item.analytics.comments;
        analytics.totalEngagement += item.analytics.likes + item.analytics.shares + item.analytics.comments;

        if (!analytics.byContentType[item.contentType]) {
          analytics.byContentType[item.contentType] = {
            count: 0,
            views: 0,
            engagement: 0
          };
        }

        analytics.byContentType[item.contentType].count += 1;
        analytics.byContentType[item.contentType].views += item.analytics.views;
        analytics.byContentType[item.contentType].engagement += 
          item.analytics.likes + item.analytics.shares + item.analytics.comments;
      });

      if (feedItems.length > 0) {
        analytics.averageEngagementRate = 
          feedItems.reduce((sum, item) => sum + item.analytics.engagementRate, 0) / feedItems.length;
      }

      return analytics;
    } catch (error) {
      logger.error('Failed to get feed analytics', error, { userId });
      throw error;
    }
  }

  /**
   * Auto-generate feed items from new content
   * This should be called when new content is created
   */
  async autoGenerateFeedItem(contentType, content) {
    try {
      // Determine if content should be added to feed
      const shouldAddToFeed = this.shouldAddToFeed(contentType, content);
      
      if (!shouldAddToFeed) {
        return null;
      }

      // Extract feed data from content
      const feedData = this.extractFeedData(contentType, content);
      
      // Create feed item
      return await this.createFeedItem(contentType, content._id, feedData);
    } catch (error) {
      logger.error('Failed to auto-generate feed item', error, { contentType });
      return null;
    }
  }

  /**
   * Check if content should be added to feed
   */
  shouldAddToFeed(contentType, content) {
    // Add business logic here
    // For example, only published content, non-private items, etc.
    
    if (content.isDeleted || content.status === 'draft') {
      return false;
    }

    if (content.visibility === 'private') {
      return false;
    }

    return true;
  }

  /**
   * Extract feed data from content
   */
  extractFeedData(contentType, content) {
    const data = {
      author: content.userId || content.user || content.createdBy || content.author,
      publishedAt: content.publishedAt || content.createdAt,
      status: 'active'
    };

    // Content-specific extraction
    switch (contentType) {
      case 'job':
        return {
          ...data,
          title: content.title,
          description: content.description,
          summary: `${content.company?.name} is hiring: ${content.title}`,
          category: 'jobs',
          contentModel: 'Job'
        };

      case 'course':
        return {
          ...data,
          title: content.title,
          description: content.description,
          summary: `New course: ${content.title}`,
          category: content.category,
          contentModel: 'Academy'
        };

      case 'ad':
      case 'promo':
        return {
          ...data,
          title: content.title,
          description: content.description,
          summary: content.title,
          category: content.category,
          contentModel: 'Ad',
          isFeatured: content.priority > 5
        };

      default:
        return {
          ...data,
          title: content.title || content.name || 'New content',
          description: content.description || '',
          summary: content.summary || content.description || '',
          category: content.category || contentType,
          contentModel: 'Activity'
        };
    }
  }
}

module.exports = new FeedService();

const Provider = require('../models/Provider');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { auditLogger } = require('../utils/auditLogger');
const { validationResult } = require('express-validator');

// Get all providers with filtering and pagination
const getProviders = async (req, res) => {
  try {
    const {
      status,
      providerType,
      category,
      city,
      state,
      minRating,
      maxDistance,
      lat,
      lng,
      featured,
      promoted,
      page = 1,
      limit = 20,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    const query = { status: 'active' };

    // Apply filters
    if (status) query.status = status;
    if (providerType) query.providerType = providerType;
    if (featured) query['metadata.featured'] = featured === 'true';
    if (promoted) query['metadata.promoted'] = promoted === 'true';
    if (minRating) query['performance.rating'] = { $gte: parseFloat(minRating) };

    // Category filter
    if (category) {
      query['professionalInfo.specialties.category'] = category;
    }

    // Location filter
    if (city && state) {
      query['professionalInfo.specialties.serviceAreas'] = {
        $elemMatch: { city, state }
      };
    }

    // Distance filter (if coordinates provided)
    if (lat && lng && maxDistance) {
      // This would require a more complex query with geospatial calculations
      // For now, we'll filter by city/state
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const providers = await Provider.find(query)
      .populate('userId', 'firstName lastName email phone profileImage')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-financialInfo -verification.backgroundCheck -verification.insurance.documents');

    const total = await Provider.countDocuments(query);

    logger.info('Providers retrieved', {
      userId: req.user?.id,
      filters: { status, providerType, category, city, state },
      resultCount: providers.length,
      totalCount: total
    });

    res.json({
      success: true,
      data: providers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to get providers', error, {
      userId: req.user?.id,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve providers'
    });
  }
};

// Get single provider by ID
const getProvider = async (req, res) => {
  try {
    const { id } = req.params;
    
    const provider = await Provider.findById(id)
      .populate('userId', 'firstName lastName email phone profileImage')
      .select('-financialInfo -verification.backgroundCheck -verification.insurance.documents');

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Increment profile views
    provider.metadata.profileViews += 1;
    await provider.save();

    logger.info('Provider retrieved', {
      userId: req.user?.id,
      providerId: id,
      profileViews: provider.metadata.profileViews
    });

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    logger.error('Failed to get provider', error, {
      userId: req.user?.id,
      providerId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve provider'
    });
  }
};

// Get current user's provider profile
const getMyProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.id })
      .populate('userId', 'firstName lastName email phone profileImage');

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found. Please complete your provider registration.'
      });
    }

    logger.info('Provider profile retrieved', {
      userId: req.user.id,
      providerId: provider._id,
      status: provider.status
    });

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    logger.error('Failed to get provider profile', error, {
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve provider profile'
    });
  }
};

// Create provider profile (upgrade from client)
const createProviderProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user already has a provider profile
    const existingProvider = await Provider.findOne({ userId: req.user.id });
    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: 'Provider profile already exists'
      });
    }

    // Check if user has client role
    if (req.user.role !== 'client') {
      return res.status(400).json({
        success: false,
        message: 'Only clients can upgrade to provider status'
      });
    }

    const {
      providerType,
      businessInfo,
      professionalInfo,
      verification,
      preferences,
      settings
    } = req.body;

    const providerData = {
      userId: req.user.id,
      providerType,
      businessInfo,
      professionalInfo,
      verification,
      preferences,
      settings,
      status: 'pending',
      onboarding: {
        completed: false,
        currentStep: 'profile_setup',
        progress: 10,
        steps: [
          { step: 'profile_setup', completed: true, completedAt: new Date() }
        ]
      }
    };

    const provider = new Provider(providerData);
    await provider.save();

    // Update user role to include provider
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { roles: 'provider' },
      role: 'provider'
    });

    // Log audit event
    await auditLogger.logUser('user_create', req, {
      type: 'provider',
      id: provider._id,
      name: 'Provider Profile'
    }, {
      providerType,
      status: 'pending'
    });

    logger.info('Provider profile created', {
      userId: req.user.id,
      providerId: provider._id,
      providerType
    });

    res.status(201).json({
      success: true,
      message: 'Provider profile created successfully',
      data: provider
    });
  } catch (error) {
    logger.error('Failed to create provider profile', error, {
      userId: req.user.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create provider profile'
    });
  }
};

// Update provider profile
const updateProviderProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    const updateData = req.body;
    const oldData = { ...provider.toObject() };

    // Update provider
    Object.assign(provider, updateData);
    await provider.save();

    // Log audit event
    await auditLogger.logUser('user_update', req, {
      type: 'provider',
      id: provider._id,
      name: 'Provider Profile'
    }, {
      before: oldData,
      after: updateData,
      fields: Object.keys(updateData)
    });

    logger.info('Provider profile updated', {
      userId: req.user.id,
      providerId: provider._id,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Provider profile updated successfully',
      data: provider
    });
  } catch (error) {
    logger.error('Failed to update provider profile', error, {
      userId: req.user.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update provider profile'
    });
  }
};

// Update provider onboarding step
const updateOnboardingStep = async (req, res) => {
  try {
    const { step, data } = req.body;

    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    // Update onboarding step
    const stepIndex = provider.onboarding.steps.findIndex(s => s.step === step);
    if (stepIndex >= 0) {
      provider.onboarding.steps[stepIndex].completed = true;
      provider.onboarding.steps[stepIndex].completedAt = new Date();
      provider.onboarding.steps[stepIndex].data = data;
    } else {
      provider.onboarding.steps.push({
        step,
        completed: true,
        completedAt: new Date(),
        data
      });
    }

    // Update progress
    const completedSteps = provider.onboarding.steps.filter(s => s.completed).length;
    const totalSteps = 8; // Total onboarding steps
    provider.onboarding.progress = Math.round((completedSteps / totalSteps) * 100);

    // Check if onboarding is complete
    if (provider.onboarding.progress >= 100) {
      provider.onboarding.completed = true;
      provider.status = 'pending'; // Ready for review
    }

    await provider.save();

    logger.info('Provider onboarding step updated', {
      userId: req.user.id,
      providerId: provider._id,
      step,
      progress: provider.onboarding.progress
    });

    res.json({
      success: true,
      message: 'Onboarding step updated successfully',
      data: {
        step,
        progress: provider.onboarding.progress,
        completed: provider.onboarding.completed
      }
    });
  } catch (error) {
    logger.error('Failed to update onboarding step', error, {
      userId: req.user.id,
      step: req.body.step
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update onboarding step'
    });
  }
};

// Upload provider documents
const uploadDocuments = async (req, res) => {
  try {
    const { documentType, category } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    const fileUrls = files.map(file => file.path);

    // Update verification documents based on type
    switch (documentType) {
      case 'insurance':
        if (!provider.verification.insurance.documents) {
          provider.verification.insurance.documents = [];
        }
        provider.verification.insurance.documents.push(...fileUrls);
        break;
      case 'license':
        if (!provider.verification.licenses) {
          provider.verification.licenses = [];
        }
        provider.verification.licenses.push({
          type: category,
          documents: fileUrls
        });
        break;
      case 'portfolio':
        if (!provider.verification.portfolio.images) {
          provider.verification.portfolio.images = [];
        }
        provider.verification.portfolio.images.push(...fileUrls);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid document type'
        });
    }

    await provider.save();

    // Log audit event
    await auditLogger.logUser('document_upload', req, {
      type: 'provider',
      id: provider._id,
      name: 'Provider Documents'
    }, {
      documentType,
      category,
      fileCount: files.length
    });

    logger.info('Provider documents uploaded', {
      userId: req.user.id,
      providerId: provider._id,
      documentType,
      fileCount: files.length
    });

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        documentType,
        fileUrls,
        fileCount: files.length
      }
    });
  } catch (error) {
    logger.error('Failed to upload documents', error, {
      userId: req.user.id,
      documentType: req.body.documentType
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents'
    });
  }
};

// Get provider dashboard data
const getProviderDashboard = async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    // Get recent bookings, earnings, reviews, etc.
    // This would integrate with other services
    const dashboardData = {
      profile: {
        status: provider.status,
        rating: provider.performance.rating,
        totalJobs: provider.performance.totalJobs,
        completionRate: provider.performance.completionRate
      },
      earnings: provider.performance.earnings,
      recentActivity: {
        // This would come from other services
        recentBookings: [],
        recentReviews: [],
        recentMessages: []
      },
      notifications: {
        pendingJobs: 0,
        unreadMessages: 0,
        pendingReviews: 0
      },
      performance: {
        thisMonth: {
          jobs: 0,
          earnings: provider.performance.earnings.thisMonth,
          rating: provider.performance.rating
        },
        lastMonth: {
          jobs: 0,
          earnings: provider.performance.earnings.lastMonth,
          rating: provider.performance.rating
        }
      }
    };

    logger.info('Provider dashboard retrieved', {
      userId: req.user.id,
      providerId: provider._id
    });

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Failed to get provider dashboard', error, {
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve provider dashboard'
    });
  }
};

// Get provider analytics
const getProviderAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    // Calculate analytics based on timeframe
    const analytics = {
      overview: {
        totalJobs: provider.performance.totalJobs,
        completedJobs: provider.performance.completedJobs,
        rating: provider.performance.rating,
        totalReviews: provider.performance.totalReviews,
        earnings: provider.performance.earnings.total
      },
      trends: {
        // This would come from actual data analysis
        jobsOverTime: [],
        earningsOverTime: [],
        ratingOverTime: []
      },
      categories: {
        // Job distribution by category
        jobDistribution: [],
        earningsByCategory: []
      },
      performance: {
        responseTime: provider.performance.responseTime,
        completionRate: provider.performance.completionRate,
        repeatCustomerRate: provider.performance.repeatCustomerRate
      }
    };

    logger.info('Provider analytics retrieved', {
      userId: req.user.id,
      providerId: provider._id,
      timeframe
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Failed to get provider analytics', error, {
      userId: req.user.id,
      timeframe: req.query.timeframe
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve provider analytics'
    });
  }
};

// Admin: Update provider status
const updateProviderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'active', 'suspended', 'inactive', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    const oldStatus = provider.status;
    provider.status = status;
    if (notes) {
      provider.metadata.notes = notes;
    }

    await provider.save();

    // Log audit event
    await auditLogger.logSystem('admin_action', req, {
      type: 'provider',
      id: provider._id,
      name: 'Provider Status Update'
    }, {
      oldStatus,
      newStatus: status,
      notes
    });

    logger.info('Provider status updated', {
      adminId: req.user.id,
      providerId: id,
      oldStatus,
      newStatus: status
    });

    res.json({
      success: true,
      message: 'Provider status updated successfully',
      data: provider
    });
  } catch (error) {
    logger.error('Failed to update provider status', error, {
      adminId: req.user.id,
      providerId: req.params.id,
      status: req.body.status
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update provider status'
    });
  }
};

// Admin: Get all providers for management
const getProvidersForAdmin = async (req, res) => {
  try {
    const {
      status,
      providerType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (providerType) query.providerType = providerType;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const providers = await Provider.find(query)
      .populate('userId', 'firstName lastName email phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Provider.countDocuments(query);

    logger.info('Providers retrieved for admin', {
      adminId: req.user.id,
      filters: { status, providerType },
      resultCount: providers.length,
      totalCount: total
    });

    res.json({
      success: true,
      data: providers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to get providers for admin', error, {
      adminId: req.user.id,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve providers'
    });
  }
};

module.exports = {
  getProviders,
  getProvider,
  getMyProviderProfile,
  createProviderProfile,
  updateProviderProfile,
  updateOnboardingStep,
  uploadDocuments,
  getProviderDashboard,
  getProviderAnalytics,
  updateProviderStatus,
  getProvidersForAdmin
};

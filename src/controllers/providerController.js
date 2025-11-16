const mongoose = require('mongoose');
const Provider = require('../models/Provider');
const ProviderSkill = require('../models/ProviderSkill');
const ServiceCategory = require('../models/ServiceCategory');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { auditLogger } = require('../utils/auditLogger');
const { validationResult } = require('express-validator');

// @desc    Get provider skills
// @route   GET /api/providers/skills
// @access  Public
const getProviderSkills = async (req, res) => {
  try {
    const { category } = req.query;
    let categoryId = null;
    let categoryKey = null;

    // If category is provided, determine if it's an ObjectId or a category key
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        // It's a valid ObjectId, use it directly
        categoryId = category;
      } else {
        // Treat it as a category key (e.g., "cleaning", "plumbing")
        const serviceCategory = await ServiceCategory.getByKey(category);
        if (!serviceCategory) {
          return res.status(400).json({
            success: false,
            message: `Service category with key "${category}" not found`,
            code: 'CATEGORY_NOT_FOUND'
          });
        }
        categoryId = serviceCategory._id;
        categoryKey = serviceCategory.key;
      }
    }

    const skills = await ProviderSkill.getActiveSkills(categoryId);
    
    // Transform to include id field (using _id) and category key
    const formattedSkills = skills.map((skill) => ({
      id: skill._id.toString(),
      name: skill.name,
      description: skill.description,
      category: skill.category ? {
        id: skill.category._id.toString(),
        key: skill.category.key || categoryKey,
        name: skill.category.name,
        description: skill.category.description,
        metadata: skill.category.metadata
      } : null,
      displayOrder: skill.displayOrder,
      metadata: skill.metadata
    }));

    logger.info('Provider skills retrieved', {
      skillCount: formattedSkills.length,
      category: categoryKey || category || 'all'
    });

    res.json({
      success: true,
      data: {
        skills: formattedSkills,
        count: formattedSkills.length
      }
    });
  } catch (error) {
    logger.error('Failed to get provider skills', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve provider skills',
      code: 'SKILLS_RETRIEVAL_ERROR'
    });
  }
};

// Get all providers with filtering and pagination
const getProviders = async (req, res) => {
  try {
    const {
      status,
      providerType,
      category,
      skills, // Filter by skill IDs (comma-separated ObjectIds) - matches providers with ANY of the skills
      skillsMatch, // 'any' (default) or 'all' - whether to match ANY or ALL specified skills
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

    const query = { 
      deleted: { $ne: true } // Exclude soft-deleted providers
    };

    // Apply filters
    // Default to 'active' status if no status is specified
    if (status) {
      query.status = status;
    } else {
      query.status = 'active'; // Default to active providers
    }
    if (providerType) query.providerType = providerType;
    if (featured) query['metadata.featured'] = featured === 'true';
    if (promoted) query['metadata.promoted'] = promoted === 'true';
    // Rating filter needs to query ProviderPerformance first
    if (minRating) {
      const ProviderPerformance = require('../models/ProviderPerformance');
      const matchingPerformances = await ProviderPerformance.find({
        rating: { $gte: parseFloat(minRating) }
      });
      const providerIds = matchingPerformances.map(p => p.provider);
      if (providerIds.length > 0) {
        if (query._id) {
          // Combine with existing _id filter
          query._id = { $in: providerIds.filter(id => query._id.$in.includes(id)) };
        } else {
          query._id = { $in: providerIds };
        }
      } else {
        query._id = { $in: [] };
      }
    }

    // Category, skills, and location filters need to query ProviderProfessionalInfo first
    // We'll handle this after the initial query by filtering results
    if (category || skills || (city && state)) {
      const ProviderProfessionalInfo = require('../models/ProviderProfessionalInfo');
      const professionalInfoQuery = {};
      
      if (category) {
        professionalInfoQuery['specialties.category'] = category;
      }
      
      // Filter by skills - skill IDs (comma-separated ObjectIds)
      // Skills are found in professionalInfo.specialties[].skills[]
      // Supports filtering by multiple skills - matches providers who have ANY of the specified skills
      if (skills) {
        const skillArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const skillIds = [];
        
        // Validate and convert to ObjectIds
        for (const skill of skillArray) {
          if (mongoose.Types.ObjectId.isValid(skill)) {
            skillIds.push(new mongoose.Types.ObjectId(skill));
          } else {
            // Invalid ObjectId format
            return res.status(400).json({
              success: false,
              message: `Invalid skill ID format: "${skill}". Skill IDs must be valid MongoDB ObjectIds.`,
              code: 'INVALID_SKILL_ID'
            });
          }
        }
        
        if (skillIds.length > 0) {
          const matchAll = skillsMatch === 'all';
          
          if (matchAll && skillIds.length > 1) {
            // Match providers who have ALL specified skills (across any specialties)
            // Use $and to ensure each skill exists in specialties
            professionalInfoQuery['$and'] = skillIds.map(skillId => ({
              'specialties.skills': skillId
            }));
          } else {
            // Match providers who have ANY of the specified skills (default behavior)
            // Use $elemMatch to find providers where any specialty contains any of the specified skills
            professionalInfoQuery['specialties'] = {
              $elemMatch: {
                skills: { $in: skillIds }
              }
            };
          }
        } else {
          // No valid skills found, return empty result
          query._id = { $in: [] };
        }
      }
      
      if (city && state) {
        professionalInfoQuery['specialties.serviceAreas'] = {
          $elemMatch: { city, state }
        };
      }
      
      const matchingProfessionalInfos = await ProviderProfessionalInfo.find(professionalInfoQuery);
      const providerIds = matchingProfessionalInfos.map(pi => pi.provider);
      if (providerIds.length > 0) {
        if (query._id && query._id.$in) {
          // Combine with existing _id filter (e.g., from rating filter)
          query._id.$in = query._id.$in.filter(id => 
            providerIds.some(pid => pid.toString() === id.toString())
          );
        } else {
          query._id = { $in: providerIds };
        }
      } else {
        // No providers match, return empty result
        query._id = { $in: [] };
      }
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
      .populate('professionalInfo')
      .populate('professionalInfo.specialties.skills', 'name description category metadata')
      .populate('businessInfo')
      .populate('verification', '-backgroundCheck.reportId -insurance.documents')
      .populate('preferences')
      .populate('performance')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-financialInfo');

    const total = await Provider.countDocuments(query);

    logger.info('Providers retrieved', {
      userId: req.user?.id,
      filters: { status, providerType, category, skills, city, state },
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

// Get single provider by ID (accepts either User ID or Provider ID)
const getProvider = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    let provider;
    let user;
    const objectId = new mongoose.Types.ObjectId(id);

    // First, try to find User by ID
    user = await User.findById(objectId)
      .select('firstName lastName email phone phoneNumber profileImage profile roles isActive verification badges')
      .lean();

    if (user) {
      // User found - now find Provider profile by userId
      logger.info('User found, looking up provider profile', {
        userId: user._id,
        userEmail: user.email
      });

      provider = await Provider.findOne({ 
        userId: objectId,
        deleted: { $ne: true } // Exclude soft-deleted providers
      })
        .populate('userId', 'firstName lastName email phone phoneNumber profileImage profile roles isActive verification badges')
        .populate('professionalInfo')
        .populate('professionalInfo.specialties.skills', 'name description category metadata')
        .populate('businessInfo')
        .populate('verification', '-backgroundCheck.reportId -insurance.documents')
        .populate('preferences')
        .populate('performance')
        .select('-financialInfo')
        .lean();

      if (!provider) {
        logger.warn('User found but no provider profile exists', {
          userId: user._id,
          userEmail: user.email
        });

        return res.status(404).json({
          success: false,
          message: 'Provider profile not found',
          error: 'User exists but does not have a provider profile',
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          },
          hint: 'This user has not completed provider registration. They need to create a provider profile first.'
        });
      }
    } else {
      // User not found - try Provider ID directly
      logger.info('User not found, trying provider ID lookup', {
        id: id
      });

      provider = await Provider.findOne({ 
        _id: objectId,
        deleted: { $ne: true } // Exclude soft-deleted providers
      })
        .populate('userId', 'firstName lastName email phone phoneNumber profileImage profile roles isActive verification badges')
        .populate('professionalInfo')
        .populate('professionalInfo.specialties.skills', 'name description category metadata')
        .populate('businessInfo')
        .populate('verification', '-backgroundCheck.reportId -insurance.documents')
        .populate('preferences')
        .populate('performance')
        .select('-financialInfo')
        .lean();

      if (provider && provider.userId) {
        user = provider.userId;
      }
    }

    if (!provider) {
      logger.warn('Provider not found by ID or User ID', {
        requestedId: id,
        requestedBy: req.user?.id
      });
      
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
        hint: 'The ID does not exist as a User ID or Provider ID. Please verify the ID and try again.'
      });
    }

    // Convert to plain object if needed and increment profile views
    const providerDoc = await Provider.findById(provider._id);
    if (providerDoc) {
      providerDoc.metadata.profileViews += 1;
      await providerDoc.save();
    }

    // Build extended response with User and Provider data
    const extendedProviderData = {
      ...provider,
      user: user || provider.userId,
      // Ensure user data is properly included
      userProfile: user || provider.userId
    };

    logger.info('Provider retrieved successfully', {
      userId: req.user?.id,
      providerId: provider._id,
      userFound: !!user,
      profileViews: providerDoc?.metadata?.profileViews || provider.metadata?.profileViews
    });

    res.json({
      success: true,
      data: extendedProviderData
    });
  } catch (error) {
    logger.error('Failed to get provider', error, {
      userId: req.user?.id,
      providerId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve provider',
      error: error.message
    });
  }
};

// Get current user's provider profile
const getMyProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.id })
      .populate('userId', 'firstName lastName email phone profileImage')
      .populate('professionalInfo')
      .populate('professionalInfo.specialties.skills', 'name description category metadata')
      .populate('verification')
      .populate('preferences')
      .populate('businessInfo')
      .populate('performance');

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

    // Check if user has client role (multi-role support)
    const userRoles = req.user.roles || [];
    const hasClientRole = req.user.hasRole ? req.user.hasRole('client') : userRoles.includes('client');
    if (!hasClientRole) {
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
    
    // Handle businessInfo separately if provided (for business/agency providers)
    if (businessInfo && (providerType === 'business' || providerType === 'agency')) {
      const businessInfoDoc = await provider.ensureBusinessInfo();
      await businessInfoDoc.updateBusinessInfo(businessInfo);
    }
    
    // Handle professionalInfo separately if provided
    if (professionalInfo) {
      const professionalInfoDoc = await provider.ensureProfessionalInfo();
      // Update professionalInfo fields
      if (professionalInfo.specialties) {
        professionalInfoDoc.specialties = professionalInfo.specialties;
      }
      if (professionalInfo.languages) {
        professionalInfoDoc.languages = professionalInfo.languages;
      }
      if (professionalInfo.availability) {
        professionalInfoDoc.availability = professionalInfo.availability;
      }
      if (professionalInfo.emergencyServices !== undefined) {
        professionalInfoDoc.emergencyServices = professionalInfo.emergencyServices;
      }
      if (professionalInfo.travelDistance !== undefined) {
        professionalInfoDoc.travelDistance = professionalInfo.travelDistance;
      }
      if (professionalInfo.minimumJobValue !== undefined) {
        professionalInfoDoc.minimumJobValue = professionalInfo.minimumJobValue;
      }
      if (professionalInfo.maximumJobValue !== undefined) {
        professionalInfoDoc.maximumJobValue = professionalInfo.maximumJobValue;
      }
      await professionalInfoDoc.save();
    }

    // Update user role to include provider (multi-role support)
    const user = await User.findById(req.user.id);
    if (user) {
      user.addRole('provider');
      await user.save();
    }

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

    const updateData = { ...req.body };
    const oldData = { ...provider.toObject() };
    
    // Extract businessInfo if present (handle separately)
    const businessInfoData = updateData.businessInfo;
    delete updateData.businessInfo;

    // Update provider (excluding businessInfo)
    Object.assign(provider, updateData);
    await provider.save();
    
    // Handle businessInfo separately if provided
    if (businessInfoData && (provider.providerType === 'business' || provider.providerType === 'agency')) {
      const businessInfo = await provider.ensureBusinessInfo();
      await businessInfo.updateBusinessInfo(businessInfoData);
    }
    
    // Handle professionalInfo separately if provided
    const professionalInfoData = req.body.professionalInfo;
    if (professionalInfoData) {
      const professionalInfo = await provider.ensureProfessionalInfo();
      if (professionalInfoData.specialties) {
        professionalInfo.specialties = professionalInfoData.specialties;
      }
      if (professionalInfoData.languages) {
        professionalInfo.languages = professionalInfoData.languages;
      }
      if (professionalInfoData.availability) {
        professionalInfo.availability = professionalInfoData.availability;
      }
      if (professionalInfoData.emergencyServices !== undefined) {
        professionalInfo.emergencyServices = professionalInfoData.emergencyServices;
      }
      if (professionalInfoData.travelDistance !== undefined) {
        professionalInfo.travelDistance = professionalInfoData.travelDistance;
      }
      if (professionalInfoData.minimumJobValue !== undefined) {
        professionalInfo.minimumJobValue = professionalInfoData.minimumJobValue;
      }
      if (professionalInfoData.maximumJobValue !== undefined) {
        professionalInfo.maximumJobValue = professionalInfoData.maximumJobValue;
      }
      await professionalInfo.save();
    }

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
      
      // Note: Subscription is now managed through User model (localProPlusSubscription)
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
    const verification = await provider.ensureVerification();
    
    switch (documentType) {
      case 'insurance':
        if (!verification.insurance.documents) {
          verification.insurance.documents = [];
        }
        verification.insurance.documents.push(...fileUrls);
        await verification.save();
        break;
      case 'license':
        await verification.addLicense({
          type: category,
          documents: fileUrls
        });
        break;
      case 'portfolio':
        for (const imageUrl of fileUrls) {
          await verification.addPortfolioImage(imageUrl);
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid document type'
        });
    }

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
    const performance = await provider.ensurePerformance();
    const dashboardData = {
      profile: {
        status: provider.status,
        rating: performance.rating,
        totalJobs: performance.totalJobs,
        completionRate: performance.completionRate
      },
      earnings: performance.earnings,
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
          earnings: performance.earnings.thisMonth,
          rating: performance.rating
        },
        lastMonth: {
          jobs: 0,
          earnings: performance.earnings.lastMonth,
          rating: performance.rating
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
    const performance = await provider.ensurePerformance();
    const analytics = {
      overview: {
        totalJobs: performance.totalJobs,
        completedJobs: performance.completedJobs,
        rating: performance.rating,
        totalReviews: performance.totalReviews,
        earnings: performance.earnings.total
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
        responseTime: performance.responseTime,
        completionRate: performance.completionRate,
        repeatCustomerRate: performance.repeatCustomerRate
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
      logger.warn('Provider not found for status update', {
        providerId: id,
        requestedBy: req.user?.id,
        requestedStatus: status
      });
      
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
        hint: 'The provider ID does not exist. Please verify the ID and try again.'
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
      .populate('professionalInfo')
      .populate('professionalInfo.specialties.skills', 'name description category metadata')
      .populate('businessInfo')
      .populate('verification')
      .populate('preferences')
      .populate('performance')
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
  getProvidersForAdmin,
  getProviderSkills
};

const mongoose = require('mongoose');
const Provider = require('../models/Provider');
const ProviderSkill = require('../models/ProviderSkill');
const ServiceCategory = require('../models/ServiceCategory');
const User = require('../models/User');
const { Booking } = require('../models/Marketplace');
// Note: ProviderBusinessInfo, ProviderProfessionalInfo, ProviderVerification, 
// ProviderFinancialInfo, ProviderPreferences, and ProviderPerformance are 
// required dynamically inside functions where needed
const { logger } = require('../utils/logger');
const { auditLogger } = require('../utils/auditLogger');
const { validationResult } = require('express-validator');
const { validateObjectId } = require('../utils/validation');

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
    // Note: If status is not provided, all providers (regardless of status) are returned
    if (status) query.status = status;
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
      
      // Validate and convert category to ObjectId
      let categoryObjectId = null;
      if (category) {
        if (mongoose.Types.ObjectId.isValid(category)) {
          categoryObjectId = new mongoose.Types.ObjectId(category);
        } else {
          return res.status(400).json({
            success: false,
            message: `Invalid category ID format: "${category}". Category ID must be a valid MongoDB ObjectId.`,
            code: 'INVALID_CATEGORY_ID'
          });
        }
      }
      
      // Validate and convert skills to ObjectIds
      let skillIds = [];
      if (skills) {
        const skillArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
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
      }
      
      // Build the specialties query using $elemMatch
      // When both category and skills are provided, they must match in the same specialty
      const specialtyMatchConditions = {};
      
      if (categoryObjectId) {
        specialtyMatchConditions.category = categoryObjectId;
      }
      
      if (skillIds.length > 0) {
        const matchAll = skillsMatch === 'all';
        
        if (matchAll && skillIds.length > 1) {
          // Match providers who have ALL specified skills in the same specialty
          specialtyMatchConditions.skills = { $all: skillIds };
        } else {
          // Match providers who have ANY of the specified skills (default behavior)
          specialtyMatchConditions.skills = { $in: skillIds };
        }
      }
      
      // If we have category or skills filters, use $elemMatch
      if (categoryObjectId || skillIds.length > 0) {
        professionalInfoQuery.specialties = {
          $elemMatch: specialtyMatchConditions
        };
      }
      
      // Location filter (serviceAreas)
      if (city && state) {
        if (professionalInfoQuery.specialties && professionalInfoQuery.specialties.$elemMatch) {
          // Combine with existing $elemMatch conditions
          professionalInfoQuery.specialties.$elemMatch.serviceAreas = {
            $elemMatch: { city, state }
          };
        } else {
          // Only location filter
          professionalInfoQuery['specialties.serviceAreas'] = {
            $elemMatch: { city, state }
          };
        }
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
    
    // Build populate options - handle agency population errors gracefully
    const userIdPopulateOptions = [
      { path: 'profile' },
      { path: 'settings' },
      {
        path: 'agency',
        populate: {
          path: 'agencyId',
          select: 'name type contact.address'
        }
      },
      {
        path: 'referral',
        select: 'referralCode referralStats'
      },
      {
        path: 'trust',
        select: 'trustScore verification badges'
      }
    ];

    let providers;
    try {
      providers = await Provider.find(query)
        .populate({
          path: 'userId',
          select: '-verificationCode -password',
          populate: userIdPopulateOptions
        })
        .populate({
          path: 'professionalInfo',
          populate: {
            path: 'specialties.skills',
            select: 'name description category metadata'
          }
        })
        .populate('businessInfo')
        .populate('verification')
        .populate('preferences')
        .populate('performance')
        .populate('financialInfo')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    } catch (populateError) {
      // If population fails due to invalid agency data (e.g., number instead of ObjectId)
      // Retry without agency population to prevent the entire query from failing
      if (populateError.message && populateError.message.includes('Cast to ObjectId') && populateError.message.includes('UserAgency')) {
        logger.warn('Agency population failed due to invalid data, retrying without agency population', {
          error: populateError.message,
          userId: req.user?.id
        });
        
        // Remove agency from populate options
        const userIdPopulateWithoutAgency = userIdPopulateOptions.filter(p => p.path !== 'agency');
        
        providers = await Provider.find(query)
          .populate({
            path: 'userId',
            select: '-verificationCode -password',
            populate: userIdPopulateWithoutAgency
          })
          .populate({
            path: 'professionalInfo',
            populate: {
              path: 'specialties.skills',
              select: 'name description category metadata'
            }
          })
          .populate('businessInfo')
          .populate('verification')
          .populate('preferences')
          .populate('performance')
          .populate('financialInfo')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean();
      } else {
        // Re-throw if it's a different error
        throw populateError;
      }
    }

    const total = await Provider.countDocuments(query);

    // Normalize skills arrays and ensure they're populated - ensure they're always arrays (never undefined)
    providers = await Promise.all(providers.map(async (provider) => {
      if (provider.professionalInfo && provider.professionalInfo.specialties && Array.isArray(provider.professionalInfo.specialties)) {
        provider.professionalInfo.specialties = await Promise.all(provider.professionalInfo.specialties.map(async (specialty) => {
          let skills = Array.isArray(specialty.skills) ? specialty.skills : [];
          
          // If skills are still ObjectIds (strings), manually populate them
          if (skills.length > 0 && (typeof skills[0] === 'string' || (typeof skills[0] === 'object' && skills[0]._id && !skills[0].name))) {
            const ProviderSkill = require('../models/ProviderSkill');
            const skillIds = skills.map(s => typeof s === 'string' ? s : (s._id || s).toString());
            const populatedSkills = await ProviderSkill.find({ _id: { $in: skillIds } })
              .select('name description category metadata')
              .populate('category', 'name key description')
              .lean();
            
            // Map back to original order
            skills = skillIds.map(id => {
              const skill = populatedSkills.find(s => s._id.toString() === id.toString());
              return skill || id;
            });
          }
          
          // Exclude category from response
          // eslint-disable-next-line no-unused-vars
          const { category: _category, ...specialtyWithoutCategory } = specialty;
          return {
            ...specialtyWithoutCategory,
            skills: skills
          };
        }));
      }
      return provider;
    }));

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
        .populate({
          path: 'professionalInfo',
          populate: {
            path: 'specialties.skills',
            select: 'name description category metadata'
          }
        })
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
        .populate({
          path: 'professionalInfo',
          populate: {
            path: 'specialties.skills',
            select: 'name description category metadata'
          }
        })
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

    // Normalize skills arrays and ensure they're populated - ensure they're always arrays (never undefined)
    if (provider.professionalInfo && provider.professionalInfo.specialties && Array.isArray(provider.professionalInfo.specialties)) {
      provider.professionalInfo.specialties = await Promise.all(provider.professionalInfo.specialties.map(async (specialty) => {
        let skills = Array.isArray(specialty.skills) ? specialty.skills : [];
        
        // If skills are still ObjectIds (strings), manually populate them
        if (skills.length > 0 && (typeof skills[0] === 'string' || (typeof skills[0] === 'object' && skills[0]._id && !skills[0].name))) {
          const ProviderSkill = require('../models/ProviderSkill');
          const skillIds = skills.map(s => typeof s === 'string' ? s : (s._id || s).toString());
          const populatedSkills = await ProviderSkill.find({ _id: { $in: skillIds } })
            .select('name description category metadata')
            .populate('category', 'name key description')
            .lean();
          
          // Map back to original order
          skills = skillIds.map(id => {
            const skill = populatedSkills.find(s => s._id.toString() === id.toString());
            return skill || id;
          });
        }
        
        // Exclude category from response
        // eslint-disable-next-line no-unused-vars
        const { category: _category, ...specialtyWithoutCategory } = specialty;
        return {
          ...specialtyWithoutCategory,
          skills: skills
        };
      }));
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
      .populate({
        path: 'professionalInfo',
        populate: {
          path: 'specialties.skills',
          select: 'name description category metadata'
        }
      })
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

    // Normalize skills arrays and ensure they're populated - ensure they're always arrays (never undefined)
    if (provider.professionalInfo && provider.professionalInfo.specialties && Array.isArray(provider.professionalInfo.specialties)) {
      provider.professionalInfo.specialties = await Promise.all(provider.professionalInfo.specialties.map(async (specialty) => {
        let skills = Array.isArray(specialty.skills) ? specialty.skills : [];
        
        // If skills are still ObjectIds (strings), manually populate them
        if (skills.length > 0 && (typeof skills[0] === 'string' || (typeof skills[0] === 'object' && skills[0]._id && !skills[0].name))) {
          const ProviderSkill = require('../models/ProviderSkill');
          const skillIds = skills.map(s => typeof s === 'string' ? s : (s._id || s).toString());
          const populatedSkills = await ProviderSkill.find({ _id: { $in: skillIds } })
            .select('name description category metadata')
            .populate('category', 'name key description')
            .lean();
          
          // Map back to original order
          skills = skillIds.map(id => {
            const skill = populatedSkills.find(s => s._id.toString() === id.toString());
            return skill || id;
          });
        }
        
        // Exclude category from response
        // eslint-disable-next-line no-unused-vars
        const { category: _category, ...specialtyWithoutCategory } = specialty;
        return {
          ...specialtyWithoutCategory,
          skills: skills
        };
      }));
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

// Patch provider profile (partial update)
const patchProviderProfile = async (req, res) => {
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
    const updatedFields = [];

    // Helper function to deep merge objects
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && !(source[key] instanceof Date)) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };

    // Fields that should not be directly updated
    const restrictedFields = ['_id', 'userId', 'createdAt', 'updatedAt', 'deleted', 'deletedOn'];
    const allowedTopLevelFields = ['status', 'providerType', 'settings', 'metadata', 'onboarding'];
    
    // Update top-level fields
    for (const field of allowedTopLevelFields) {
      if (updateData[field] !== undefined) {
        if (field === 'settings' || field === 'metadata' || field === 'onboarding') {
          // Deep merge for nested objects
          if (!provider[field]) provider[field] = {};
          deepMerge(provider[field], updateData[field]);
        } else {
          provider[field] = updateData[field];
        }
        updatedFields.push(field);
        delete updateData[field];
      }
    }

    // Remove restricted fields
    restrictedFields.forEach(field => delete updateData[field]);

    // Save provider if there are top-level updates
    if (updatedFields.length > 0) {
      await provider.save();
    }

    // Handle businessInfo separately if provided
    if (updateData.businessInfo) {
      const businessInfoData = updateData.businessInfo;
      if (provider.providerType === 'business' || provider.providerType === 'agency') {
        const businessInfo = await provider.ensureBusinessInfo();
        
        // Deep merge business info
        const currentBusinessInfo = businessInfo.toObject();
        const mergedBusinessInfo = deepMerge({ ...currentBusinessInfo }, businessInfoData);
        
        // Remove _id and other mongoose fields
        delete mergedBusinessInfo._id;
        delete mergedBusinessInfo.__v;
        delete mergedBusinessInfo.createdAt;
        delete mergedBusinessInfo.updatedAt;
        
        await businessInfo.updateBusinessInfo(mergedBusinessInfo);
        updatedFields.push('businessInfo');
      }
      delete updateData.businessInfo;
    }

    // Handle professionalInfo separately if provided
    if (updateData.professionalInfo) {
      const professionalInfoData = updateData.professionalInfo;
      const professionalInfo = await provider.ensureProfessionalInfo();
      
      // Update professional info fields
      if (professionalInfoData.specialties !== undefined) {
        professionalInfo.specialties = professionalInfoData.specialties;
        updatedFields.push('professionalInfo.specialties');
      }
      if (professionalInfoData.languages !== undefined) {
        professionalInfo.languages = professionalInfoData.languages;
        updatedFields.push('professionalInfo.languages');
      }
      if (professionalInfoData.availability !== undefined) {
        professionalInfo.availability = professionalInfoData.availability;
        updatedFields.push('professionalInfo.availability');
      }
      if (professionalInfoData.emergencyServices !== undefined) {
        professionalInfo.emergencyServices = professionalInfoData.emergencyServices;
        updatedFields.push('professionalInfo.emergencyServices');
      }
      if (professionalInfoData.travelDistance !== undefined) {
        professionalInfo.travelDistance = professionalInfoData.travelDistance;
        updatedFields.push('professionalInfo.travelDistance');
      }
      if (professionalInfoData.minimumJobValue !== undefined) {
        professionalInfo.minimumJobValue = professionalInfoData.minimumJobValue;
        updatedFields.push('professionalInfo.minimumJobValue');
      }
      if (professionalInfoData.maximumJobValue !== undefined) {
        professionalInfo.maximumJobValue = professionalInfoData.maximumJobValue;
        updatedFields.push('professionalInfo.maximumJobValue');
      }
      
      await professionalInfo.save();
      if (!updatedFields.includes('professionalInfo')) {
        updatedFields.push('professionalInfo');
      }
      delete updateData.professionalInfo;
    }

    // Handle preferences if provided
    if (updateData.preferences) {
      const preferencesData = updateData.preferences;
      const preferences = await provider.ensurePreferences();
      
      // Deep merge preferences
      const currentPreferences = preferences.toObject();
      const mergedPreferences = deepMerge({ ...currentPreferences }, preferencesData);
      
      // Remove mongoose fields
      delete mergedPreferences._id;
      delete mergedPreferences.__v;
      delete mergedPreferences.provider;
      delete mergedPreferences.createdAt;
      delete mergedPreferences.updatedAt;
      
      Object.assign(preferences, mergedPreferences);
      await preferences.save();
      updatedFields.push('preferences');
      delete updateData.preferences;
    }

    // Handle financialInfo if provided
    if (updateData.financialInfo) {
      const financialInfoData = updateData.financialInfo;
      const financialInfo = await provider.ensureFinancialInfo();
      
      // Deep merge financial info
      const currentFinancialInfo = financialInfo.toObject();
      const mergedFinancialInfo = deepMerge({ ...currentFinancialInfo }, financialInfoData);
      
      // Remove mongoose fields
      delete mergedFinancialInfo._id;
      delete mergedFinancialInfo.__v;
      delete mergedFinancialInfo.provider;
      delete mergedFinancialInfo.createdAt;
      delete mergedFinancialInfo.updatedAt;
      
      Object.assign(financialInfo, mergedFinancialInfo);
      await financialInfo.save();
      updatedFields.push('financialInfo');
      delete updateData.financialInfo;
    }

    // Log audit event
    if (updatedFields.length > 0) {
      await auditLogger.logUser('user_update', req, {
        type: 'provider',
        id: provider._id,
        name: 'Provider Profile'
      }, {
        method: 'PATCH',
        updatedFields,
        before: oldData,
        after: req.body
      });

      logger.info('Provider profile patched', {
        userId: req.user.id,
        providerId: provider._id,
        updatedFields
      });
    }

    // Populate related documents for response
    await provider.populate([
      'businessInfo',
      'professionalInfo',
      'verification',
      'financialInfo',
      'performance',
      'preferences'
    ]);

    res.json({
      success: true,
      message: 'Provider profile updated successfully',
      data: {
        provider,
        updatedFields
      }
    });
  } catch (error) {
    logger.error('Failed to patch provider profile', error, {
      userId: req.user.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update provider profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    let providers = await Provider.find(query)
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

    // Exclude category from specialties in response
    providers = providers.map(provider => {
      if (provider.professionalInfo && provider.professionalInfo.specialties && Array.isArray(provider.professionalInfo.specialties)) {
        provider.professionalInfo.specialties = provider.professionalInfo.specialties.map(specialty => {
          // eslint-disable-next-line no-unused-vars
          const { category: _category, ...specialtyWithoutCategory } = specialty;
          return specialtyWithoutCategory;
        });
      }
      return provider;
    });

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

// Admin: Update provider with all data (including all referenced collections)
const adminUpdateProvider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = { ...req.body };
    const oldData = {};

    // Find provider
    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Store old data for audit
    const oldProviderData = provider.toObject();

    // Extract referenced collection data
    const businessInfoData = updateData.businessInfo;
    const professionalInfoData = updateData.professionalInfo;
    const verificationData = updateData.verification;
    const financialInfoData = updateData.financialInfo;
    const preferencesData = updateData.preferences;
    const performanceData = updateData.performance;

    // Remove referenced collections from updateData (handle separately)
    delete updateData.businessInfo;
    delete updateData.professionalInfo;
    delete updateData.verification;
    delete updateData.financialInfo;
    delete updateData.preferences;
    delete updateData.performance;

    // Update direct provider fields
    if (Object.keys(updateData).length > 0) {
      Object.assign(provider, updateData);
      await provider.save();
    }

    // Handle businessInfo
    if (businessInfoData) {
      const businessInfo = await provider.ensureBusinessInfo();
      oldData.businessInfo = businessInfo.toObject();
      Object.assign(businessInfo, businessInfoData);
      await businessInfo.save();
    }

    // Handle professionalInfo
    if (professionalInfoData) {
      const professionalInfo = await provider.ensureProfessionalInfo();
      oldData.professionalInfo = professionalInfo.toObject();
      
      if (professionalInfoData.specialties !== undefined) {
        professionalInfo.specialties = professionalInfoData.specialties;
      }
      if (professionalInfoData.languages !== undefined) {
        professionalInfo.languages = professionalInfoData.languages;
      }
      if (professionalInfoData.availability !== undefined) {
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

    // Handle verification
    if (verificationData) {
      const verification = await provider.ensureVerification();
      oldData.verification = verification.toObject();
      
      if (verificationData.identityVerified !== undefined) {
        verification.identityVerified = verificationData.identityVerified;
      }
      if (verificationData.businessVerified !== undefined) {
        verification.businessVerified = verificationData.businessVerified;
      }
      if (verificationData.backgroundCheck !== undefined) {
        verification.backgroundCheck = {
          ...verification.backgroundCheck,
          ...verificationData.backgroundCheck
        };
      }
      if (verificationData.insurance !== undefined) {
        verification.insurance = {
          ...verification.insurance,
          ...verificationData.insurance
        };
      }
      if (verificationData.licenses !== undefined) {
        verification.licenses = verificationData.licenses;
      }
      if (verificationData.references !== undefined) {
        verification.references = verificationData.references;
      }
      if (verificationData.portfolio !== undefined) {
        verification.portfolio = {
          ...verification.portfolio,
          ...verificationData.portfolio
        };
      }
      
      await verification.save();
    }

    // Handle financialInfo
    if (financialInfoData) {
      const financialInfo = await provider.ensureFinancialInfo();
      oldData.financialInfo = financialInfo.toObject();
      
      if (financialInfoData.bankAccount !== undefined) {
        financialInfo.bankAccount = {
          ...financialInfo.bankAccount,
          ...financialInfoData.bankAccount
        };
      }
      if (financialInfoData.taxInfo !== undefined) {
        financialInfo.taxInfo = {
          ...financialInfo.taxInfo,
          ...financialInfoData.taxInfo
        };
      }
      if (financialInfoData.paymentMethods !== undefined) {
        financialInfo.paymentMethods = financialInfoData.paymentMethods;
      }
      if (financialInfoData.commissionRate !== undefined) {
        financialInfo.commissionRate = financialInfoData.commissionRate;
      }
      if (financialInfoData.minimumPayout !== undefined) {
        financialInfo.minimumPayout = financialInfoData.minimumPayout;
      }
      
      await financialInfo.save();
    }

    // Handle preferences
    if (preferencesData) {
      const preferences = await provider.ensurePreferences();
      oldData.preferences = preferences.toObject();
      
      if (preferencesData.notificationSettings !== undefined) {
        preferences.notificationSettings = {
          ...preferences.notificationSettings,
          ...preferencesData.notificationSettings
        };
      }
      if (preferencesData.jobPreferences !== undefined) {
        preferences.jobPreferences = {
          ...preferences.jobPreferences,
          ...preferencesData.jobPreferences
        };
      }
      if (preferencesData.communicationPreferences !== undefined) {
        preferences.communicationPreferences = {
          ...preferences.communicationPreferences,
          ...preferencesData.communicationPreferences
        };
      }
      
      await preferences.save();
    }

    // Handle performance (admin can update certain fields)
    if (performanceData) {
      const performance = await provider.ensurePerformance();
      oldData.performance = performance.toObject();
      
      if (performanceData.rating !== undefined) {
        performance.rating = performanceData.rating;
      }
      if (performanceData.totalReviews !== undefined) {
        performance.totalReviews = performanceData.totalReviews;
      }
      if (performanceData.totalJobs !== undefined) {
        performance.totalJobs = performanceData.totalJobs;
      }
      if (performanceData.completedJobs !== undefined) {
        performance.completedJobs = performanceData.completedJobs;
      }
      if (performanceData.cancelledJobs !== undefined) {
        performance.cancelledJobs = performanceData.cancelledJobs;
      }
      if (performanceData.responseTime !== undefined) {
        performance.responseTime = performanceData.responseTime;
      }
      if (performanceData.completionRate !== undefined) {
        performance.completionRate = performanceData.completionRate;
      }
      if (performanceData.repeatCustomerRate !== undefined) {
        performance.repeatCustomerRate = performanceData.repeatCustomerRate;
      }
      if (performanceData.earnings !== undefined) {
        performance.earnings = {
          ...performance.earnings,
          ...performanceData.earnings
        };
      }
      if (performanceData.badges !== undefined) {
        performance.badges = performanceData.badges;
      }
      
      await performance.save();
    }

    // Reload provider with all populated data
    const updatedProvider = await Provider.findById(id)
      .populate('userId', 'firstName lastName email phone phoneNumber profileImage profile roles isActive verification badges')
      .populate('professionalInfo')
      .populate('professionalInfo.specialties.skills', 'name description category metadata')
      .populate('businessInfo')
      .populate('verification', '-backgroundCheck.reportId -insurance.documents')
      .populate('preferences')
      .populate('performance')
      .populate('financialInfo')
      .lean();

    // Exclude category from specialties in response
    if (updatedProvider.professionalInfo && updatedProvider.professionalInfo.specialties && Array.isArray(updatedProvider.professionalInfo.specialties)) {
      updatedProvider.professionalInfo.specialties = updatedProvider.professionalInfo.specialties.map(specialty => {
        // eslint-disable-next-line no-unused-vars
        const { category: _category, ...specialtyWithoutCategory } = specialty;
        return specialtyWithoutCategory;
      });
    }

    // Log audit event
    await auditLogger.logSystem('admin_action', req, {
      type: 'provider',
      id: provider._id,
      name: 'Provider Full Update'
    }, {
      before: oldProviderData,
      after: updateData,
      updatedCollections: Object.keys(oldData),
      fields: Object.keys(updateData)
    });

    logger.info('Provider updated by admin', {
      adminId: req.user.id,
      providerId: id,
      updatedFields: Object.keys(updateData),
      updatedCollections: Object.keys(oldData)
    });

    res.json({
      success: true,
      message: 'Provider updated successfully',
      data: updatedProvider
    });
  } catch (error) {
    logger.error('Failed to update provider (admin)', error, {
      adminId: req.user.id,
      providerId: req.params.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update provider',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get provider real-time metrics
const getProviderMetrics = async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.id })
      .populate('userId', 'firstName lastName email avatar');
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    const performance = await provider.ensurePerformance();
    
    // Get today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get this week's metrics
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    // Calculate today's bookings and earnings
    const Booking = require('../models/Booking');
    const todayBookings = await Booking.countDocuments({
      provider: provider._id,
      createdAt: { $gte: today },
      status: { $in: ['confirmed', 'in_progress', 'completed'] }
    });
    
    const weekBookings = await Booking.countDocuments({
      provider: provider._id,
      createdAt: { $gte: weekStart },
      status: { $in: ['confirmed', 'in_progress', 'completed'] }
    });
    
    // Calculate earnings
    const completedBookings = await Booking.find({
      provider: provider._id,
      status: 'completed',
      completedAt: { $gte: today }
    }).select('pricing');
    
    const todayEarnings = completedBookings.reduce((sum, booking) => {
      return sum + (booking.pricing?.providerEarnings || booking.pricing?.total * 0.85 || 0);
    }, 0);
    
    const weekBookingsData = await Booking.find({
      provider: provider._id,
      status: 'completed',
      completedAt: { $gte: weekStart }
    }).select('pricing');
    
    const weekEarnings = weekBookingsData.reduce((sum, booking) => {
      return sum + (booking.pricing?.providerEarnings || booking.pricing?.total * 0.85 || 0);
    }, 0);
    
    // Get new messages count
    const Message = require('../models/Message');
    const newMessagesCount = await Message.countDocuments({
      recipient: req.user.id,
      read: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    // Get new clients count
    const newClientsCount = await Booking.distinct('client', {
      provider: provider._id,
      createdAt: { $gte: weekStart }
    }).then(clients => clients.length);
    
    // Calculate monthly goal progress
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyBookings = await Booking.find({
      provider: provider._id,
      status: 'completed',
      completedAt: { $gte: monthStart }
    }).select('pricing');
    
    const monthlyEarnings = monthlyBookings.reduce((sum, booking) => {
      return sum + (booking.pricing?.providerEarnings || booking.pricing?.total * 0.85 || 0);
    }, 0);
    
    const monthlyGoal = 15000; // This should come from provider settings
    const goalProgress = Math.min(Math.round((monthlyEarnings / monthlyGoal) * 100), 100);
    
    // Estimate completion date
    const daysElapsed = today.getDate();
    const dailyAverage = monthlyEarnings / daysElapsed;
    const daysToGoal = Math.ceil((monthlyGoal - monthlyEarnings) / dailyAverage);
    const projectedCompletion = new Date(today);
    projectedCompletion.setDate(today.getDate() + daysToGoal);
    
    const metrics = {
      today: {
        earnings: Math.round(todayEarnings),
        bookings: todayBookings,
        hours: Math.round(completedBookings.reduce((sum, b) => sum + (b.duration || 0), 0)),
        newMessages: newMessagesCount
      },
      thisWeek: {
        earnings: Math.round(weekEarnings),
        bookings: weekBookings,
        hours: Math.round(weekBookingsData.reduce((sum, b) => sum + (b.duration || 0), 0)),
        newClients: newClientsCount
      },
      performance: {
        rating: performance.rating || 0,
        completionRate: performance.completionRate || 0,
        responseTime: performance.responseTime || '0h',
        acceptanceRate: performance.acceptanceRate || 0
      },
      goals: {
        monthlyEarningsGoal: monthlyGoal,
        progress: goalProgress,
        currentEarnings: Math.round(monthlyEarnings),
        projectedCompletion: projectedCompletion.toISOString().split('T')[0]
      }
    };

    logger.info('Provider metrics retrieved', {
      userId: req.user.id,
      providerId: provider._id
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get provider metrics', error, {
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve provider metrics'
    });
  }
};

// Get provider activity feed
const getProviderActivity = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;
    
    const provider = await Provider.findOne({ userId: req.user.id });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    // Build activities array from different sources
    const activities = [];
    
    // Get recent bookings
    const Booking = require('../models/Booking');
    const Review = require('../models/Review');
    
    if (!type || type === 'booking') {
      const recentBookings = await Booking.find({
        provider: provider._id,
        updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate('client', 'firstName lastName avatar')
      .populate('service', 'title');
      
      for (const booking of recentBookings) {
        let activityType = 'booking_created';
        let title = 'New Booking';
        let description = `New booking for ${booking.service?.title || 'service'}`;
        let icon = 'calendar';
        let priority = 'normal';
        
        if (booking.status === 'completed') {
          activityType = 'booking_completed';
          title = 'Booking Completed';
          description = `You completed a service for ${booking.client?.firstName || 'client'}`;
          icon = 'check_circle';
        } else if (booking.status === 'confirmed') {
          activityType = 'booking_confirmed';
          title = 'Booking Confirmed';
          description = `Booking with ${booking.client?.firstName || 'client'} confirmed`;
          icon = 'check';
        } else if (booking.status === 'cancelled') {
          activityType = 'booking_cancelled';
          title = 'Booking Cancelled';
          description = `Booking was cancelled`;
          icon = 'cancel';
          priority = 'low';
        }
        
        activities.push({
          id: `booking_${booking._id}`,
          type: activityType,
          title,
          description,
          amount: booking.pricing?.providerEarnings || booking.pricing?.total * 0.85,
          timestamp: booking.updatedAt,
          icon,
          priority,
          relatedBooking: booking._id
        });
      }
    }
    
    // Get recent reviews
    if (!type || type === 'review') {
      const recentReviews = await Review.find({
        provider: provider._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('client', 'firstName lastName avatar');
      
      for (const review of recentReviews) {
        activities.push({
          id: `review_${review._id}`,
          type: 'new_review',
          title: 'New Review',
          description: `${review.client?.firstName || 'A client'} left you a ${review.rating}-star review`,
          rating: review.rating,
          timestamp: review.createdAt,
          icon: 'star',
          priority: review.rating >= 4 ? 'high' : 'normal',
          relatedReview: review._id
        });
      }
    }
    
    // Get payment activities
    if (!type || type === 'payment') {
      const Transaction = require('../models/Transaction');
      const recentPayments = await Transaction.find({
        user: req.user.id,
        type: { $in: ['booking_payment', 'tip', 'bonus', 'withdrawal'] },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .sort({ createdAt: -1 })
      .limit(20);
      
      for (const payment of recentPayments) {
        let title = 'Payment Received';
        let icon = 'payment';
        if (payment.type === 'tip') {
          title = 'Tip Received';
          icon = 'favorite';
        } else if (payment.type === 'bonus') {
          title = 'Bonus Received';
          icon = 'star';
        } else if (payment.type === 'withdrawal') {
          title = 'Withdrawal Processed';
          icon = 'account_balance';
        }
        
        activities.push({
          id: `payment_${payment._id}`,
          type: `payment_${payment.type}`,
          title,
          description: payment.description || `Payment of ${payment.currency} ${payment.amount}`,
          amount: payment.amount,
          timestamp: payment.createdAt,
          icon,
          priority: 'normal'
        });
      }
    }
    
    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Paginate
    const paginatedActivities = activities.slice(skip, skip + parseInt(limit));
    
    logger.info('Provider activity feed retrieved', {
      userId: req.user.id,
      providerId: provider._id,
      page,
      limit,
      type,
      totalActivities: activities.length
    });

    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(activities.length / limit),
          totalItems: activities.length,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get provider activity feed', error, {
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity feed'
    });
  }
};

// @desc    Get provider reviews
// @route   GET /api/providers/reviews
// @access  Private (Provider)
const getProviderReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating, sortBy = 'createdAt' } = req.query;
    const skip = (page - 1) * limit;

    const provider = await Provider.findOne({ user: req.user.id });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found',
        code: 'PROVIDER_NOT_FOUND'
      });
    }

    // Find all bookings for this provider with reviews
    const query = {
      provider: provider._id,
      'review.rating': { $exists: true }
    };

    // Filter by rating if provided
    if (rating) {
      query['review.rating'] = parseInt(rating);
    }

    // Get total count
    const total = await Booking.countDocuments(query);

    // Sort options
    let sortOptions = {};
    if (sortBy === 'rating') {
      sortOptions = { 'review.rating': -1 };
    } else {
      sortOptions = { 'review.createdAt': -1 };
    }

    // Get bookings with reviews
    const bookingsWithReviews = await Booking.find(query)
      .populate('client', 'firstName lastName profile.avatar')
      .populate('service', 'title category')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('review client service scheduledDate');

    // Format reviews
    const reviews = bookingsWithReviews.map(booking => ({
      _id: booking._id,
      rating: booking.review.rating,
      comment: booking.review.comment,
      categories: booking.review.categories,
      wouldRecommend: booking.review.wouldRecommend,
      photos: booking.review.photos || [],
      response: booking.review.response,
      createdAt: booking.review.createdAt,
      client: {
        _id: booking.client._id,
        name: `${booking.client.firstName} ${booking.client.lastName}`,
        avatar: booking.client.profile?.avatar
      },
      service: {
        _id: booking.service._id,
        title: booking.service.title,
        category: booking.service.category
      },
      scheduledDate: booking.scheduledDate
    }));

    // Calculate statistics
    const allReviews = await Booking.find({
      provider: provider._id,
      'review.rating': { $exists: true }
    }).select('review');

    const stats = {
      totalReviews: allReviews.length,
      averageRating: allReviews.length > 0 
        ? allReviews.reduce((sum, b) => sum + b.review.rating, 0) / allReviews.length 
        : 0,
      ratingDistribution: {
        5: allReviews.filter(b => b.review.rating === 5).length,
        4: allReviews.filter(b => b.review.rating === 4).length,
        3: allReviews.filter(b => b.review.rating === 3).length,
        2: allReviews.filter(b => b.review.rating === 2).length,
        1: allReviews.filter(b => b.review.rating === 1).length
      },
      recommendationRate: allReviews.length > 0
        ? (allReviews.filter(b => b.review.wouldRecommend).length / allReviews.length) * 100
        : 0,
      responseRate: allReviews.length > 0
        ? (allReviews.filter(b => b.review.response).length / allReviews.length) * 100
        : 0
    };

    logger.info('Provider reviews retrieved', {
      userId: req.user.id,
      providerId: provider._id,
      page,
      totalReviews: total
    });

    res.json({
      success: true,
      data: {
        reviews,
        statistics: stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get provider reviews', error, {
      userId: req.user.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reviews',
      code: 'GET_REVIEWS_ERROR'
    });
  }
};

// @desc    Respond to review
// @route   POST /api/providers/reviews/:reviewId/respond
// @access  Private (Provider)
const respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { responseText } = req.body;

    if (!validateObjectId(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format',
        code: 'INVALID_REVIEW_ID'
      });
    }

    if (!responseText || responseText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required',
        code: 'MISSING_RESPONSE'
      });
    }

    if (responseText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Response text must not exceed 1000 characters',
        code: 'RESPONSE_TOO_LONG'
      });
    }

    const provider = await Provider.findOne({ user: req.user.id });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found',
        code: 'PROVIDER_NOT_FOUND'
      });
    }

    // Find booking with the review
    const booking = await Booking.findOne({
      _id: reviewId,
      provider: provider._id,
      'review.rating': { $exists: true }
    }).populate('client', 'firstName lastName');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized',
        code: 'REVIEW_NOT_FOUND'
      });
    }

    // Check if already responded
    if (booking.review.response) {
      return res.status(409).json({
        success: false,
        message: 'You have already responded to this review',
        code: 'RESPONSE_EXISTS',
        data: {
          existingResponse: booking.review.response
        }
      });
    }

    // Add response
    booking.review.response = {
      text: responseText.trim(),
      respondedAt: new Date(),
      respondedBy: provider._id
    };

    await booking.save();

    logger.info('Provider responded to review', {
      userId: req.user.id,
      providerId: provider._id,
      reviewId: booking._id,
      clientId: booking.client._id
    });

    // Audit log
    await auditLogger.log({
      user: req.user.id,
      action: 'REVIEW_RESPONDED',
      resource: 'Review',
      resourceId: booking._id,
      details: {
        providerId: provider._id,
        rating: booking.review.rating,
        responseLength: responseText.length
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Response added successfully',
      data: {
        review: {
          _id: booking._id,
          rating: booking.review.rating,
          comment: booking.review.comment,
          response: booking.review.response,
          client: {
            name: `${booking.client.firstName} ${booking.client.lastName}`
          }
        }
      }
    });
  } catch (error) {
    logger.error('Failed to respond to review', error, {
      userId: req.user.id,
      reviewId: req.params.reviewId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to add response',
      code: 'RESPOND_REVIEW_ERROR'
    });
  }
};

module.exports = {
  getProviders,
  getProvider,
  getMyProviderProfile,
  createProviderProfile,
  updateProviderProfile,
  patchProviderProfile,
  updateOnboardingStep,
  uploadDocuments,
  getProviderDashboard,
  getProviderAnalytics,
  getProviderMetrics,
  getProviderActivity,
  updateProviderStatus,
  getProvidersForAdmin,
  getProviderSkills,
  adminUpdateProvider,
  getProviderReviews,
  respondToReview
};

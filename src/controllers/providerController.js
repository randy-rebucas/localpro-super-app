const mongoose = require('mongoose');
const Provider = require('../models/Provider');
const ProviderSkill = require('../models/ProviderSkill');
const ServiceCategory = require('../models/ServiceCategory');
const User = require('../models/User');
// Note: ProviderBusinessInfo, ProviderProfessionalInfo, ProviderVerification, 
// ProviderFinancialInfo, ProviderPreferences, and ProviderPerformance are 
// required dynamically inside functions where needed
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
        const ProviderBusinessInfo = require('../models/ProviderBusinessInfo');
        
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
      const ProviderPreferences = require('../models/ProviderPreferences');
      
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
      const ProviderFinancialInfo = require('../models/ProviderFinancialInfo');
      
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
  updateProviderStatus,
  getProvidersForAdmin,
  getProviderSkills,
  adminUpdateProvider
};

// @desc    Upload documents for partner verification
// @route   POST /api/partners/:id/upload-documents
// @access  Admin/Partner
const { uploaders } = require('../config/cloudinary');
const Partner = require('../models/Partner');
const { logger } = require('../utils/logger');
const { auditLogger } = require('../utils/auditLogger');
const { validationResult } = require('express-validator');

// @desc    Create a new partner (admin only)
// @route   POST /api/partners
// @access  Admin
const createPartner = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const {
      name,
      email,
      phoneNumber,
      businessInfo,
      slug
    } = req.body;

    // Check if partner with email already exists
    const existingPartner = await Partner.findOne({
      $or: [{ email }, { slug }],
      deleted: { $ne: true }
    });
    console.log(existingPartner);
    if (existingPartner) {
      return res.status(409).json({
        success: false,
        message: existingPartner.email === email
          ? 'Partner with this email already exists'
          : 'Partner with this slug already exists',
        partnerId: existingPartner._id,
        code: 'PARTNER_EXISTS'
      });
    }

    // Create partner
    const partner = new Partner({
      name,
      email,
      phoneNumber,
      businessInfo,
      slug: slug || Partner.generateSlug(name),
      managedBy: req.user._id
    });

    await partner.save();

    // Log audit event
    await auditLogger.logCustom(
      'data_create',
      'system',
      req,
      { type: 'partner', id: partner._id, name: partner.name },
      {},
      {
        partnerId: partner._id,
        partnerName: partner.name,
        partnerEmail: partner.email,
        action: 'PARTNER_CREATED'
      }
    );

    logger.info('Partner created successfully', {
      partnerId: partner._id,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      data: {
        partner: {
          id: partner._id,
          name: partner.name,
          email: partner.email,
          slug: partner.slug,
          status: partner.status,
          onboarding: partner.onboarding,
          createdAt: partner.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Failed to create partner', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create partner',
      code: 'PARTNER_CREATION_ERROR'
    });
  }
};

// @desc    Get all partners (admin only)
// @route   GET /api/partners
// @access  Admin
const getPartners = async (req, res) => {
  try {
    const {
      status,
      onboardingCompleted,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { deleted: { $ne: true } };

    // Apply filters
    if (status) query.status = status;
    if (onboardingCompleted !== undefined) {
      query['onboarding.completed'] = onboardingCompleted === 'true';
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'managedBy', select: 'firstName lastName email' }
      ]
    };

    const partners = await Partner.find(query)
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Partner.countDocuments(query);

    logger.info('Partners retrieved', {
      count: partners.length,
      total,
      filters: { status, onboardingCompleted, search }
    });

    res.json({
      success: true,
      data: {
        partners: partners.map(partner => ({
          id: partner._id,
          name: partner.name,
          email: partner.email,
          slug: partner.slug,
          status: partner.status,
          onboarding: partner.onboarding,
          businessInfo: partner.businessInfo,
          usage: partner.usage,
          managedBy: partner.managedBy,
          createdAt: partner.createdAt,
          updatedAt: partner.updatedAt
        })),
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get partners', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve partners',
      code: 'PARTNERS_RETRIEVAL_ERROR'
    });
  }
};

// @desc    Get partner by ID (admin only)
// @route   GET /api/partners/:id
// @access  Admin
const getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findById(id)
      .populate('managedBy', 'firstName lastName email')
      .populate('notes.addedBy', 'firstName lastName email');

    if (!partner || partner.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
        code: 'PARTNER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        partner: {
          id: partner._id,
          name: partner.name,
          email: partner.email,
          phoneNumber: partner.phoneNumber,
          slug: partner.slug,
          status: partner.status,
          businessInfo: partner.businessInfo,
          apiCredentials: {
            clientId: partner.apiCredentials.clientId,
            webhookUrl: partner.apiCredentials.webhookUrl,
            callbackUrl: partner.apiCredentials.callbackUrl
          },
          onboarding: partner.onboarding,
          verification: partner.verification,
          usage: partner.usage,
          notes: partner.notes,
          tags: partner.tags,
          managedBy: partner.managedBy,
          createdAt: partner.createdAt,
          updatedAt: partner.updatedAt
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get partner by ID', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve partner',
      code: 'PARTNER_RETRIEVAL_ERROR'
    });
  }
};

// @desc    Update partner (admin only)
// @route   PUT /api/partners/:id
// @access  Admin
const updatePartner = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { id } = req.params;
    const updates = req.body;

    const partner = await Partner.findById(id);

    if (!partner || partner.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
        code: 'PARTNER_NOT_FOUND'
      });
    }

    // Update fields
    const allowedUpdates = [
      'name', 'email', 'phoneNumber', 'businessInfo',
      'status', 'tags', 'apiCredentials'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'apiCredentials') {
          Object.assign(partner.apiCredentials, updates.apiCredentials);
        } else if (field === 'businessInfo') {
          // Handle businessInfo specially to avoid undefined address issues
          const { address, ...businessInfoWithoutAddress } = updates.businessInfo || {};

          // Ensure businessInfo object exists
          if (!partner.businessInfo) {
            partner.businessInfo = {};
          }

          // Update non-address fields
          Object.keys(businessInfoWithoutAddress).forEach(key => {
            if (businessInfoWithoutAddress[key] !== undefined) {
              partner.businessInfo[key] = businessInfoWithoutAddress[key];
            }
          });

          // Handle address separately
          if (address !== undefined) {
            if (address === null) {
              partner.businessInfo.address = null;
            } else if (address && typeof address === 'object') {
              partner.businessInfo.address = {
                ...(partner.businessInfo.address || {}),
                ...address
              };
              // Remove undefined values from address
              Object.keys(partner.businessInfo.address).forEach(key => {
                if (partner.businessInfo.address[key] === undefined) {
                  delete partner.businessInfo.address[key];
                }
              });
            }
          }

          // Remove undefined values from businessInfo
          Object.keys(partner.businessInfo).forEach(key => {
            if (partner.businessInfo[key] === undefined) {
              delete partner.businessInfo[key];
            }
          });
        } else {
          partner[field] = updates[field];
        }
      }
    });

    await partner.save();

    // Log audit event
    await auditLogger.logCustom(
      'data_update',
      'system',
      req,
      { type: 'partner', id: partner._id, name: partner.name },
      { fields: Object.keys(updates) },
      {
        partnerId: partner._id,
        partnerName: partner.name,
        changes: Object.keys(updates),
        action: 'PARTNER_UPDATED'
      }
    );

    logger.info('Partner updated successfully', {
      partnerId: partner._id,
      updatedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Partner updated successfully',
      data: {
        partner: {
          id: partner._id,
          name: partner.name,
          email: partner.email,
          slug: partner.slug,
          status: partner.status,
          businessInfo: partner.businessInfo,
          updatedAt: partner.updatedAt
        }
      }
    });
  } catch (error) {
    // Log detailed error information for debugging
    console.error('Error updating partner:', {
      message: error.message,
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors,
      stack: error.stack
    });

    logger.error('Failed to update partner', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      partnerId: req.params.id,
      body: req.body
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }

    if (error.code === 11000) {
      // Duplicate key error (MongoDB)
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Partner with this ${duplicateField} already exists`,
        code: 'DUPLICATE_ENTRY',
        field: duplicateField
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to update partner',
      code: 'PARTNER_UPDATE_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        details: error.stack
      })
    });
  }
};

// @desc    Delete partner (soft delete, admin only)
// @route   DELETE /api/partners/:id
// @access  Admin
const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findById(id);

    if (!partner || partner.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
        code: 'PARTNER_NOT_FOUND'
      });
    }

    await partner.softDelete(req.user._id);

    // Log audit event
    await auditLogger.logCustom(
      'data_delete',
      'system',
      req,
      { type: 'partner', id: partner._id, name: partner.name },
      {},
      {
        partnerId: partner._id,
        partnerName: partner.name,
        action: 'PARTNER_DELETED'
      }
    );

    logger.info('Partner deleted successfully', {
      partnerId: partner._id,
      deletedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Partner deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete partner', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete partner',
      code: 'PARTNER_DELETION_ERROR'
    });
  }
};

// @desc    Add note to partner (admin only)
// @route   POST /api/partners/:id/notes
// @access  Admin
const addPartnerNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
        code: 'MISSING_NOTE_CONTENT'
      });
    }

    const partner = await Partner.findById(id);

    if (!partner || partner.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
        code: 'PARTNER_NOT_FOUND'
      });
    }

    await partner.addNote(content.trim(), req.user._id);

    // Log audit event
    await auditLogger.logCustom(
      'data_update',
      'system',
      req,
      { type: 'partner', id: partner._id, name: partner.name },
      {},
      {
        partnerId: partner._id,
        partnerName: partner.name,
        noteLength: content.length,
        action: 'PARTNER_NOTE_ADDED'
      }
    );

    logger.info('Note added to partner', {
      partnerId: partner._id,
      addedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Note added successfully'
    });
  } catch (error) {
    logger.error('Failed to add partner note', error);

    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      code: 'PARTNER_NOTE_ERROR'
    });
  }
};

// @desc    Partner onboarding - Start onboarding
// @route   POST /api/partners/onboarding/start
// @access  Public
const startPartnerOnboarding = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { name, email, phoneNumber, managedBy } = req.body;

    // Check if partner already exists
    const existingPartner = await Partner.findOne({
      email,
      deleted: { $ne: true }
    });

    if (existingPartner) {
      return res.status(409).json({
        success: false,
        message: 'Partner with this email already exists',
        code: 'PARTNER_EXISTS',
        partnerId: existingPartner._id
      });
    }

    // Generate slug from name
    let baseSlug = Partner.generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (await Partner.findOne({ slug, deleted: { $ne: true } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create partner with basic info
    const partner = new Partner({
      name,
      email,
      phoneNumber,
      managedBy,
      slug,
      onboarding: {
        steps: [{
          step: 'basic_info',
          completed: true,
          completedAt: new Date(),
          data: { name, email, phoneNumber, managedBy }
        }],
        currentStep: 'business_info',
        progress: 20
      }
    });

    await partner.save();

    logger.info('Partner onboarding started', {
      partnerId: partner._id,
      email: partner.email
    });

    res.status(201).json({
      success: true,
      message: 'Partner onboarding started successfully',
      data: {
        partner: {
          id: partner._id,
          name: partner.name,
          email: partner.email,
          slug: partner.slug,
          onboarding: partner.onboarding
        }
      }
    });
  } catch (error) {
    logger.error('Failed to start partner onboarding', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      body: req.body
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }

    if (error.code === 11000) {
      // Duplicate key error (MongoDB)
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Partner with this ${duplicateField} already exists`,
        code: 'DUPLICATE_ENTRY',
        field: duplicateField
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to start onboarding',
      code: 'ONBOARDING_START_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        details: error.stack
      })
    });
  }
};

// @desc    Partner onboarding - Update business info
// @route   PUT /api/partners/onboarding/:id/business-info
// @access  Public
const updateBusinessInfo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { id } = req.params;
    const { businessInfo } = req.body;
    const partner = await Partner.findById(id);

    if (!partner || partner.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
        code: 'PARTNER_NOT_FOUND'
      });
    }

    // Ensure businessInfo object exists
    if (!partner.businessInfo) {
      partner.businessInfo = {};
    }

    // Update business info if provided
    if (businessInfo && typeof businessInfo === 'object') {
      // Extract address separately to handle it specially
      const { address, ...businessInfoWithoutAddress } = businessInfo;

      // Merge business info (excluding address for now)
      const mergedBusinessInfo = {
        ...partner.businessInfo
      };

      // Update non-address fields, removing undefined values
      Object.keys(businessInfoWithoutAddress).forEach(key => {
        if (businessInfoWithoutAddress[key] !== undefined) {
          mergedBusinessInfo[key] = businessInfoWithoutAddress[key];
        }
      });

      // Handle address separately - only set if it has actual values
      if (address !== undefined) {
        if (address === null) {
          // Explicitly allow null to clear address
          mergedBusinessInfo.address = null;
        } else if (address && typeof address === 'object') {
          // Merge address objects
          mergedBusinessInfo.address = {
            ...(partner.businessInfo.address || {}),
            ...address
          };
          // Remove undefined values from address
          Object.keys(mergedBusinessInfo.address).forEach(key => {
            if (mergedBusinessInfo.address[key] === undefined) {
              delete mergedBusinessInfo.address[key];
            }
          });
        }
        // If address is undefined, don't touch it - keep existing
      }
      // If address is not in businessInfo at all, keep existing address

      // Final cleanup: remove any undefined values (shouldn't be any, but just in case)
      Object.keys(mergedBusinessInfo).forEach(key => {
        if (mergedBusinessInfo[key] === undefined) {
          delete mergedBusinessInfo[key];
        }
      });

      partner.businessInfo = mergedBusinessInfo;
    }

    // Ensure onboarding structure exists
    if (!partner.onboarding) {
      partner.onboarding = {
        steps: [],
        currentStep: 'business_info',
        progress: 0
      };
    }
    if (!partner.onboarding.steps) {
      partner.onboarding.steps = [];
    }

    // Complete business info step
    // Note: We complete the step even if businessInfo is empty to allow
    // partners to skip optional fields and move to next step
    try {
      let result = await partner.completeOnboardingStep('business_info', businessInfo || {});
    } catch (stepError) {
      // If completeOnboardingStep fails, try manual save
      const stepIndex = partner.onboarding.steps.findIndex(s => s.step === 'business_info');
      if (stepIndex >= 0) {
        partner.onboarding.steps[stepIndex].completed = true;
        partner.onboarding.steps[stepIndex].completedAt = new Date();
        partner.onboarding.steps[stepIndex].data = businessInfo || {};
      } else {
        partner.onboarding.steps.push({
          step: 'business_info',
          completed: true,
          completedAt: new Date(),
          data: businessInfo || {}
        });
      }

      // Update current step
      const stepOrder = ['basic_info', 'business_info', 'api_setup', 'verification', 'activation'];
      const currentStepIndex = stepOrder.indexOf('business_info');
      if (currentStepIndex < stepOrder.length - 1) {
        partner.onboarding.currentStep = stepOrder[currentStepIndex + 1];
      }

      // Update progress
      const completedSteps = partner.onboarding.steps.filter(step => step.completed).length;
      partner.onboarding.progress = Math.round((completedSteps / 5) * 100);

      // Save manually
      await partner.save();
      console.log('Manual save successful');
    }

    logger.info('Partner business info updated', {
      partnerId: partner._id,
      hasCompanyName: !!businessInfo?.companyName
    });

    res.json({
      success: true,
      message: 'Business information updated successfully',
      data: {
        partner: {
          id: partner._id,
          businessInfo: partner.businessInfo,
          onboarding: partner.onboarding
        }
      }
    });
  } catch (error) {
    // Log detailed error information for debugging
    console.error('Error updating business info:', {
      message: error.message,
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors,
      stack: error.stack
    });

    logger.error('Failed to update business info', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      partnerId: req.params.id,
      body: req.body
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }

    if (error.code === 11000) {
      // Duplicate key error (MongoDB)
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Partner with this ${duplicateField} already exists`,
        code: 'DUPLICATE_ENTRY',
        field: duplicateField
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to update business information',
      code: 'BUSINESS_INFO_UPDATE_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        details: error.stack
      })
    });
  }
};

const uploadDocumentsForVerification = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: req.file
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while uploading document',
      code: 'UPLOAD_ERROR'
    });
  };
};

// @desc    Partner onboarding - Complete verification
// @route   PUT /api/partners/onboarding/:id/verification
// @access  Public
const completeVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { id } = req.params;
    const { documents } = req.body;

    const partner = await Partner.findById(id);

    if (!partner || partner.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
        code: 'PARTNER_NOT_FOUND'
      });
    }

    // Update verification documents
    if (documents && Array.isArray(documents)) {
      partner.verification.documents = documents;
    }

    // Complete verification step
    await partner.completeOnboardingStep('verification', { documents });

    logger.info('Partner verification completed', {
      partnerId: partner._id,
      documentCount: documents?.length || 0
    });

    res.json({
      success: true,
      message: 'Verification completed successfully',
      data: {
        partner: {
          id: partner._id,
          verification: partner.verification,
          onboarding: partner.onboarding
        }
      }
    });
  } catch (error) {
    logger.error('Failed to complete verification', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      partnerId: req.params.id,
      body: req.body
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to complete verification',
      code: 'VERIFICATION_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        details: error.stack
      })
    });
  }
};

// @desc    Partner onboarding - Complete API setup
// @route   PUT /api/partners/onboarding/:id/api-setup
// @access  Public
const completeApiSetup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { id } = req.params;
    const { webhookUrl, callbackUrl } = req.body;

    const partner = await Partner.findById(id);

    if (!partner || partner.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
        code: 'PARTNER_NOT_FOUND'
      });
    }

    // Update API settings
    if (webhookUrl) partner.apiCredentials.webhookUrl = webhookUrl;
    if (callbackUrl) partner.apiCredentials.callbackUrl = callbackUrl;

    // Complete API setup step
    await partner.completeOnboardingStep('api_setup', {
      webhookUrl,
      callbackUrl,
      clientId: partner.apiCredentials.clientId
    });

    logger.info('Partner API setup completed', {
      partnerId: partner._id,
      hasWebhook: !!webhookUrl,
      hasCallback: !!callbackUrl
    });

    res.json({
      success: true,
      message: 'API setup completed successfully',
      data: {
        partner: {
          id: partner._id,
          apiCredentials: {
            clientId: partner.apiCredentials.clientId,
            webhookUrl: partner.apiCredentials.webhookUrl,
            callbackUrl: partner.apiCredentials.callbackUrl
          },
          onboarding: partner.onboarding
        }
      }
    });
  } catch (error) {
    logger.error('Failed to complete API setup', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      partnerId: req.params.id,
      body: req.body
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to complete API setup',
      code: 'API_SETUP_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        details: error.stack
      })
    });
  }
};

// @desc    Partner onboarding - Complete activation
// @route   PUT /api/partners/onboarding/:id/activate
// @access  Public
const activatePartner = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findById(id);

    if (!partner || partner.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
        code: 'PARTNER_NOT_FOUND'
      });
    }

    // Check if all previous steps are completed
    const requiredSteps = ['basic_info', 'business_info', 'api_setup', 'verification'];
    const completedSteps = partner.onboarding.steps
      .filter(step => step.completed)
      .map(step => step.step);

    const allStepsCompleted = requiredSteps.every(step => completedSteps.includes(step));

    if (!allStepsCompleted) {
      return res.status(400).json({
        success: false,
        message: 'All onboarding steps must be completed before activation',
        code: 'INCOMPLETE_ONBOARDING'
      });
    }

    // Generate API credentials and activate
    await partner.generateApiCredentials();
    partner.status = 'active';
    await partner.completeOnboardingStep('activation', {
      activatedAt: new Date(),
      apiKey: partner.apiCredentials.apiKey
    });

    logger.info('Partner activated successfully', {
      partnerId: partner._id,
      email: partner.email
    });

    res.json({
      success: true,
      message: 'Partner activated successfully',
      data: {
        partner: {
          id: partner._id,
          name: partner.name,
          email: partner.email,
          slug: partner.slug,
          status: partner.status,
          apiCredentials: {
            clientId: partner.apiCredentials.clientId,
            apiKey: partner.apiCredentials.apiKey,
            webhookUrl: partner.apiCredentials.webhookUrl,
            callbackUrl: partner.apiCredentials.callbackUrl
          },
          onboarding: partner.onboarding
        }
      }
    });
  } catch (error) {
    logger.error('Failed to activate partner', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      partnerId: req.params.id
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }

    if (error.code === 11000) {
      // Duplicate key error (MongoDB)
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Partner with this ${duplicateField} already exists`,
        code: 'DUPLICATE_ENTRY',
        field: duplicateField
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to activate partner',
      code: 'ACTIVATION_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        details: error.stack
      })
    });
  }
};

// @desc    Get partner by slug (for third-party login)
// @route   GET /api/partners/slug/:slug
// @access  Public
const getPartnerBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const partner = await Partner.findBySlug(slug);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
        code: 'PARTNER_NOT_FOUND'
      });
    }

    // Only return active partners for public access
    if (partner.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
        code: 'PARTNER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        partner: {
          id: partner._id,
          name: partner.name,
          slug: partner.slug,
          businessInfo: {
            companyName: partner.businessInfo.companyName,
            website: partner.businessInfo.website,
            industry: partner.businessInfo.industry,
            description: partner.businessInfo.description
          }
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get partner by slug', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve partner',
      code: 'PARTNER_RETRIEVAL_ERROR'
    });
  }
};

module.exports = {
  createPartner,
  getPartners,
  getPartnerById,
  updatePartner,
  deletePartner,
  addPartnerNote,
  startPartnerOnboarding,
  updateBusinessInfo,
  completeVerification,
  completeApiSetup,
  activatePartner,
  getPartnerBySlug,
  uploadDocumentsForVerification
};

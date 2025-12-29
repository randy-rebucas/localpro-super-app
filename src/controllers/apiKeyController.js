const ApiKey = require('../models/ApiKey');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * @desc    Create a new API key
 * @route   POST /api/api-keys
 * @access  Private (Authenticated users)
 */
const createApiKey = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { name, description, expiresAt, rateLimit, allowedIPs, scopes, metadata } = req.body;

    // Generate API key and secret
    const { accessKey, secretKey, secretKeyHash } = ApiKey.generateKeys();

    // Create API key document
    const apiKey = new ApiKey({
      name: name || `API Key ${new Date().toISOString()}`,
      description,
      accessKey,
      secretKey,
      secretKeyHash,
      userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      rateLimit: rateLimit || 1000,
      allowedIPs: allowedIPs || [],
      scopes: scopes || ['read', 'write'],
      metadata: metadata || {}
    });

    await apiKey.save();

    // Return the API key with secret (only shown once)
    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: {
        id: apiKey._id,
        name: apiKey.name,
        description: apiKey.description,
        accessKey: apiKey.accessKey,
        secretKey: secretKey, // Only shown once during creation
        expiresAt: apiKey.expiresAt,
        rateLimit: apiKey.rateLimit,
        allowedIPs: apiKey.allowedIPs,
        scopes: apiKey.scopes,
        createdAt: apiKey.createdAt,
        warning: 'Save this secret key now. It will not be shown again.'
      }
    });
  } catch (error) {
    logger.error('Error creating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create API key',
      error: error.message
    });
  }
};

/**
 * @desc    Get all API keys for the authenticated user
 * @route   GET /api/api-keys
 * @access  Private (Authenticated users)
 */
const getApiKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, isActive } = req.query;

    const query = { userId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [apiKeys, total] = await Promise.all([
      ApiKey.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-secretKeyHash'),
      ApiKey.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: apiKeys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error getting API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get API keys',
      error: error.message
    });
  }
};

/**
 * @desc    Get a single API key by ID
 * @route   GET /api/api-keys/:id
 * @access  Private (Authenticated users - own keys only)
 */
const getApiKeyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const apiKey = await ApiKey.findOne({ _id: id, userId }).select('-secretKeyHash');

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    res.status(200).json({
      success: true,
      data: apiKey
    });
  } catch (error) {
    logger.error('Error getting API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get API key',
      error: error.message
    });
  }
};

/**
 * @desc    Update an API key
 * @route   PUT /api/api-keys/:id
 * @access  Private (Authenticated users - own keys only)
 */
const updateApiKey = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, isActive, rateLimit, allowedIPs, scopes, metadata, expiresAt } = req.body;

    const apiKey = await ApiKey.findOne({ _id: id, userId });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Update fields
    if (name !== undefined) apiKey.name = name;
    if (description !== undefined) apiKey.description = description;
    if (isActive !== undefined) apiKey.isActive = isActive;
    if (rateLimit !== undefined) apiKey.rateLimit = rateLimit;
    if (allowedIPs !== undefined) apiKey.allowedIPs = allowedIPs;
    if (scopes !== undefined) apiKey.scopes = scopes;
    if (metadata !== undefined) apiKey.metadata = metadata;
    if (expiresAt !== undefined) apiKey.expiresAt = expiresAt ? new Date(expiresAt) : null;

    await apiKey.save();

    res.status(200).json({
      success: true,
      message: 'API key updated successfully',
      data: apiKey
    });
  } catch (error) {
    logger.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API key',
      error: error.message
    });
  }
};

/**
 * @desc    Delete/Revoke an API key
 * @route   DELETE /api/api-keys/:id
 * @access  Private (Authenticated users - own keys only)
 */
const deleteApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const apiKey = await ApiKey.findOne({ _id: id, userId });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    await apiKey.deleteOne();

    res.status(200).json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    logger.error('Error deleting API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke API key',
      error: error.message
    });
  }
};

/**
 * @desc    Regenerate secret key for an API key
 * @route   POST /api/api-keys/:id/regenerate-secret
 * @access  Private (Authenticated users - own keys only)
 */
const regenerateSecret = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const apiKey = await ApiKey.findOne({ _id: id, userId });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    // Generate new secret
    const { secretKey, secretKeyHash } = ApiKey.generateKeys();
    apiKey.secretKeyHash = secretKeyHash;
    await apiKey.save();

    res.status(200).json({
      success: true,
      message: 'Secret key regenerated successfully',
      data: {
        id: apiKey._id,
        accessKey: apiKey.accessKey,
        secretKey: secretKey, // Only shown once during regeneration
        warning: 'Save this secret key now. It will not be shown again.'
      }
    });
  } catch (error) {
    logger.error('Error regenerating secret:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate secret key',
      error: error.message
    });
  }
};

/**
 * @desc    Get API key statistics
 * @route   GET /api/api-keys/stats
 * @access  Private (Authenticated users)
 */
const getApiKeyStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [total, active, expired, lastUsed] = await Promise.all([
      ApiKey.countDocuments({ userId }),
      ApiKey.countDocuments({ userId, isActive: true }),
      ApiKey.countDocuments({ 
        userId, 
        expiresAt: { $lt: new Date() } 
      }),
      ApiKey.findOne({ userId })
        .sort({ lastUsedAt: -1 })
        .select('lastUsedAt')
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        expired,
        inactive: total - active,
        lastUsedAt: lastUsed?.lastUsedAt || null
      }
    });
  } catch (error) {
    logger.error('Error getting API key stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get API key statistics',
      error: error.message
    });
  }
};

module.exports = {
  createApiKey,
  getApiKeys,
  getApiKeyById,
  updateApiKey,
  deleteApiKey,
  regenerateSecret,
  getApiKeyStats
};


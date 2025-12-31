const Agency = require('../models/Agency');
const User = require('../models/User');
const CloudinaryService = require('../services/cloudinaryService');
const GoogleMapsService = require('../services/googleMapsService');

// @desc    Get all agencies
// @route   GET /api/agencies
// @access  Public
const getAgencies = async (req, res) => {
  try {
    const {
      search,
      location,
      serviceType,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Text search
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Location filter
    if (location) {
      filter['contact.address.city'] = new RegExp(location, 'i');
    }

    // Service type filter
    if (serviceType) {
      filter['services.category'] = serviceType;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const agencies = await Agency.find(filter)
      .populate('owner', 'firstName lastName profile.avatar')
      .populate('providers.user', 'firstName lastName profile.avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Agency.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: agencies.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: agencies
    });
  } catch (error) {
    console.error('Get agencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single agency
// @route   GET /api/agencies/:id
// @access  Public
const getAgency = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid agency ID format'
      });
    }

    const agency = await Agency.findById(req.params.id)
      .populate('owner', 'firstName lastName profile.avatar profile.bio')
      .populate('admins.user', 'firstName lastName profile.avatar')
      .populate('providers.user', 'firstName lastName profile.avatar profile.rating')
      .populate('providers.user.profile.skills');

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    res.status(200).json({
      success: true,
      data: agency
    });
  } catch (error) {
    console.error('Get agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new agency
// @route   POST /api/agencies
// @access  Private
const createAgency = async (req, res) => {
  try {
    const agencyData = {
      ...req.body,
      owner: req.user.id
    };

    // Geocode address if provided
    if (agencyData.contact?.address?.street) {
      try {
        const address = `${agencyData.contact.address.street}, ${agencyData.contact.address.city}, ${agencyData.contact.address.state}`;
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);
        
        if (geocodeResult.success && geocodeResult.data.length > 0) {
          const location = geocodeResult.data[0];
          agencyData.contact.address.coordinates = {
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng
          };
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    const agency = await Agency.create(agencyData);

    // Add owner as admin
    await agency.addAdmin(req.user.id, 'admin', ['all']);

    res.status(201).json({
      success: true,
      message: 'Agency created successfully',
      data: agency
    });
  } catch (error) {
    console.error('Create agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update agency
// @route   PUT /api/agencies/:id
// @access  Private
const updateAgency = async (req, res) => {
  try {
    let agency = await Agency.findById(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user has access to update this agency
    if (!agency.hasAccess(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this agency'
      });
    }

    // Geocode address if changed
    if (req.body.contact?.address?.street && 
        req.body.contact.address.street !== agency.contact.address.street) {
      try {
        const address = `${req.body.contact.address.street}, ${req.body.contact.address.city}, ${req.body.contact.address.state}`;
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);
        
        if (geocodeResult.success && geocodeResult.data.length > 0) {
          const location = geocodeResult.data[0];
          req.body.contact.address.coordinates = {
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng
          };
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    agency = await Agency.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Agency updated successfully',
      data: agency
    });
  } catch (error) {
    console.error('Update agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Patch agency (partial update)
// @route   PATCH /api/agencies/:id
// @access  Private
const patchAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user has access to update this agency
    if (!agency.hasAccess(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this agency'
      });
    }

    const updateData = { ...req.body };
    const updatedFields = [];

    // Helper function to deep merge objects
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && !(source[key] instanceof Date) && source[key].constructor === Object) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };

    // Fields that should not be directly updated
    const restrictedFields = ['_id', 'owner', 'createdAt', 'updatedAt'];
    const allowedTopLevelFields = ['name', 'description', 'contact', 'business', 'serviceAreas', 'services', 'subscription', 'verification', 'analytics', 'settings', 'isActive'];

    // Update top-level fields
    for (const field of allowedTopLevelFields) {
      if (updateData[field] !== undefined) {
        if (field === 'contact' || field === 'business' || field === 'subscription' || field === 'verification' || field === 'analytics' || field === 'settings') {
          // Deep merge for nested objects
          if (!agency[field]) agency[field] = {};
          deepMerge(agency[field], updateData[field]);
        } else if (field === 'serviceAreas' || field === 'services') {
          // Replace arrays
          agency[field] = updateData[field];
        } else {
          agency[field] = updateData[field];
        }
        updatedFields.push(field);
        delete updateData[field];
      }
    }

    // Remove restricted fields
    restrictedFields.forEach(field => delete updateData[field]);

    // Geocode address if changed
    if (updatedFields.includes('contact') && req.body.contact?.address?.street) {
      try {
        const address = `${req.body.contact.address.street}, ${req.body.contact.address.city}, ${req.body.contact.address.state}`;
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);
        
        if (geocodeResult.success && geocodeResult.data.length > 0) {
          const location = geocodeResult.data[0];
          agency.contact.address.coordinates = {
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng
          };
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    // Save agency if there are updates
    if (updatedFields.length > 0) {
      await agency.save();
    }

    // Populate related documents for response
    await agency.populate([
      'owner',
      'admins.user',
      'providers.user'
    ]);

    res.status(200).json({
      success: true,
      message: 'Agency updated successfully',
      data: {
        agency,
        updatedFields
      }
    });
  } catch (error) {
    console.error('Patch agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agency',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete agency
// @route   DELETE /api/agencies/:id
// @access  Private
const deleteAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user is the owner
    if (agency.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the agency owner can delete the agency'
      });
    }

    // Soft delete
    agency.isActive = false;
    await agency.save();

    res.status(200).json({
      success: true,
      message: 'Agency deleted successfully'
    });
  } catch (error) {
    console.error('Delete agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload agency logo
// @route   POST /api/agencies/:id/logo
// @access  Private
const uploadAgencyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const agency = await Agency.findById(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user has access
    if (!agency.hasAccess(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload logo for this agency'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadFile(
      req.file, 
      'localpro/agencies/logos'
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload logo',
        error: uploadResult.error
      });
    }

    // Delete old logo if exists
    if (agency.logo && agency.logo.publicId) {
      await CloudinaryService.deleteFile(agency.logo.publicId);
    }

    // Update agency with new logo
    agency.logo = {
      url: uploadResult.data.secure_url,
      publicId: uploadResult.data.public_id
    };

    await agency.save();

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: agency.logo
    });
  } catch (error) {
    console.error('Upload agency logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add provider to agency
// @route   POST /api/agencies/:id/providers
// @access  Private
const addProvider = async (req, res) => {
  try {
    const { userId, commissionRate = 10 } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const agency = await Agency.findById(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user has access
    if (!agency.hasAccess(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add providers to this agency'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await agency.addProvider(userId, commissionRate);

    res.status(200).json({
      success: true,
      message: 'Provider added successfully'
    });
  } catch (error) {
    console.error('Add provider error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Remove provider from agency
// @route   DELETE /api/agencies/:id/providers/:providerId
// @access  Private
const removeProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    const agency = await Agency.findById(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user has access
    if (!agency.hasAccess(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove providers from this agency'
      });
    }

    agency.providers = agency.providers.filter(p => p.user.toString() !== providerId);
    await agency.save();

    res.status(200).json({
      success: true,
      message: 'Provider removed successfully'
    });
  } catch (error) {
    console.error('Remove provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update provider status
// @route   PUT /api/agencies/:id/providers/:providerId/status
// @access  Private
const updateProviderStatus = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const agency = await Agency.findById(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user has access
    if (!agency.hasAccess(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update provider status'
      });
    }

    await agency.updateProviderStatus(providerId, status);

    res.status(200).json({
      success: true,
      message: 'Provider status updated successfully'
    });
  } catch (error) {
    console.error('Update provider status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Add admin to agency
// @route   POST /api/agencies/:id/admins
// @access  Private
const addAdmin = async (req, res) => {
  try {
    const { userId, role = 'admin', permissions = [] } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const agency = await Agency.findById(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user is the owner
    if (agency.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the agency owner can add admins'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await agency.addAdmin(userId, role, permissions);

    res.status(200).json({
      success: true,
      message: 'Admin added successfully'
    });
  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Remove admin from agency
// @route   DELETE /api/agencies/:id/admins/:adminId
// @access  Private
const removeAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const agency = await Agency.findById(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user is the owner
    if (agency.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the agency owner can remove admins'
      });
    }

    await agency.removeAdmin(adminId);

    res.status(200).json({
      success: true,
      message: 'Admin removed successfully'
    });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get agency analytics
// @route   GET /api/agencies/:id/analytics
// @access  Private
const getAgencyAnalytics = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user has access
    if (!agency.hasAccess(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics for this agency'
      });
    }

    const analytics = {
      totalProviders: agency.providers.length,
      activeProviders: agency.providers.filter(p => p.status === 'active').length,
      totalBookings: agency.analytics.totalBookings,
      totalRevenue: agency.analytics.totalRevenue,
      averageRating: agency.analytics.averageRating,
      totalReviews: agency.analytics.totalReviews,
      monthlyStats: agency.analytics.monthlyStats,
      providerPerformance: agency.providers.map(provider => ({
        userId: provider.user,
        status: provider.status,
        commissionRate: provider.commissionRate,
        performance: provider.performance || {
          rating: 0,
          totalJobs: 0,
          completedJobs: 0,
          cancellationRate: 0
        }
      }))
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get agency analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's agencies
// @route   GET /api/agencies/my/agencies
// @access  Private
const getMyAgencies = async (req, res) => {
  try {
    const userId = req.user.id;

    const agencies = await Agency.find({
      $or: [
        { owner: userId },
        { 'admins.user': userId },
        { 'providers.user': userId }
      ],
      isActive: true
    })
    .populate('owner', 'firstName lastName profile.avatar')
    .populate('providers.user', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: agencies.length,
      data: agencies
    });
  } catch (error) {
    console.error('Get my agencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Join agency
// @route   POST /api/agencies/join
// @access  Private
const joinAgency = async (req, res) => {
  try {
    const { agencyId } = req.body;

    if (!agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Agency ID is required'
      });
    }

    const agency = await Agency.findById(agencyId);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user is already a provider
    if (agency.isProvider(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a provider in this agency'
      });
    }

    await agency.addProvider(req.user.id, 10); // Default 10% commission

    res.status(200).json({
      success: true,
      message: 'Successfully requested to join agency'
    });
  } catch (error) {
    console.error('Join agency error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Leave agency
// @route   POST /api/agencies/leave
// @access  Private
const leaveAgency = async (req, res) => {
  try {
    const { agencyId } = req.body;

    if (!agencyId) {
      return res.status(400).json({
        success: false,
        message: 'Agency ID is required'
      });
    }

    const agency = await Agency.findById(agencyId);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user is a provider
    if (!agency.isProvider(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a provider in this agency'
      });
    }

    agency.providers = agency.providers.filter(p => p.user.toString() !== req.user.id);
    await agency.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left agency'
    });
  } catch (error) {
    console.error('Leave agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update agency verification status
// @route   PATCH /api/agencies/:id/verification
// @access  Private (owner or admin)
const updateAgencyVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { verification } = req.body;

    const agency = await Agency.findById(id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Only owner or admin can update verification
    const isOwner = agency.owner.toString() === req.user.id;
    const isAdmin = agency.isAdmin && agency.isAdmin(req.user.id);
    const isAuthorized = isOwner || isAdmin || req.user.role === 'admin';
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update agency verification'
      });
    }

    // Update verification fields
    if (typeof verification?.isVerified === 'boolean') {
      agency.verification.isVerified = verification.isVerified;
      agency.verification.verifiedAt = verification.isVerified ? new Date() : null;
    }
    if (Array.isArray(verification?.documents)) {
      agency.verification.documents = verification.documents;
    }

    await agency.save();

    res.status(200).json({
      success: true,
      message: 'Agency verification updated successfully',
      data: agency.verification
    });
  } catch (error) {
    console.error('Update agency verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAgencies,
  getAgency,
  createAgency,
  updateAgency,
  patchAgency,
  deleteAgency,
  uploadAgencyLogo,
  addProvider,
  removeProvider,
  updateProviderStatus,
  addAdmin,
  removeAdmin,
  getAgencyAnalytics,
  getMyAgencies,
  joinAgency,
  leaveAgency,
  updateAgencyVerification
};
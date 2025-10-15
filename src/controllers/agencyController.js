const Agency = require('../models/Agency');
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

// Create new agency
const createAgency = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      contactInfo,
      businessInfo,
      serviceAreas,
      settings
    } = req.body;

    // Check if user already has an agency
    const existingAgency = await Agency.findOne({ owner: req.user.id });
    if (existingAgency) {
      return res.status(400).json({
        success: false,
        message: 'User already owns an agency'
      });
    }

    // Check if email is already used
    const emailExists = await Agency.findOne({ 'contactInfo.email': contactInfo.email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered with another agency'
      });
    }

    const agency = new Agency({
      name,
      description,
      contactInfo,
      businessInfo,
      serviceAreas,
      settings,
      owner: req.user.id
    });

    await agency.save();

    // Update user role to agency_owner
    await User.findByIdAndUpdate(req.user.id, {
      role: 'agency_owner',
      'agency.agencyId': agency._id,
      'agency.role': 'owner'
    });

    res.status(201).json({
      success: true,
      message: 'Agency created successfully',
      data: agency
    });
  } catch (error) {
    console.error('Create agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all agencies
const getAgencies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      industry,
      status,
      location,
      search
    } = req.query;

    const query = {};

    if (industry) {
      query['businessInfo.industry'] = industry;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      const [lat, lng] = location.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        query['serviceAreas.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: 50000 // 50km radius
          }
        };
      }
    }

    const agencies = await Agency.find(query)
      .populate('owner', 'name email phone')
      .populate('providers.user', 'name email phone')
      .populate('admins.user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Agency.countDocuments(query);

    res.json({
      success: true,
      data: agencies,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get agencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single agency
const getAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('providers.user', 'name email phone avatar')
      .populate('admins.user', 'name email phone')
      .populate('verificationStatus.verifiedBy', 'name email');

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    res.json({
      success: true,
      data: agency
    });
  } catch (error) {
    console.error('Get agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update agency
const updateAgency = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if user has permission to update
    if (!agency.isUserAdmin(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this agency'
      });
    }

    const updateData = { ...req.body };
    delete updateData.owner; // Prevent changing owner
    delete updateData.status; // Prevent changing status directly

    const updatedAgency = await Agency.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone');

    res.json({
      success: true,
      message: 'Agency updated successfully',
      data: updatedAgency
    });
  } catch (error) {
    console.error('Update agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete agency
const deleteAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Only owner can delete agency
    if (agency.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only agency owner can delete the agency'
      });
    }

    // Update all providers to remove agency association
    const providerIds = agency.providers.map(p => p.user);
    await User.updateMany(
      { _id: { $in: providerIds } },
      { 
        $unset: { 'agency': 1 },
        role: 'provider'
      }
    );

    // Update all admins to remove agency association
    const adminIds = agency.admins.map(a => a.user);
    await User.updateMany(
      { _id: { $in: adminIds } },
      { 
        $unset: { 'agency': 1 },
        role: 'provider'
      }
    );

    // Update owner
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { 'agency': 1 },
      role: 'provider'
    });

    await Agency.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Agency deleted successfully'
    });
  } catch (error) {
    console.error('Delete agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Upload agency logo
const uploadLogo = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    if (!agency.isUserAdmin(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this agency'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'localpro/agencies/logos',
      transformation: [
        { width: 300, height: 300, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    // Delete old logo if exists
    if (agency.logo) {
      const publicId = agency.logo.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`localpro/agencies/logos/${publicId}`);
    }

    agency.logo = result.secure_url;
    await agency.save();

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logo: agency.logo
      }
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add provider to agency
const addProvider = async (req, res) => {
  try {
    const { userId, services, commissionRate } = req.body;

    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    if (!agency.hasPermission(req.user.id, 'manage_providers')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage providers'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.agency && user.agency.agencyId) {
      return res.status(400).json({
        success: false,
        message: 'User is already associated with an agency'
      });
    }

    await agency.addProvider(userId, services, commissionRate);

    // Update user
    await User.findByIdAndUpdate(userId, {
      'agency.agencyId': agency._id,
      'agency.role': 'provider',
      'agency.joinedAt': new Date()
    });

    res.json({
      success: true,
      message: 'Provider added successfully'
    });
  } catch (error) {
    console.error('Add provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Remove provider from agency
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

    if (!agency.hasPermission(req.user.id, 'manage_providers')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage providers'
      });
    }

    await agency.removeProvider(providerId);

    // Update user
    await User.findByIdAndUpdate(providerId, {
      $unset: { 'agency': 1 },
      role: 'provider'
    });

    res.json({
      success: true,
      message: 'Provider removed successfully'
    });
  } catch (error) {
    console.error('Remove provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update provider status
const updateProviderStatus = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { status } = req.body;

    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    if (!agency.hasPermission(req.user.id, 'manage_providers')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage providers'
      });
    }

    await agency.updateProviderStatus(providerId, status);

    res.json({
      success: true,
      message: 'Provider status updated successfully'
    });
  } catch (error) {
    console.error('Update provider status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add admin to agency
const addAdmin = async (req, res) => {
  try {
    const { userId, role, permissions } = req.body;

    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Only owner can add admins
    if (agency.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only agency owner can add admins'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await agency.addAdmin(userId, role, permissions);

    // Update user
    await User.findByIdAndUpdate(userId, {
      'agency.agencyId': agency._id,
      'agency.role': role
    });

    res.json({
      success: true,
      message: 'Admin added successfully'
    });
  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Remove admin from agency
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

    // Only owner can remove admins
    if (agency.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only agency owner can remove admins'
      });
    }

    await agency.removeAdmin(adminId);

    // Update user
    await User.findByIdAndUpdate(adminId, {
      $unset: { 'agency': 1 },
      role: 'provider'
    });

    res.json({
      success: true,
      message: 'Admin removed successfully'
    });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get agency analytics
const getAgencyAnalytics = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    if (!agency.hasPermission(req.user.id, 'view_analytics')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics'
      });
    }

    const { timeRange = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get booking analytics
    const bookings = await Booking.find({
      'provider.agencyId': agency._id,
      createdAt: { $gte: startDate }
    });

    const analytics = {
      overview: agency.analytics,
      timeRange: parseInt(timeRange),
      bookings: {
        total: bookings.length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        pending: bookings.filter(b => b.status === 'pending').length,
        revenue: bookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      },
      providers: {
        total: agency.providers.length,
        active: agency.providers.filter(p => p.status === 'active').length,
        pending: agency.providers.filter(p => p.status === 'pending').length,
        suspended: agency.providers.filter(p => p.status === 'suspended').length
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get agency analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get my agencies (for agency owners/admins)
const getMyAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find({
      $or: [
        { owner: req.user.id },
        { 'admins.user': req.user.id }
      ]
    })
      .populate('owner', 'name email phone')
      .populate('providers.user', 'name email phone')
      .populate('admins.user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: agencies
    });
  } catch (error) {
    console.error('Get my agencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Join agency (for providers)
const joinAgency = async (req, res) => {
  try {
    const { agencyId } = req.body;

    const agency = await Agency.findById(agencyId);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    if (agency.settings.requireApproval) {
      // Add as pending provider
      await agency.addProvider(req.user.id);
      
      res.json({
        success: true,
        message: 'Join request submitted. Waiting for approval.'
      });
    } else {
      // Auto-approve
      await agency.addProvider(req.user.id);
      await agency.updateProviderStatus(req.user.id, 'active');

      res.json({
        success: true,
        message: 'Successfully joined the agency'
      });
    }
  } catch (error) {
    console.error('Join agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Leave agency
const leaveAgency = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.agency || !user.agency.agencyId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any agency'
      });
    }

    const agency = await Agency.findById(user.agency.agencyId);
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Remove from agency
    await agency.removeProvider(req.user.id);

    // Update user
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { 'agency': 1 },
      role: 'provider'
    });

    res.json({
      success: true,
      message: 'Successfully left the agency'
    });
  } catch (error) {
    console.error('Leave agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createAgency,
  getAgencies,
  getAgency,
  updateAgency,
  deleteAgency,
  uploadLogo,
  addProvider,
  removeProvider,
  updateProviderStatus,
  addAdmin,
  removeAdmin,
  getAgencyAnalytics,
  getMyAgencies,
  joinAgency,
  leaveAgency
};

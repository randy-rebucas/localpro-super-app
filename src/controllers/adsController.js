const { AdCampaign: Ads } = require('../models/Ads');
const CloudinaryService = require('../services/cloudinaryService');

// @desc    Get all ads
// @route   GET /api/ads
// @access  Public
const getAds = async (req, res) => {
  try {
    const {
      search,
      category,
      location,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object - only show approved and active ads
    const filter = { 
      isActive: true,
      status: { $in: ['approved', 'active'] }
    };

    // Text search
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Location filter
    if (location) {
      filter['location.city'] = new RegExp(location, 'i');
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const ads = await Ads.find(filter)
      .populate('advertiser', 'firstName lastName profile.avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Ads.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: ads.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: ads
    });
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single ad
// @route   GET /api/ads/:id
// @access  Public
const getAd = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ad ID format'
      });
    }

    const ad = await Ads.findById(req.params.id)
      .populate('advertiser', 'firstName lastName profile.avatar profile.bio');

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Increment view count
    ad.views += 1;
    await ad.save();

    res.status(200).json({
      success: true,
      data: ad
    });
  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new ad
// @route   POST /api/ads
// @access  Private
const createAd = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      budget,
      schedule,
      targetAudience,
      content
    } = req.body;

    // Validate required fields
    if (!title || !description || !type || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, type, and category are required'
      });
    }

    // Validate budget
    if (!budget || !budget.total) {
      return res.status(400).json({
        success: false,
        message: 'Budget total is required'
      });
    }

    // Validate schedule
    if (!schedule || !schedule.startDate || !schedule.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Schedule start date and end date are required'
      });
    }

    // Validate enum values
    const validTypes = ['banner', 'sponsored_listing', 'video', 'text', 'interactive'];
    const validCategories = ['hardware_stores', 'suppliers', 'training_schools', 'services', 'products'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Validate dates
    const startDate = new Date(schedule.startDate);
    const endDate = new Date(schedule.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format for schedule dates'
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    const adData = {
      title,
      description,
      type,
      category,
      budget: {
        total: budget.total,
        daily: budget.daily || null,
        currency: budget.currency || 'USD'
      },
      schedule: {
        startDate: startDate,
        endDate: endDate,
        timeSlots: schedule.timeSlots || []
      },
      targetAudience: targetAudience || {},
      content: content || {},
      advertiser: req.user.id,
      status: 'pending' // Ads must be approved by admin before publishing
    };

    const ad = await Ads.create(adData);

    await ad.populate('advertiser', 'firstName lastName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Ad created successfully and is pending admin approval',
      data: ad
    });
  } catch (error) {
    console.error('Create ad error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update ad
// @route   PUT /api/ads/:id
// @access  Private
const updateAd = async (req, res) => {
  try {
    let ad = await Ads.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check if user is the advertiser
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ad'
      });
    }

    // Prevent users from manually changing status (only admins can approve/reject)
    if (req.body.status && !['pending', 'draft'].includes(req.body.status)) {
      delete req.body.status;
    }

    // If ad was rejected and user updates it, reset to pending for re-review
    if (ad.status === 'rejected' && (req.body.description || req.body.title || req.body.content)) {
      req.body.status = 'pending';
      req.body.approval = {
        reviewedBy: null,
        reviewedAt: null,
        notes: null,
        rejectionReason: null
      };
    }

    ad = await Ads.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Ad updated successfully',
      data: ad
    });
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete ad
// @route   DELETE /api/ads/:id
// @access  Private
const deleteAd = async (req, res) => {
  try {
    const ad = await Ads.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check if user is the advertiser
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this ad'
      });
    }

    // Soft delete
    ad.isActive = false;
    await ad.save();

    res.status(200).json({
      success: true,
      message: 'Ad deleted successfully'
    });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload ad images
// @route   POST /api/ads/:id/images
// @access  Private
const uploadAdImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const ad = await Ads.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check if user is the advertiser
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload images for this ad'
      });
    }

    const uploadPromises = req.files.map(file => 
      CloudinaryService.uploadFile(file, 'localpro/ads')
    );

    const uploadResults = await Promise.all(uploadPromises);

    const successfulUploads = uploadResults
      .filter(result => result.success)
      .map(result => ({
        url: result.data.secure_url,
        publicId: result.data.public_id
      }));

    if (successfulUploads.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload any images'
      });
    }

    // Add new images to ad
    ad.images = [...ad.images, ...successfulUploads];
    await ad.save();

    res.status(200).json({
      success: true,
      message: `${successfulUploads.length} image(s) uploaded successfully`,
      data: successfulUploads
    });
  } catch (error) {
    console.error('Upload ad images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete ad image
// @route   DELETE /api/ads/:id/images/:imageId
// @access  Private
const deleteAdImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const ad = await Ads.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check if user is the advertiser
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete images for this ad'
      });
    }

    const image = ad.images.id(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete from Cloudinary
    await CloudinaryService.deleteFile(image.publicId);

    // Remove from ad
    image.remove();
    await ad.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete ad image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's ads
// @route   GET /api/ads/my-ads
// @access  Private
const getMyAds = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const ads = await Ads.find({ advertiser: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Ads.countDocuments({ advertiser: req.user.id });

    res.status(200).json({
      success: true,
      count: ads.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: ads
    });
  } catch (error) {
    console.error('Get my ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get ad analytics
// @route   GET /api/ads/:id/analytics
// @access  Private
const getAdAnalytics = async (req, res) => {
  try {
    const ad = await Ads.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check if user is the advertiser
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics for this ad'
      });
    }

    const analytics = {
      views: ad.views,
      clicks: ad.clicks,
      impressions: ad.impressions,
      ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get ad analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Track ad click
// @route   POST /api/ads/:id/click
// @access  Public
const trackAdClick = async (req, res) => {
  try {
    const ad = await Ads.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Increment click count
    ad.clicks += 1;
    await ad.save();

    res.status(200).json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    console.error('Track ad click error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get ad categories
// @route   GET /api/ads/categories
// @access  Public
const getAdCategories = async (req, res) => {
  try {
    // Return valid categories with their usage count
    const validCategories = ['hardware_stores', 'suppliers', 'training_schools', 'services', 'products'];
    
    const categories = await Ads.aggregate([
      {
        $match: { 
          isActive: true,
          status: { $in: ['approved', 'active'] }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Ensure all valid categories are included with count 0 if not used
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat._id] = cat.count;
    });

    const allCategories = validCategories.map(category => ({
      _id: category,
      count: categoryMap[category] || 0
    }));

    res.status(200).json({
      success: true,
      data: allCategories
    });
  } catch (error) {
    console.error('Get ad categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get featured ads
// @route   GET /api/ads/featured
// @access  Public
const getFeaturedAds = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const ads = await Ads.find({
      isActive: true,
      isFeatured: true,
      status: { $in: ['approved', 'active'] }
    })
    .populate('advertiser', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads
    });
  } catch (error) {
    console.error('Get featured ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Promote ad
// @route   POST /api/ads/:id/promote
// @access  Private
const promoteAd = async (req, res) => {
  try {
    const { promotionType, duration, budget } = req.body;

    if (!promotionType || !duration || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Promotion type, duration, and budget are required'
      });
    }

    const ad = await Ads.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check if user is the advertiser
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to promote this ad'
      });
    }

    // Update ad with promotion details
    ad.promotion = {
      type: promotionType,
      duration,
      budget,
      startDate: new Date(),
      endDate: new Date(Date.now() + (duration * 24 * 60 * 60 * 1000)),
      status: 'active'
    };

    ad.isFeatured = true;
    await ad.save();

    res.status(200).json({
      success: true,
      message: 'Ad promoted successfully',
      data: ad.promotion
    });
  } catch (error) {
    console.error('Promote ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get valid enum values for ad creation
// @route   GET /api/ads/enum-values
// @access  Public
const getAdEnumValues = async (req, res) => {
  try {
    const enumValues = {
      types: ['banner', 'sponsored_listing', 'video', 'text', 'interactive'],
      categories: ['hardware_stores', 'suppliers', 'training_schools', 'services', 'products'],
      biddingStrategies: ['cpc', 'cpm', 'cpa', 'fixed'],
      statuses: ['draft', 'pending', 'approved', 'active', 'paused', 'completed', 'rejected']
    };

    res.status(200).json({
      success: true,
      data: enumValues
    });
  } catch (error) {
    console.error('Get ad enum values error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get ad statistics
// @route   GET /api/ads/statistics
// @access  Private (Admin only)
const getAdStatistics = async (req, res) => {
  try {
    // Get total ads
    const totalAds = await Ads.countDocuments();

    // Get ads by status
    const adsByStatus = await Ads.aggregate([
      {
        $group: {
          _id: '$isActive',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get ads by category
    const adsByCategory = await Ads.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get total views and clicks
    const totalViews = await Ads.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalClicks: { $sum: '$clicks' }
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await Ads.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAds,
        adsByStatus,
        adsByCategory,
        totalViews: totalViews[0] || { totalViews: 0, totalClicks: 0 },
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Get ad statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve ad (Admin only)
// @route   PUT /api/ads/:id/approve
// @access  Private (Admin only)
const approveAd = async (req, res) => {
  try {
    const ad = await Ads.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check if ad is already approved
    if (ad.status === 'approved' || ad.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Ad is already approved'
      });
    }

    // Update ad status and approval info
    ad.status = 'approved';
    ad.approval = {
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      notes: req.body.notes || null,
      rejectionReason: null
    };

    // If the ad's start date has passed or is current, set status to 'active'
    const now = new Date();
    if (ad.schedule.startDate <= now && ad.schedule.endDate >= now) {
      ad.status = 'active';
    }

    await ad.save();

    await ad.populate('advertiser', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Ad approved successfully',
      data: ad
    });
  } catch (error) {
    console.error('Approve ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reject ad (Admin only)
// @route   PUT /api/ads/:id/reject
// @access  Private (Admin only)
const rejectAd = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const ad = await Ads.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check if ad is already rejected
    if (ad.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Ad is already rejected'
      });
    }

    // Update ad status and approval info
    ad.status = 'rejected';
    ad.approval = {
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      notes: req.body.notes || null,
      rejectionReason: rejectionReason
    };

    await ad.save();

    await ad.populate('advertiser', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Ad rejected successfully',
      data: ad
    });
  } catch (error) {
    console.error('Reject ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get pending ads for admin review
// @route   GET /api/ads/pending
// @access  Private (Admin only)
const getPendingAds = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const ads = await Ads.find({ status: 'pending' })
      .populate('advertiser', 'firstName lastName email profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Ads.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      count: ads.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: ads
    });
  } catch (error) {
    console.error('Get pending ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getAds,
  getAd,
  createAd,
  updateAd,
  deleteAd,
  uploadAdImages,
  deleteAdImage,
  getMyAds,
  getAdAnalytics,
  trackAdClick,
  getAdCategories,
  getFeaturedAds,
  promoteAd,
  getAdStatistics,
  getAdEnumValues,
  approveAd,
  rejectAd,
  getPendingAds
};
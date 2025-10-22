const { AdCampaign: Ads } = require('../models/Ads');
const User = require('../models/User');
const CloudinaryService = require('../services/cloudinaryService');
const EmailService = require('../services/emailService');

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

    // Build filter object
    const filter = { isActive: true };

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
    const adData = {
      ...req.body,
      advertiser: req.user.id
    };

    const ad = await Ads.create(adData);

    await ad.populate('advertiser', 'firstName lastName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      data: ad
    });
  } catch (error) {
    console.error('Create ad error:', error);
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
    const categories = await Ads.aggregate([
      {
        $match: { isActive: true }
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

    res.status(200).json({
      success: true,
      data: categories
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
      isFeatured: true
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
  getAdStatistics
};
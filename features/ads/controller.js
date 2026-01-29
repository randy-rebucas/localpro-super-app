const { AdCampaign: Ads } = require('../../src/models/Ads');
const CloudinaryService = require('../../src/services/cloudinaryService');

// @desc    Get all ads
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
    const filter = { isActive: true, status: { $in: ['approved', 'active'] } };
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    if (category) filter.category = category;
    if (location) filter['location.city'] = new RegExp(location, 'i');
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single ad
const getAd = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid ad ID format' });
    }
    const ad = await Ads.findById(req.params.id)
      .populate('advertiser', 'firstName lastName profile.avatar profile.bio');
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    ad.views += 1;
    await ad.save();
    res.status(200).json({ success: true, data: ad });
  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create new ad
const createAd = async (req, res) => {
  try {
    const { title, description, type, category, budget, schedule, targetAudience, content } = req.body;
    if (!title || !description || !type || !category) {
      return res.status(400).json({ success: false, message: 'Title, description, type, and category are required' });
    }
    let budgetTotal;
    if (typeof budget === 'number') {
      budgetTotal = budget;
    } else if (budget && typeof budget === 'object' && budget.total) {
      budgetTotal = budget.total;
    } else {
      return res.status(400).json({ success: false, message: 'Budget total is required. Provide budget as a number or object with total property' });
    }
    if (!budgetTotal || budgetTotal <= 0) {
      return res.status(400).json({ success: false, message: 'Budget total must be a positive number' });
    }
    if (!schedule || !schedule.startDate || !schedule.endDate) {
      return res.status(400).json({ success: false, message: 'Schedule start date and end date are required' });
    }
    const validTypes = ['banner', 'sponsored_listing', 'video', 'text', 'interactive'];
    const validCategories = ['hardware_stores', 'suppliers', 'training_schools', 'services', 'products'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }
    const startDate = new Date(schedule.startDate);
    const endDate = new Date(schedule.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format for schedule dates' });
    }
    if (startDate >= endDate) {
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }
    const adData = {
      title,
      description,
      type,
      category,
      budget: {
        total: budgetTotal,
        daily: (typeof budget === 'object' ? budget.daily : null) || null,
        currency: (typeof budget === 'object' ? budget.currency : 'USD') || 'USD'
      },
      schedule: {
        startDate: startDate,
        endDate: endDate,
        timeSlots: schedule.timeSlots || []
      },
      targetAudience: targetAudience || {},
      content: content || {},
      advertiser: req.user.id,
      status: 'pending'
    };
    const ad = await Ads.create(adData);
    await ad.populate('advertiser', 'firstName lastName profile.avatar');
    res.status(201).json({ success: true, message: 'Ad created successfully and is pending admin approval', data: ad });
  } catch (error) {
    console.error('Create ad error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors: errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update ad
const updateAd = async (req, res) => {
  try {
    let ad = await Ads.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this ad' });
    }
    if (req.body.status && !['pending', 'draft'].includes(req.body.status)) {
      delete req.body.status;
    }
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
    res.status(200).json({ success: true, message: 'Ad updated successfully', data: ad });
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteAd = async (req, res) => {
  try {
    const ad = await Ads.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this ad' });
    }
    ad.isActive = false;
    await ad.save();
    res.status(200).json({ success: true, message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const uploadAdImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const ad = await Ads.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to upload images for this ad' });
    }
    const uploadPromises = req.files.map(file => CloudinaryService.uploadFile(file, 'localpro/ads'));
    const uploadResults = await Promise.all(uploadPromises);
    const successfulUploads = uploadResults.filter(result => result.success).map(result => ({ url: result.data.secure_url, publicId: result.data.public_id }));
    if (successfulUploads.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to upload any images' });
    }
    ad.images = [...ad.images, ...successfulUploads];
    await ad.save();
    res.status(200).json({ success: true, message: `${successfulUploads.length} image(s) uploaded successfully`, data: successfulUploads });
  } catch (error) {
    console.error('Upload ad images error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteAdImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const ad = await Ads.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete images for this ad' });
    }
    const image = ad.images.id(imageId);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    await CloudinaryService.deleteFile(image.publicId);
    image.remove();
    await ad.save();
    res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete ad image error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMyAds = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const ads = await Ads.find({ advertiser: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Ads.countDocuments({ advertiser: req.user.id });
    res.status(200).json({ success: true, count: ads.length, total, page: Number(page), pages: Math.ceil(total / limit), data: ads });
  } catch (error) {
    console.error('Get my ads error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdAnalytics = async (req, res) => {
  try {
    const ad = await Ads.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view analytics for this ad' });
    }
    const analytics = {
      views: ad.views,
      clicks: ad.clicks,
      impressions: ad.impressions,
      ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt
    };
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    console.error('Get ad analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const trackAdClick = async (req, res) => {
  try {
    const ad = await Ads.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    ad.clicks += 1;
    await ad.save();
    res.status(200).json({ success: true, message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Track ad click error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdCategories = async (req, res) => {
  try {
    const validCategories = ['hardware_stores', 'suppliers', 'training_schools', 'services', 'products'];
    const categories = await Ads.aggregate([
      { $match: { isActive: true, status: { $in: ['approved', 'active'] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('Get ad categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
};

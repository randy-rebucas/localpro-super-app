const { Advertiser, AdCampaign, AdImpression } = require('../models/Ads');

// @desc    Register as advertiser
// @route   POST /api/ads/advertisers/register
// @access  Private
const registerAdvertiser = async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      description,
      contact,
      documents
    } = req.body;

    // Check if user is already an advertiser
    const existingAdvertiser = await Advertiser.findOne({ user: req.user.id });
    if (existingAdvertiser) {
      return res.status(400).json({
        success: false,
        message: 'User is already registered as an advertiser'
      });
    }

    const advertiserData = {
      user: req.user.id,
      businessName,
      businessType,
      description,
      contact,
      verification: {
        documents: documents || []
      }
    };

    const advertiser = await Advertiser.create(advertiserData);

    res.status(201).json({
      success: true,
      message: 'Advertiser registration submitted successfully',
      data: advertiser
    });
  } catch (error) {
    console.error('Register advertiser error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create ad campaign
// @route   POST /api/ads/campaigns
// @access  Private (Advertiser)
const createCampaign = async (req, res) => {
  try {
    const advertiser = await Advertiser.findOne({ user: req.user.id });
    if (!advertiser) {
      return res.status(403).json({
        success: false,
        message: 'User is not registered as an advertiser'
      });
    }

    if (!advertiser.verification.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Advertiser account is not verified'
      });
    }

    const campaignData = {
      ...req.body,
      advertiser: advertiser._id
    };

    const campaign = await AdCampaign.create(campaignData);

    res.status(201).json({
      success: true,
      message: 'Ad campaign created successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get advertiser campaigns
// @route   GET /api/ads/campaigns
// @access  Private (Advertiser)
const getCampaigns = async (req, res) => {
  try {
    const { status } = req.query;
    const advertiser = await Advertiser.findOne({ user: req.user.id });

    if (!advertiser) {
      return res.status(403).json({
        success: false,
        message: 'User is not registered as an advertiser'
      });
    }

    const filter = { advertiser: advertiser._id };
    if (status) filter.status = status;

    const campaigns = await AdCampaign.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get active ads for display
// @route   GET /api/ads/active
// @access  Public
const getActiveAds = async (req, res) => {
  try {
    const { category, limit = 5 } = req.query;

    const filter = {
      status: 'active',
      'schedule.startDate': { $lte: new Date() },
      'schedule.endDate': { $gte: new Date() }
    };

    if (category) filter.category = category;

    const ads = await AdCampaign.find(filter)
      .populate('advertiser', 'businessName businessType')
      .sort({ 'performance.ctr': -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads
    });
  } catch (error) {
    console.error('Get active ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Record ad impression
// @route   POST /api/ads/impression
// @access  Public
const recordImpression = async (req, res) => {
  try {
    const {
      campaignId,
      type = 'impression',
      context,
      device,
      location
    } = req.body;

    const impressionData = {
      campaign: campaignId,
      user: req.user?.id,
      type,
      context,
      device,
      location,
      timestamp: new Date()
    };

    const impression = await AdImpression.create(impressionData);

    // Update campaign performance
    const campaign = await AdCampaign.findById(campaignId);
    if (campaign) {
      if (type === 'impression') {
        campaign.performance.impressions += 1;
      } else if (type === 'click') {
        campaign.performance.clicks += 1;
      } else if (type === 'conversion') {
        campaign.performance.conversions += 1;
      }

      // Calculate CTR
      if (campaign.performance.impressions > 0) {
        campaign.performance.ctr = (campaign.performance.clicks / campaign.performance.impressions) * 100;
      }

      await campaign.save();
    }

    res.status(201).json({
      success: true,
      message: 'Impression recorded successfully',
      data: impression
    });
  } catch (error) {
    console.error('Record impression error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get campaign analytics
// @route   GET /api/ads/campaigns/:id/analytics
// @access  Private (Advertiser)
const getCampaignAnalytics = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const advertiser = await Advertiser.findOne({ user: req.user.id });

    if (!advertiser) {
      return res.status(403).json({
        success: false,
        message: 'User is not registered as an advertiser'
      });
    }

    const campaign = await AdCampaign.findOne({
      _id: campaignId,
      advertiser: advertiser._id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Get detailed analytics
    const impressions = await AdImpression.find({ campaign: campaignId });
    
    const analytics = {
      campaign: campaign,
      impressions: impressions.length,
      clicks: impressions.filter(i => i.type === 'click').length,
      conversions: impressions.filter(i => i.type === 'conversion').length,
      ctr: campaign.performance.ctr,
      cpc: campaign.performance.cpc,
      cpm: campaign.performance.cpm,
      spend: campaign.performance.spend,
      dailyStats: impressions.reduce((acc, impression) => {
        const date = impression.timestamp.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { impressions: 0, clicks: 0, conversions: 0 };
        }
        acc[date][impression.type + 's'] += 1;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get campaign analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve campaign (Admin)
// @route   PUT /api/ads/campaigns/:id/approve
// @access  Private (Admin)
const approveCampaign = async (req, res) => {
  try {
    const { approved, notes, rejectionReason } = req.body;
    const campaignId = req.params.id;

    const campaign = await AdCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    campaign.status = approved ? 'approved' : 'rejected';
    campaign.approval = {
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      notes,
      rejectionReason: approved ? undefined : rejectionReason
    };

    await campaign.save();

    res.status(200).json({
      success: true,
      message: `Campaign ${approved ? 'approved' : 'rejected'} successfully`,
      data: campaign
    });
  } catch (error) {
    console.error('Approve campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  registerAdvertiser,
  createCampaign,
  getCampaigns,
  getActiveAds,
  recordImpression,
  getCampaignAnalytics,
  approveCampaign
};

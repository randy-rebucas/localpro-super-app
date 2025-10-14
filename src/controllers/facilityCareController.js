const { FacilityCareService, Contract, Subscription } = require('../models/FacilityCare');

// @desc    Get all facility care services
// @route   GET /api/facility-care/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const {
      category,
      location,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (location) filter.serviceArea = { $in: [new RegExp(location, 'i')] };
    if (minPrice || maxPrice) {
      filter['pricing.basePrice'] = {};
      if (minPrice) filter['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.basePrice'].$lte = Number(maxPrice);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const services = await FacilityCareService.find(filter)
      .populate('provider', 'firstName lastName profile.avatar profile.rating')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await FacilityCareService.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: services.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: services
    });
  } catch (error) {
    console.error('Get facility care services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single facility care service
// @route   GET /api/facility-care/services/:id
// @access  Public
const getService = async (req, res) => {
  try {
    const service = await FacilityCareService.findById(req.params.id)
      .populate('provider', 'firstName lastName profile.avatar profile.rating profile.experience');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get facility care service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create facility care service
// @route   POST /api/facility-care/services
// @access  Private (Provider)
const createService = async (req, res) => {
  try {
    const serviceData = {
      ...req.body,
      provider: req.user.id
    };

    const service = await FacilityCareService.create(serviceData);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Create facility care service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create contract
// @route   POST /api/facility-care/contracts
// @access  Private
const createContract = async (req, res) => {
  try {
    const {
      serviceId,
      facility,
      contractDetails,
      pricing,
      payment
    } = req.body;

    const service = await FacilityCareService.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const contractData = {
      client: req.user.id,
      provider: service.provider,
      service: serviceId,
      facility,
      contractDetails,
      pricing,
      payment
    };

    const contract = await Contract.create(contractData);

    // Populate contract details
    await contract.populate([
      { path: 'service', select: 'name category pricing' },
      { path: 'client', select: 'firstName lastName businessName' },
      { path: 'provider', select: 'firstName lastName businessName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      data: contract
    });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user contracts
// @route   GET /api/facility-care/contracts
// @access  Private
const getContracts = async (req, res) => {
  try {
    const { status, type = 'all' } = req.query;
    const userId = req.user.id;

    let filter = {};
    if (type === 'client') {
      filter.client = userId;
    } else if (type === 'provider') {
      filter.provider = userId;
    } else {
      filter.$or = [{ client: userId }, { provider: userId }];
    }

    if (status) filter.status = status;

    const contracts = await Contract.find(filter)
      .populate('service', 'name category pricing')
      .populate('client', 'firstName lastName businessName')
      .populate('provider', 'firstName lastName businessName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contracts.length,
      data: contracts
    });
  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create subscription
// @route   POST /api/facility-care/subscribe
// @access  Private
const createSubscription = async (req, res) => {
  try {
    const {
      serviceId,
      subscriptionType,
      plan,
      schedule,
      preferences
    } = req.body;

    const service = await FacilityCareService.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const subscriptionData = {
      client: req.user.id,
      service: serviceId,
      subscriptionType,
      plan,
      schedule,
      preferences
    };

    const subscription = await Subscription.create(subscriptionData);

    // Populate subscription details
    await subscription.populate([
      { path: 'service', select: 'name category pricing' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user subscriptions
// @route   GET /api/facility-care/subscriptions
// @access  Private
const getSubscriptions = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;

    const filter = { client: userId };
    if (status) filter.status = status;

    const subscriptions = await Subscription.find(filter)
      .populate('service', 'name category pricing')
      .populate('contract', 'contractDetails pricing')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update subscription status
// @route   PUT /api/facility-care/subscriptions/:id/status
// @access  Private
const updateSubscriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const subscriptionId = req.params.id;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check if user is the client
    if (subscription.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this subscription'
      });
    }

    subscription.status = status;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription status updated successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Update subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getServices,
  getService,
  createService,
  createContract,
  getContracts,
  createSubscription,
  getSubscriptions,
  updateSubscriptionStatus
};

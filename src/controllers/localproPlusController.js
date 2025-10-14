const { SubscriptionPlan, UserSubscription, Payment, FeatureUsage } = require('../models/LocalProPlus');

// @desc    Get all subscription plans
// @route   GET /api/localpro-plus/plans
// @access  Public
const getSubscriptionPlans = async (req, res) => {
  try {
    const { type, tier } = req.query;

    const filter = { isActive: true };
    if (type) filter.type = type;
    if (tier) filter.tier = tier;

    const plans = await SubscriptionPlan.find(filter).sort({ pricing: 1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single subscription plan
// @route   GET /api/localpro-plus/plans/:id
// @access  Public
const getSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Subscribe to plan
// @route   POST /api/localpro-plus/subscribe
// @access  Private
const subscribeToPlan = async (req, res) => {
  try {
    const { planId, billingCycle, paymentMethod, paymentDetails } = req.body;
    const userId = req.user.id;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await UserSubscription.findOne({
      user: userId,
      status: { $in: ['active', 'pending'] }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription'
      });
    }

    // Calculate pricing based on billing cycle
    const amount = billingCycle === 'yearly' ? plan.pricing.yearly : plan.pricing.monthly;
    const startDate = new Date();
    const endDate = new Date();
    
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscriptionData = {
      user: userId,
      plan: planId,
      status: 'pending',
      billing: {
        cycle: billingCycle,
        startDate,
        endDate,
        nextBillingDate: endDate,
        amount,
        currency: plan.pricing.currency
      },
      payment: {
        method: paymentMethod,
        details: paymentDetails,
        autoRenew: true
      }
    };

    const subscription = await UserSubscription.create(subscriptionData);

    // Create payment record
    const payment = await Payment.create({
      user: userId,
      subscription: subscription._id,
      amount,
      currency: plan.pricing.currency,
      type: 'subscription',
      status: 'pending',
      paymentMethod,
      description: `Subscription to ${plan.name} plan`
    });

    // Populate subscription details
    await subscription.populate('plan', 'name type tier features');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription,
        payment
      }
    });
  } catch (error) {
    console.error('Subscribe to plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user subscription
// @route   GET /api/localpro-plus/subscription
// @access  Private
const getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await UserSubscription.findOne({ user: userId })
      .populate('plan', 'name type tier features limits')
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel subscription
// @route   PUT /api/localpro-plus/subscription/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id;

    const subscription = await UserSubscription.findOne({
      user: userId,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    subscription.status = 'cancelled';
    subscription.cancellation = {
      requestedAt: new Date(),
      reason,
      effectiveDate: subscription.billing.endDate
    };

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user payments
// @route   GET /api/localpro-plus/payments
// @access  Private
const getUserPayments = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const filter = { user: userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;

    const payments = await Payment.find(filter)
      .populate('subscription', 'plan')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: payments
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Record feature usage
// @route   POST /api/localpro-plus/usage
// @access  Private
const recordFeatureUsage = async (req, res) => {
  try {
    const { feature, action, details } = req.body;
    const userId = req.user.id;

    const subscription = await UserSubscription.findOne({
      user: userId,
      status: 'active'
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const usageData = {
      user: userId,
      subscription: subscription._id,
      feature,
      action,
      details
    };

    const usage = await FeatureUsage.create(usageData);

    // Update subscription usage counters
    if (feature === 'marketplace' && action === 'create_listing') {
      subscription.usage.marketplaceListings += 1;
    } else if (feature === 'ads' && action === 'create_campaign') {
      subscription.usage.adCredits += 1;
    } else if (feature === 'api' && action === 'call') {
      subscription.usage.apiCalls += 1;
    }

    await subscription.save();

    res.status(201).json({
      success: true,
      message: 'Feature usage recorded successfully',
      data: usage
    });
  } catch (error) {
    console.error('Record feature usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get feature usage analytics
// @route   GET /api/localpro-plus/usage/analytics
// @access  Private
const getUsageAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const userId = req.user.id;

    const subscription = await UserSubscription.findOne({
      user: userId,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    startDate.setDate(startDate.getDate() - days);

    const usage = await FeatureUsage.find({
      user: userId,
      subscription: subscription._id,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: -1 });

    const analytics = {
      subscription: subscription,
      period,
      totalUsage: usage.length,
      featureBreakdown: usage.reduce((acc, usage) => {
        if (!acc[usage.feature]) {
          acc[usage.feature] = 0;
        }
        acc[usage.feature] += 1;
        return acc;
      }, {}),
      dailyUsage: usage.reduce((acc, usage) => {
        const date = usage.timestamp.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += 1;
        return acc;
      }, {}),
      recentUsage: usage.slice(0, 10)
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get usage analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getSubscriptionPlans,
  getSubscriptionPlan,
  subscribeToPlan,
  getUserSubscription,
  cancelSubscription,
  getUserPayments,
  recordFeatureUsage,
  getUsageAnalytics
};

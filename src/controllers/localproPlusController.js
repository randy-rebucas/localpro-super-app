const { SubscriptionPlan, UserSubscription, Payment } = require('../models/LocalProPlus');
const User = require('../models/User');
const PayPalService = require('../services/paypalService');
const PayMayaService = require('../services/paymayaService');
const EmailService = require('../services/emailService');

// @desc    Get all LocalPro Plus plans
// @route   GET /api/localpro-plus/plans
// @access  Public
const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ price: 1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single LocalPro Plus plan
// @route   GET /api/localpro-plus/plans/:id
// @access  Public
const getPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create LocalPro Plus plan
// @route   POST /api/localpro-plus/plans
// @access  Private (Admin only)
const createPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update LocalPro Plus plan
// @route   PUT /api/localpro-plus/plans/:id
// @access  Private (Admin only)
const updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete LocalPro Plus plan
// @route   DELETE /api/localpro-plus/plans/:id
// @access  Private (Admin only)
const deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Subscribe to LocalPro Plus plan
// @route   POST /api/localpro-plus/subscribe
// @access  Private
const subscribeToPlan = async (req, res) => {
  try {
    const { planId, paymentMethod, billingCycle = 'monthly' } = req.body;

    if (!planId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and payment method are required'
      });
    }

    const plan = await SubscriptionPlan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Plan is not available'
      });
    }

    // Check if user already has an active subscription
    const user = await User.findById(req.user.id).populate('localProPlusSubscription');
    if (user.localProPlusSubscription && user.localProPlusSubscription.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Calculate price based on billing cycle
    const price = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
    const currency = plan.price.currency || 'USD';

    let paymentResult;

    // Process payment based on method
    if (paymentMethod === 'paypal') {
      paymentResult = await PayPalService.createOrder({
        amount: price,
        currency: currency,
        description: `LocalPro Plus ${plan.name} subscription (${billingCycle})`,
        referenceId: `sub_${req.user.id}_${Date.now()}`
      });
    } else if (paymentMethod === 'paymaya') {
      paymentResult = await PayMayaService.createPayment({
        amount: price,
        currency: currency === 'USD' ? 'PHP' : currency,
        description: `LocalPro Plus ${plan.name} subscription (${billingCycle})`
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Payment processing failed',
        error: paymentResult.error
      });
    }

    // Create UserSubscription record
    const subscription = new UserSubscription({
      user: req.user.id,
      plan: planId,
      status: 'pending',
      billingCycle,
      paymentMethod,
      paymentDetails: {
        paypalOrderId: paymentResult.data?.id,
        paymayaCheckoutId: paymentResult.data?.checkoutId,
        lastPaymentId: paymentResult.data?.id,
        nextPaymentAmount: price
      },
      startDate: new Date(),
      endDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      nextBillingDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      usage: {
        services: { current: 0, limit: plan.limits.maxServices },
        bookings: { current: 0, limit: plan.limits.maxBookings },
        storage: { current: 0, limit: plan.limits.maxStorage },
        apiCalls: { current: 0, limit: plan.limits.maxApiCalls }
      },
      features: {
        prioritySupport: plan.features.some(f => f.name === 'priority_support'),
        advancedAnalytics: plan.features.some(f => f.name === 'advanced_analytics'),
        customBranding: plan.features.some(f => f.name === 'custom_branding'),
        apiAccess: plan.features.some(f => f.name === 'api_access'),
        whiteLabel: plan.features.some(f => f.name === 'white_label')
      }
    });

    await subscription.save();

    // Update user's subscription reference
    user.localProPlusSubscription = subscription._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription: await subscription.populate('plan'),
        paymentData: paymentResult.data
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

// @desc    Confirm subscription payment
// @route   POST /api/localpro-plus/confirm-payment
// @access  Private
const confirmSubscriptionPayment = async (req, res) => {
  try {
    const { paymentId, paymentMethod } = req.body;

    if (!paymentId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and payment method are required'
      });
    }

    const user = await User.findById(req.user.id).populate('localProPlusSubscription');
    const subscription = user.localProPlusSubscription;

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    if (subscription.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not pending'
      });
    }

    let paymentResult;

    // Confirm payment based on method
    if (paymentMethod === 'paypal') {
      paymentResult = await PayPalService.captureOrder(paymentId);
    } else if (paymentMethod === 'paymaya') {
      paymentResult = await PayMayaService.confirmPayment(paymentId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Payment confirmation failed',
        error: paymentResult.error
      });
    }

    // Update subscription status
    subscription.status = 'active';
    subscription.paymentDetails.lastPaymentId = paymentId;
    subscription.paymentDetails.lastPaymentDate = new Date();
    await subscription.save();

    // Create payment record
    const payment = new Payment({
      user: req.user.id,
      subscription: subscription._id,
      amount: subscription.paymentDetails.nextPaymentAmount,
      currency: subscription.plan.price?.currency || 'USD',
      status: 'completed',
      paymentMethod,
      paymentDetails: {
        paypalOrderId: paymentId,
        paymayaPaymentId: paymentId,
        transactionId: paymentResult.data?.id
      },
      description: `LocalPro Plus subscription payment`,
      processedAt: new Date()
    });

    await payment.save();

    // Send confirmation email
    const populatedSubscription = await subscription.populate('plan');
    if (populatedSubscription.plan) {
      await EmailService.sendEmail({
        to: user.email,
        subject: 'LocalPro Plus Subscription Confirmed',
        template: 'subscription-confirmation',
        data: {
          userName: `${user.firstName} ${user.lastName}`,
          planName: populatedSubscription.plan.name,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription payment confirmed successfully',
      data: populatedSubscription
    });
  } catch (error) {
    console.error('Confirm subscription payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel subscription
// @route   POST /api/localpro-plus/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findById(req.user.id).populate('localProPlusSubscription');
    const subscription = user.localProPlusSubscription;

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not active'
      });
    }

    // Cancel subscription using model method
    await subscription.cancel(reason);

    // Send cancellation email
    await EmailService.sendEmail({
      to: user.email,
      subject: 'LocalPro Plus Subscription Cancelled',
      template: 'subscription-cancellation',
      data: {
        userName: `${user.firstName} ${user.lastName}`,
        reason,
        endDate: subscription.endDate
      }
    });

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

// @desc    Get user's subscription
// @route   GET /api/localpro-plus/my-subscription
// @access  Private
const getMySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('localProPlusSubscription');
    const subscription = user.localProPlusSubscription;

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    const populatedSubscription = await subscription.populate('plan');

    res.status(200).json({
      success: true,
      data: populatedSubscription
    });
  } catch (error) {
    console.error('Get my subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update subscription settings
// @route   PUT /api/localpro-plus/subscription/settings
// @access  Private
const updateSubscriptionSettings = async (req, res) => {
  try {
    const { autoRenew, notificationSettings } = req.body;

    const user = await User.findById(req.user.id).populate('localProPlusSubscription');
    const subscription = user.localProPlusSubscription;

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    // Update settings
    if (autoRenew !== undefined) {
      subscription.autoRenew = autoRenew;
    }
    if (notificationSettings) {
      subscription.notificationSettings = notificationSettings;
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription settings updated successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Update subscription settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get subscription usage
// @route   GET /api/localpro-plus/usage
// @access  Private
const getSubscriptionUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('localProPlusSubscription');
    const subscription = user.localProPlusSubscription;

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    const populatedSubscription = await subscription.populate('plan');
    const plan = populatedSubscription.plan;
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found or subscription is invalid'
      });
    }

    const usage = {
      plan: {
        name: plan.name,
        features: plan.features
      },
      currentUsage: {
        services: subscription.usage.services.current,
        bookings: subscription.usage.bookings.current,
        storage: subscription.usage.storage.current,
        apiCalls: subscription.usage.apiCalls.current
      },
      limits: {
        maxServices: subscription.usage.services.limit || 'unlimited',
        maxBookings: subscription.usage.bookings.limit || 'unlimited',
        maxStorage: subscription.usage.storage.limit || 'unlimited',
        maxApiCalls: subscription.usage.apiCalls.limit || 'unlimited'
      },
      features: subscription.features,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      nextBillingDate: subscription.nextBillingDate,
      daysUntilRenewal: subscription.daysUntilRenewal
    };

    res.status(200).json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error('Get subscription usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Renew subscription
// @route   POST /api/localpro-plus/renew
// @access  Private
const renewSubscription = async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    const user = await User.findById(req.user.id).populate('localProPlusSubscription');
    const subscription = user.localProPlusSubscription;

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not active'
      });
    }

    const populatedSubscription = await subscription.populate('plan');
    const plan = populatedSubscription.plan;

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found or subscription is invalid'
      });
    }

    // Calculate renewal price
    const price = subscription.billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
    const currency = plan.price.currency || 'USD';

    let paymentResult;

    // Process payment based on method
    if (paymentMethod === 'paypal') {
      paymentResult = await PayPalService.createOrder({
        amount: price,
        currency: currency,
        description: `LocalPro Plus ${plan.name} subscription renewal (${subscription.billingCycle})`
      });
    } else if (paymentMethod === 'paymaya') {
      paymentResult = await PayMayaService.createPayment({
        amount: price,
        currency: currency === 'USD' ? 'PHP' : currency,
        description: `LocalPro Plus ${plan.name} subscription renewal (${subscription.billingCycle})`
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Payment processing failed',
        error: paymentResult.error
      });
    }

    // Renew subscription using model method
    await subscription.renew();

    // Create payment record
    const payment = new Payment({
      user: req.user.id,
      subscription: subscription._id,
      amount: price,
      currency,
      status: 'completed',
      paymentMethod,
      paymentDetails: {
        paypalOrderId: paymentResult.data?.id,
        paymayaCheckoutId: paymentResult.data?.checkoutId,
        transactionId: paymentResult.data?.id
      },
      description: `LocalPro Plus subscription renewal`,
      processedAt: new Date()
    });

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Subscription renewed successfully',
      data: {
        subscription: populatedSubscription,
        paymentData: paymentResult.data
      }
    });
  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get subscription analytics
// @route   GET /api/localpro-plus/analytics
// @access  Private (Admin only)
const getSubscriptionAnalytics = async (req, res) => {
  try {
    // Get subscription statistics
    const totalSubscriptions = await UserSubscription.countDocuments({
      status: { $in: ['active', 'pending', 'cancelled', 'expired'] }
    });

    const activeSubscriptions = await UserSubscription.countDocuments({
      status: 'active'
    });

    const cancelledSubscriptions = await UserSubscription.countDocuments({
      status: 'cancelled'
    });

    const pendingSubscriptions = await UserSubscription.countDocuments({
      status: 'pending'
    });

    // Get subscription by plan
    const subscriptionsByPlan = await UserSubscription.aggregate([
      {
        $match: {
          status: { $in: ['active', 'pending', 'cancelled', 'expired'] }
        }
      },
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: '_id',
          foreignField: '_id',
          as: 'plan'
        }
      },
      {
        $unwind: '$plan'
      },
      {
        $project: {
          planName: '$plan.name',
          count: 1
        }
      }
    ]);

    // Get monthly subscription trends
    const monthlyTrends = await UserSubscription.aggregate([
      {
        $match: {
          createdAt: { $exists: true }
        }
      },
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

    // Get revenue analytics
    const revenueAnalytics = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          subscription: { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get subscription status distribution
    const statusDistribution = await UserSubscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        cancelledSubscriptions,
        pendingSubscriptions,
        subscriptionsByPlan,
        monthlyTrends,
        revenueAnalytics,
        statusDistribution
      }
    });
  } catch (error) {
    console.error('Get subscription analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  subscribeToPlan,
  confirmSubscriptionPayment,
  cancelSubscription,
  getMySubscription,
  updateSubscriptionSettings,
  getSubscriptionUsage,
  renewSubscription,
  getSubscriptionAnalytics
};
const LocalProPlus = require('../models/LocalProPlus');
const User = require('../models/User');
const PayPalService = require('../services/paypalService');
const PayMayaService = require('../services/paymayaService');
const EmailService = require('../services/emailService');

// @desc    Get all LocalPro Plus plans
// @route   GET /api/localpro-plus/plans
// @access  Public
const getPlans = async (req, res) => {
  try {
    const plans = await LocalProPlus.find({ isActive: true })
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
    const plan = await LocalProPlus.findById(req.params.id);

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
    const plan = await LocalProPlus.create(req.body);

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
    const plan = await LocalProPlus.findByIdAndUpdate(
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
    const plan = await LocalProPlus.findByIdAndDelete(req.params.id);

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
    const { planId, paymentMethod, paymentDetails } = req.body;

    if (!planId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and payment method are required'
      });
    }

    const plan = await LocalProPlus.findById(planId);

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
    const user = await User.findById(req.user.id);
    if (user.subscription && user.subscription.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    let paymentResult;

    // Process payment based on method
    if (paymentMethod === 'paypal') {
      paymentResult = await PayPalService.createOrder({
        amount: plan.price,
        currency: 'USD',
        description: `LocalPro Plus ${plan.name} subscription`
      });
    } else if (paymentMethod === 'paymaya') {
      paymentResult = await PayMayaService.createPayment({
        amount: plan.price,
        currency: 'PHP',
        description: `LocalPro Plus ${plan.name} subscription`
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

    // Create subscription record
    const subscription = {
      plan: planId,
      status: 'pending',
      paymentMethod,
      paymentDetails: paymentResult.data,
      startDate: new Date(),
      endDate: new Date(Date.now() + (plan.billingCycle * 24 * 60 * 60 * 1000)),
      autoRenew: true
    };

    user.subscription = subscription;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription,
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

    const user = await User.findById(req.user.id);

    if (!user.subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    if (user.subscription.status !== 'pending') {
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
    user.subscription.status = 'active';
    user.subscription.paymentConfirmed = true;
    user.subscription.paymentConfirmedAt = new Date();
    await user.save();

    // Send confirmation email
    await EmailService.sendEmail({
      to: user.email,
      subject: 'LocalPro Plus Subscription Confirmed',
      template: 'subscription-confirmation',
      data: {
        userName: `${user.firstName} ${user.lastName}`,
        planName: user.subscription.plan.name,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate
      }
    });

    res.status(200).json({
      success: true,
      message: 'Subscription payment confirmed successfully',
      data: user.subscription
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

    const user = await User.findById(req.user.id);

    if (!user.subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    if (user.subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not active'
      });
    }

    // Update subscription status
    user.subscription.status = 'cancelled';
    user.subscription.cancelledAt = new Date();
    user.subscription.cancellationReason = reason;
    user.subscription.autoRenew = false;
    await user.save();

    // Send cancellation email
    await EmailService.sendEmail({
      to: user.email,
      subject: 'LocalPro Plus Subscription Cancelled',
      template: 'subscription-cancellation',
      data: {
        userName: `${user.firstName} ${user.lastName}`,
        reason,
        endDate: user.subscription.endDate
      }
    });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: user.subscription
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
    const user = await User.findById(req.user.id)
      .populate('subscription.plan');

    if (!user.subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.subscription
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

    const user = await User.findById(req.user.id);

    if (!user.subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    // Update settings
    if (autoRenew !== undefined) user.subscription.autoRenew = autoRenew;
    if (notificationSettings) user.subscription.notificationSettings = notificationSettings;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Subscription settings updated successfully',
      data: user.subscription
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
    const user = await User.findById(req.user.id)
      .populate('subscription.plan');

    if (!user.subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    const plan = user.subscription.plan;
    const usage = {
      plan: {
        name: plan.name,
        features: plan.features
      },
      currentUsage: {
        // This would be calculated based on actual usage
        // For now, returning placeholder data
        servicesPosted: 0,
        jobsApplied: 0,
        messagesSent: 0,
        storageUsed: 0
      },
      limits: {
        maxServices: plan.features.maxServices || 'unlimited',
        maxJobApplications: plan.features.maxJobApplications || 'unlimited',
        maxMessages: plan.features.maxMessages || 'unlimited',
        maxStorage: plan.features.maxStorage || 'unlimited'
      }
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
    const { paymentMethod, paymentDetails } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    const user = await User.findById(req.user.id)
      .populate('subscription.plan');

    if (!user.subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    if (user.subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not active'
      });
    }

    const plan = user.subscription.plan;

    let paymentResult;

    // Process payment based on method
    if (paymentMethod === 'paypal') {
      paymentResult = await PayPalService.createOrder({
        amount: plan.price,
        currency: 'USD',
        description: `LocalPro Plus ${plan.name} subscription renewal`
      });
    } else if (paymentMethod === 'paymaya') {
      paymentResult = await PayMayaService.createPayment({
        amount: plan.price,
        currency: 'PHP',
        description: `LocalPro Plus ${plan.name} subscription renewal`
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

    // Update subscription end date
    user.subscription.endDate = new Date(user.subscription.endDate.getTime() + (plan.billingCycle * 24 * 60 * 60 * 1000));
    user.subscription.lastRenewal = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Subscription renewed successfully',
      data: {
        subscription: user.subscription,
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
    const totalSubscriptions = await User.countDocuments({
      'subscription.status': { $in: ['active', 'pending', 'cancelled'] }
    });

    const activeSubscriptions = await User.countDocuments({
      'subscription.status': 'active'
    });

    const cancelledSubscriptions = await User.countDocuments({
      'subscription.status': 'cancelled'
    });

    // Get subscription by plan
    const subscriptionsByPlan = await User.aggregate([
      {
        $match: {
          'subscription.status': { $in: ['active', 'pending', 'cancelled'] }
        }
      },
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'localpropluses',
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
    const monthlyTrends = await User.aggregate([
      {
        $match: {
          'subscription.createdAt': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$subscription.createdAt' },
            month: { $month: '$subscription.createdAt' }
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
        totalSubscriptions,
        activeSubscriptions,
        cancelledSubscriptions,
        subscriptionsByPlan,
        monthlyTrends
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
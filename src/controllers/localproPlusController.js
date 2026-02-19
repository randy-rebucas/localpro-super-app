const { SubscriptionPlan, UserSubscription, Payment } = require('../models/LocalProPlus');
const User = require('../models/User');
const PayPalService = require('../services/paypalService');
const PaymongoService = require('../services/paymongoService');
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
// @route   POST /api/localpro-plus/subscribe/:planId
// @access  Private
const subscribeToPlan = async (req, res) => {
  try {
    const planId = req.params.planId;
    console.log('Subscribe to plan request:', { userId: req.user.id, planId, body: req.body });
    const { paymentMethod, billingCycle = 'monthly' } = req.body;

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
    } else if (paymentMethod === 'paymongo') {
      if (!process.env.PAYMONGO_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message: 'Payment gateway not configured'
        });
      }

      // PayMongo uses a hosted checkout session — redirect the user to PayMongo's page.
      // Subscription is activated asynchronously via POST /webhooks/paymongo.
      const amountInCentavos = Math.round((billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly) * 100);
      const sessionResult = await PaymongoService.createCheckoutSession({
        amount: amountInCentavos,
        currency: 'PHP',
        name: `LocalPro Plus ${plan.name} – ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`,
        userId: req.user.id,
        planId,
        billingCycle
      });

      if (!sessionResult.success) {
        return res.status(502).json({
          success: false,
          message: sessionResult.message || 'Failed to create checkout session'
        });
      }

      if (!sessionResult.checkoutUrl) {
        return res.status(502).json({
          success: false,
          message: 'PayMongo returned no checkout URL'
        });
      }

      // Create a pending subscription record so the webhook can find it by userId/planId
      const pendingSub = new UserSubscription({
        user: req.user.id,
        plan: planId,
        status: 'pending',
        billingCycle,
        paymentMethod: 'paymongo',
        paymentDetails: {
          paymongoSessionId: sessionResult.sessionId,
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

      await pendingSub.save();
      user.localProPlusSubscription = pendingSub._id;
      await user.save();

      // Return the checkout URL — activation happens async via webhook
      return res.status(200).json({
        checkoutUrl: sessionResult.checkoutUrl
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

    // Create UserSubscription record (PayPal path)
    const subscription = new UserSubscription({
      user: req.user.id,
      plan: planId,
      status: 'pending',
      billingCycle,
      paymentMethod,
      paymentDetails: {
        paypalOrderId: paymentResult.data?.id,
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
    const { paymentId, paymentMethod, sessionId } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'paymentMethod is required'
      });
    }

    // PayMongo: webhook activates the subscription asynchronously.
    // The frontend polls this endpoint with { paymentMethod: 'paymongo', sessionId }.
    // Re-fetch from DB using the sessionId so we always see the latest state.
    if (paymentMethod === 'paymongo') {
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'sessionId is required for paymongo'
        });
      }

      // Query specifically by sessionId — avoids matching a different subscription
      // belonging to the same user if they had multiple attempts.
      const freshSub = await UserSubscription.findOne({
        user: req.user.id,
        'paymentDetails.paymongoSessionId': sessionId
      }).populate('plan');

      if (!freshSub) {
        // Not found yet — webhook hasn't fired, keep polling
        return res.status(200).json({ activated: false, plan: null });
      }

      if (freshSub.status !== 'active') {
        return res.status(200).json({ activated: false, plan: null });
      }

      // Subscription is active — create Payment record exactly once (idempotent check)
      const existingPayment = await Payment.findOne({
        subscription: freshSub._id,
        status: 'completed',
        paymentMethod: 'paymongo'
      });

      if (!existingPayment) {
        const paymentRecord = new Payment({
          user: req.user.id,
          subscription: freshSub._id,
          amount: freshSub.paymentDetails.nextPaymentAmount || 0,
          currency: freshSub.plan?.price?.currency || 'PHP',
          status: 'completed',
          paymentMethod: 'paymongo',
          paymentDetails: {
            paymongoIntentId: sessionId,
            transactionId: sessionId
          },
          description: 'LocalPro Plus subscription payment via PayMongo',
          processedAt: freshSub.paymentDetails.lastPaymentDate || new Date()
        });
        await paymentRecord.save();

        // Ensure user.localProPlusSubscription points to this subscription
        const userDoc = await User.findById(req.user.id);
        if (userDoc && String(userDoc.localProPlusSubscription) !== String(freshSub._id)) {
          userDoc.localProPlusSubscription = freshSub._id;
          await userDoc.save();
        }

        // Send confirmation email — only once, on first Payment creation
        try {
          const userForEmail = userDoc || await User.findById(req.user.id);
          if (freshSub.plan) {
            await EmailService.sendEmail({
              to: userForEmail.email,
              subject: 'LocalPro Plus Subscription Confirmed',
              template: 'subscription-confirmation',
              data: {
                userName: `${userForEmail.firstName} ${userForEmail.lastName}`,
                planName: freshSub.plan.name,
                startDate: freshSub.startDate,
                endDate: freshSub.endDate
              }
            });
          }
        } catch (emailErr) {
          console.error('PayMongo confirm: failed to send confirmation email:', emailErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        activated: true,
        message: 'Subscription payment confirmed successfully',
        plan: freshSub.plan
          ? { id: freshSub.plan._id, name: freshSub.plan.name }
          : null,
        data: freshSub
      });
    }

    // Non-PayMongo paths require paymentId
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'paymentId is required'
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
    } else if (paymentMethod === 'paymongo') {
      if (!process.env.PAYMONGO_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message: 'Payment gateway not configured'
        });
      }

      const amountInCentavos = Math.round(price * 100);
      const sessionResult = await PaymongoService.createCheckoutSession({
        amount: amountInCentavos,
        currency: 'PHP',
        name: `LocalPro Plus ${plan.name} – ${subscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} Renewal`,
        userId: req.user.id,
        planId: subscription.plan._id || subscription.plan,
        billingCycle: subscription.billingCycle
      });

      if (!sessionResult.success) {
        return res.status(502).json({
          success: false,
          message: sessionResult.message || 'Failed to create checkout session'
        });
      }

      return res.status(200).json({
        checkoutUrl: sessionResult.checkoutUrl
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

// @desc    Create manual subscription (Admin only)
// @route   POST /api/localpro-plus/admin/subscriptions
// @access  Private (Admin only)
const createManualSubscription = async (req, res) => {
  try {
    const { userId, planId, billingCycle = 'monthly', startDate, endDate, reason, notes } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Plan ID are required'
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate plan exists
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await UserSubscription.findOne({
      user: userId,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription',
        data: {
          existingSubscriptionId: existingSubscription._id
        }
      });
    }

    // Calculate dates
    const subscriptionStartDate = startDate ? new Date(startDate) : new Date();
    const billingDays = billingCycle === 'yearly' ? 365 : 30;
    const subscriptionEndDate = endDate 
      ? new Date(endDate) 
      : new Date(subscriptionStartDate.getTime() + billingDays * 24 * 60 * 60 * 1000);

    // Create manual subscription
    const subscription = new UserSubscription({
      user: userId,
      plan: planId,
      status: 'active',
      billingCycle,
      paymentMethod: 'manual',
      isManual: true,
      manualDetails: {
        createdBy: req.user.id,
        reason: reason || 'Admin manual subscription',
        notes: notes || undefined
      },
      startDate: subscriptionStartDate,
      endDate: subscriptionEndDate,
      nextBillingDate: subscriptionEndDate,
      usage: {
        services: { current: 0, limit: plan.limits.maxServices },
        bookings: { current: 0, limit: plan.limits.maxBookings },
        storage: { current: 0, limit: plan.limits.maxStorage },
        apiCalls: { current: 0, limit: plan.limits.maxApiCalls }
      },
      features: {
        prioritySupport: plan.features.some(f => f.name === 'priority_support' && f.included),
        advancedAnalytics: plan.features.some(f => f.name === 'advanced_analytics' && f.included),
        customBranding: plan.features.some(f => f.name === 'custom_branding' && f.included),
        apiAccess: plan.features.some(f => f.name === 'api_access' && f.included),
        whiteLabel: plan.features.some(f => f.name === 'white_label' && f.included)
      },
      history: [{
        action: 'subscribed',
        toPlan: plan.name,
        timestamp: new Date(),
        reason: reason || 'Admin manual subscription'
      }]
    });

    await subscription.save();

    // Update user's subscription reference
    user.localProPlusSubscription = subscription._id;
    await user.save();

    // Send notification email to user
    await EmailService.sendEmail({
      to: user.email,
      subject: 'LocalPro Plus Subscription Activated',
      template: 'subscription-activated',
      data: {
        userName: `${user.firstName} ${user.lastName}`,
        planName: plan.name,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        billingCycle
      }
    });

    const populatedSubscription = await subscription.populate('plan user');

    res.status(201).json({
      success: true,
      message: 'Manual subscription created successfully',
      data: populatedSubscription
    });
  } catch (error) {
    console.error('Create manual subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all subscriptions (Admin only)
// @route   GET /api/localpro-plus/admin/subscriptions
// @access  Private (Admin only)
const getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, planId, isManual } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (planId) filter.plan = planId;
    if (isManual !== undefined) filter.isManual = isManual === 'true';

    const subscriptions = await UserSubscription.find(filter)
      .populate('user', 'firstName lastName email phoneNumber')
      .populate('plan', 'name description price')
      .populate('manualDetails.createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await UserSubscription.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: subscriptions
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get subscription by user ID (Admin only)
// @route   GET /api/localpro-plus/admin/subscriptions/user/:userId
// @access  Private (Admin only)
const getSubscriptionByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await UserSubscription.findOne({ user: userId })
      .populate('user', 'firstName lastName email phoneNumber')
      .populate('plan', 'name description price features limits benefits')
      .populate('manualDetails.createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found for this user'
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get subscription by user ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update manual subscription (Admin only)
// @route   PUT /api/localpro-plus/admin/subscriptions/:subscriptionId
// @access  Private (Admin only)
const updateManualSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { planId, status, startDate, endDate, billingCycle, reason, notes } = req.body;

    const subscription = await UserSubscription.findById(subscriptionId)
      .populate('plan');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Only allow updates to manual subscriptions
    if (!subscription.isManual) {
      return res.status(400).json({
        success: false,
        message: 'Only manual subscriptions can be updated by admin'
      });
    }

    const oldPlanName = subscription.plan.name;
    let newPlan = subscription.plan;

    // Update plan if provided
    if (planId && planId.toString() !== subscription.plan._id.toString()) {
      newPlan = await SubscriptionPlan.findById(planId);
      if (!newPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found'
        });
      }
      subscription.plan = planId;
      
      // Update usage limits based on new plan
      subscription.usage = {
        services: { 
          current: Math.min(subscription.usage.services.current, newPlan.limits.maxServices || 0),
          limit: newPlan.limits.maxServices 
        },
        bookings: { 
          current: Math.min(subscription.usage.bookings.current, newPlan.limits.maxBookings || 0),
          limit: newPlan.limits.maxBookings 
        },
        storage: { 
          current: Math.min(subscription.usage.storage.current, newPlan.limits.maxStorage || 0),
          limit: newPlan.limits.maxStorage 
        },
        apiCalls: { 
          current: Math.min(subscription.usage.apiCalls.current, newPlan.limits.maxApiCalls || 0),
          limit: newPlan.limits.maxApiCalls 
        }
      };

      // Update features
      subscription.features = {
        prioritySupport: newPlan.features.some(f => f.name === 'priority_support' && f.included),
        advancedAnalytics: newPlan.features.some(f => f.name === 'advanced_analytics' && f.included),
        customBranding: newPlan.features.some(f => f.name === 'custom_branding' && f.included),
        apiAccess: newPlan.features.some(f => f.name === 'api_access' && f.included),
        whiteLabel: newPlan.features.some(f => f.name === 'white_label' && f.included)
      };

      // Determine if upgrade or downgrade based on price
      const oldPrice = subscription.billingCycle === 'yearly' 
        ? subscription.plan.price.yearly 
        : subscription.plan.price.monthly;
      const newPrice = subscription.billingCycle === 'yearly'
        ? newPlan.price.yearly
        : newPlan.price.monthly;
      
      subscription.history.push({
        action: newPrice > oldPrice ? 'upgraded' : 'downgraded',
        fromPlan: oldPlanName,
        toPlan: newPlan.name,
        timestamp: new Date(),
        reason: reason || 'Admin plan change'
      });
    }

    // Update status
    if (status && status !== subscription.status) {
      const oldStatus = subscription.status;
      subscription.status = status;
      
      if (status === 'cancelled' || status === 'suspended') {
        subscription.cancelledAt = new Date();
        subscription.cancellationReason = reason || 'Admin action';
      } else if (status === 'active' && oldStatus === 'suspended') {
        subscription.history.push({
          action: 'reactivated',
          timestamp: new Date(),
          reason: reason || 'Admin reactivation'
        });
      }
    }

    // Update dates
    if (startDate) subscription.startDate = new Date(startDate);
    if (endDate) subscription.endDate = new Date(endDate);
    if (billingCycle) subscription.billingCycle = billingCycle;
    if (endDate) subscription.nextBillingDate = new Date(endDate);

    // Update manual details
    if (notes) subscription.manualDetails.notes = notes;

    await subscription.save();

    const populatedSubscription = await subscription.populate('user plan');

    // Send notification email to user
    const user = await User.findById(subscription.user);
    await EmailService.sendEmail({
      to: user.email,
      subject: 'LocalPro Plus Subscription Updated',
      template: 'subscription-updated',
      data: {
        userName: `${user.firstName} ${user.lastName}`,
        planName: newPlan.name,
        status: subscription.status,
        endDate: subscription.endDate
      }
    });

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: populatedSubscription
    });
  } catch (error) {
    console.error('Update manual subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete/Cancel manual subscription (Admin only)
// @route   DELETE /api/localpro-plus/admin/subscriptions/:subscriptionId
// @access  Private (Admin only)
const deleteManualSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;

    const subscription = await UserSubscription.findById(subscriptionId)
      .populate('user plan');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Only allow deletion of manual subscriptions
    if (!subscription.isManual) {
      return res.status(400).json({
        success: false,
        message: 'Only manual subscriptions can be deleted by admin. Use cancel endpoint for regular subscriptions.'
      });
    }

    // Cancel subscription
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason || 'Admin deletion';
    
    subscription.history.push({
      action: 'cancelled',
      reason: reason || 'Admin deletion',
      timestamp: new Date()
    });

    await subscription.save();

    // Remove subscription reference from user
    const user = await User.findById(subscription.user);
    if (user && user.localProPlusSubscription?.toString() === subscriptionId) {
      user.localProPlusSubscription = undefined;
      await user.save();
    }

    // Send notification email to user
    await EmailService.sendEmail({
      to: user.email,
      subject: 'LocalPro Plus Subscription Cancelled',
      template: 'subscription-cancelled',
      data: {
        userName: `${user.firstName} ${user.lastName}`,
        planName: subscription.plan.name,
        reason: reason || 'Admin cancellation'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Delete manual subscription error:', error);
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
  getSubscriptionAnalytics,
  createManualSubscription,
  getAllSubscriptions,
  getSubscriptionByUserId,
  updateManualSubscription,
  deleteManualSubscription
};
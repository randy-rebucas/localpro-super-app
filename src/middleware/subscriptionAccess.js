const User = require('../models/User');

/**
 * Middleware to check if user has active LocalPro Plus subscription
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('localProPlusSubscription');
    
    if (!user.localProPlusSubscription) {
      return res.status(403).json({
        success: false,
        message: 'LocalPro Plus subscription required',
        error: 'SUBSCRIPTION_REQUIRED'
      });
    }

    const subscription = user.localProPlusSubscription;
    
    if (!subscription.isActive()) {
      return res.status(403).json({
        success: false,
        message: 'Active LocalPro Plus subscription required',
        error: 'SUBSCRIPTION_INACTIVE',
        subscriptionStatus: subscription.status
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Middleware to check if user has access to specific feature
 */
const requireFeatureAccess = (featureName) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).populate('localProPlusSubscription');
      
      if (!user.localProPlusSubscription) {
        return res.status(403).json({
          success: false,
          message: 'LocalPro Plus subscription required for this feature',
          error: 'SUBSCRIPTION_REQUIRED',
          feature: featureName
        });
      }

      const subscription = user.localProPlusSubscription;
      
      if (!subscription.isActive()) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required for this feature',
          error: 'SUBSCRIPTION_INACTIVE',
          feature: featureName
        });
      }

      if (!subscription.hasFeatureAccess(featureName)) {
        return res.status(403).json({
          success: false,
          message: 'Feature not included in your subscription plan',
          error: 'FEATURE_NOT_INCLUDED',
          feature: featureName
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

/**
 * Middleware to check usage limits
 */
const checkUsageLimit = (featureName) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).populate('localProPlusSubscription');
      
      if (!user.localProPlusSubscription) {
        return res.status(403).json({
          success: false,
          message: 'LocalPro Plus subscription required',
          error: 'SUBSCRIPTION_REQUIRED'
        });
      }

      const subscription = user.localProPlusSubscription;
      
      if (!subscription.isActive()) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required',
          error: 'SUBSCRIPTION_INACTIVE'
        });
      }

      if (!subscription.checkUsageLimit(featureName)) {
        return res.status(429).json({
          success: false,
          message: 'Usage limit exceeded for this feature',
          error: 'USAGE_LIMIT_EXCEEDED',
          feature: featureName,
          currentUsage: subscription.usage[featureName]?.current || 0,
          limit: subscription.usage[featureName]?.limit || 'unlimited'
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

/**
 * Middleware to increment usage after successful operation
 */
const incrementUsage = (featureName, amount = 1) => {
  return async (req, res, next) => {
    try {
      if (req.subscription) {
        await req.subscription.incrementUsage(featureName, amount);
      }
      next();
    } catch (error) {
      console.error('Usage increment error:', error);
      // Don't fail the request if usage tracking fails
      next();
    }
  };
};

/**
 * Middleware to check subscription plan level
 */
const requirePlanLevel = (requiredLevel) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).populate('localProPlusSubscription');
      
      if (!user.localProPlusSubscription) {
        return res.status(403).json({
          success: false,
          message: 'LocalPro Plus subscription required',
          error: 'SUBSCRIPTION_REQUIRED'
        });
      }

      const subscription = user.localProPlusSubscription;
      
      if (!subscription.isActive()) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required',
          error: 'SUBSCRIPTION_INACTIVE'
        });
      }

      const populatedSubscription = await subscription.populate('plan');
      const plan = populatedSubscription.plan;
      
      if (!plan) {
        return res.status(403).json({
          success: false,
          message: 'Invalid subscription plan',
          error: 'INVALID_PLAN'
        });
      }

      // Check plan level (assuming plans have a level field)
      const planLevel = plan.level || 0;
      const requiredLevelNum = typeof requiredLevel === 'string' ? 
        { 'basic': 1, 'standard': 2, 'premium': 3, 'enterprise': 4 }[requiredLevel] || 1 :
        requiredLevel;

      if (planLevel < requiredLevelNum) {
        return res.status(403).json({
          success: false,
          message: `This feature requires ${requiredLevel} plan or higher`,
          error: 'INSUFFICIENT_PLAN_LEVEL',
          currentPlan: plan.name,
          requiredLevel
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Plan level check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

module.exports = {
  requireActiveSubscription,
  requireFeatureAccess,
  checkUsageLimit,
  incrementUsage,
  requirePlanLevel
};

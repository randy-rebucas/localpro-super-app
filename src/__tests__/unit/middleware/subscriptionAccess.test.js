const {
  requireActiveSubscription,
  requireFeatureAccess,
  checkUsageLimit,
  incrementUsage,
  requirePlanLevel
} = require('../../../middleware/subscriptionAccess');
const User = require('../../../models/User');

jest.mock('../../../models/User');

describe('Subscription Access Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        id: 'user-id'
      },
      subscription: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requireActiveSubscription', () => {
    test('should return 403 if user has no subscription', async () => {
      const user = {
        id: 'user-id',
        localProPlusSubscription: null
      };
      const mockPopulate = jest.fn().mockResolvedValue(user);
      User.findById = jest.fn().mockReturnValue({ populate: mockPopulate });

      await requireActiveSubscription(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user-id');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'LocalPro Plus subscription required',
        error: 'SUBSCRIPTION_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 403 if subscription is not active', async () => {
      const subscription = {
        isActive: jest.fn().mockReturnValue(false),
        status: 'expired'
      };
      const user = {
        id: 'user-id',
        localProPlusSubscription: subscription
      };
      const mockPopulate = jest.fn().mockResolvedValue(user);
      User.findById = jest.fn().mockReturnValue({ populate: mockPopulate });

      await requireActiveSubscription(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Active LocalPro Plus subscription required',
        error: 'SUBSCRIPTION_INACTIVE',
        subscriptionStatus: 'expired'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow access if subscription is active', async () => {
      const subscription = {
        isActive: jest.fn().mockReturnValue(true)
      };
      const user = {
        id: 'user-id',
        localProPlusSubscription: subscription
      };
      const mockPopulate = jest.fn().mockResolvedValue(user);
      User.findById = jest.fn().mockReturnValue({ populate: mockPopulate });

      await requireActiveSubscription(req, res, next);

      expect(req.subscription).toEqual(subscription);
      expect(next).toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      const mockPopulate = jest.fn().mockRejectedValue(new Error('Database error'));
      User.findById = jest.fn().mockReturnValue({ populate: mockPopulate });

      const originalError = console.error;
      console.error = jest.fn();

      await requireActiveSubscription(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
      expect(console.error).toHaveBeenCalled();

      console.error = originalError;
    });
  });

  describe('requireFeatureAccess', () => {
    test('should return 403 if user has no subscription', async () => {
      const user = {
        id: 'user-id',
        localProPlusSubscription: null
      };
      const mockPopulate = jest.fn().mockResolvedValue(user);
      User.findById = jest.fn().mockReturnValue({ populate: mockPopulate });
      const middleware = requireFeatureAccess('premium_feature');

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'LocalPro Plus subscription required for this feature',
        error: 'SUBSCRIPTION_REQUIRED',
        feature: 'premium_feature'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 403 if subscription does not have feature', async () => {
      const subscription = {
        isActive: jest.fn().mockReturnValue(true),
        hasFeatureAccess: jest.fn().mockReturnValue(false)
      };
      const user = {
        id: 'user-id',
        localProPlusSubscription: subscription
      };
      const mockPopulate = jest.fn().mockResolvedValue(user);
      User.findById = jest.fn().mockReturnValue({ populate: mockPopulate });
      const middleware = requireFeatureAccess('premium_feature');

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Feature not included in your subscription plan',
        error: 'FEATURE_NOT_INCLUDED',
        feature: 'premium_feature'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow access if subscription has feature', async () => {
      const subscription = {
        isActive: jest.fn().mockReturnValue(true),
        hasFeatureAccess: jest.fn().mockReturnValue(true)
      };
      const user = {
        id: 'user-id',
        localProPlusSubscription: subscription
      };
      const mockPopulate = jest.fn().mockResolvedValue(user);
      User.findById = jest.fn().mockReturnValue({ populate: mockPopulate });
      const middleware = requireFeatureAccess('premium_feature');

      await middleware(req, res, next);

      expect(req.subscription).toEqual(subscription);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('checkUsageLimit', () => {
    test('should return 429 if usage limit exceeded', async () => {
      const subscription = {
        isActive: jest.fn().mockReturnValue(true),
        checkUsageLimit: jest.fn().mockReturnValue(false),
        usage: {
          api_calls: {
            current: 1000,
            limit: 1000
          }
        }
      };
      const user = {
        id: 'user-id',
        localProPlusSubscription: subscription
      };
      const mockPopulate = jest.fn().mockResolvedValue(user);
      User.findById = jest.fn().mockReturnValue({ populate: mockPopulate });
      const middleware = checkUsageLimit('api_calls');

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usage limit exceeded for this feature',
        error: 'USAGE_LIMIT_EXCEEDED',
        feature: 'api_calls',
        currentUsage: 1000,
        limit: 1000
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow access if usage limit not exceeded', async () => {
      const subscription = {
        isActive: jest.fn().mockReturnValue(true),
        checkUsageLimit: jest.fn().mockReturnValue(true)
      };
      const user = {
        id: 'user-id',
        localProPlusSubscription: subscription
      };
      const mockPopulate = jest.fn().mockResolvedValue(user);
      User.findById = jest.fn().mockReturnValue({ populate: mockPopulate });
      const middleware = checkUsageLimit('api_calls');

      await middleware(req, res, next);

      expect(req.subscription).toEqual(subscription);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('incrementUsage', () => {
    test('should increment usage if subscription exists', async () => {
      const subscription = {
        incrementUsage: jest.fn().mockResolvedValue()
      };
      req.subscription = subscription;
      const middleware = incrementUsage('api_calls', 1);

      await middleware(req, res, next);

      expect(subscription.incrementUsage).toHaveBeenCalledWith('api_calls', 1);
      expect(next).toHaveBeenCalled();
    });

    test('should not fail if subscription does not exist', async () => {
      req.subscription = null;
      const middleware = incrementUsage('api_calls', 1);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      const subscription = {
        incrementUsage: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      req.subscription = subscription;
      const middleware = incrementUsage('api_calls', 1);

      const originalError = console.error;
      console.error = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();

      console.error = originalError;
    });
  });

  describe('requirePlanLevel', () => {
    test('should return 403 if plan level is insufficient', async () => {
      const plan = {
        name: 'Basic',
        level: 1
      };
      const subscription = {
        isActive: jest.fn().mockReturnValue(true),
        populate: jest.fn().mockResolvedValue({
          plan
        })
      };
      const user = {
        id: 'user-id',
        localProPlusSubscription: subscription
      };
      const mockPopulate = jest.fn().mockResolvedValue(user);
      User.findById = jest.fn().mockReturnValue({ populate: mockPopulate });
      const middleware = requirePlanLevel('premium'); // Requires level 3

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'This feature requires premium plan or higher',
        error: 'INSUFFICIENT_PLAN_LEVEL',
        currentPlan: 'Basic',
        requiredLevel: 'premium'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow access if plan level is sufficient', async () => {
      const plan = {
        name: 'Premium',
        level: 3
      };
      const subscription = {
        isActive: jest.fn().mockReturnValue(true),
        populate: jest.fn().mockResolvedValue({
          plan
        })
      };
      const user = {
        id: 'user-id',
        localProPlusSubscription: subscription
      };
      const mockPopulate = jest.fn().mockResolvedValue(user);
      User.findById = jest.fn().mockReturnValue({ populate: mockPopulate });
      const middleware = requirePlanLevel('premium');

      await middleware(req, res, next);

      expect(req.subscription).toEqual(subscription);
      expect(next).toHaveBeenCalled();
    });
  });
});


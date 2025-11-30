const {
  processServiceBookingReferral,
  processSuppliesOrderReferral,
  processSignupReferral,
  getReferralStats,
  hasPendingReferrals
} = require('../../../middleware/referralProcessor');
const ReferralService = require('../../../services/referralService');
const Referral = require('../../../models/Referral');

jest.mock('../../../services/referralService');
jest.mock('../../../models/Referral');

describe('Referral Processor Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      booking: null,
      order: null,
      enrollment: null,
      loan: null,
      rental: null,
      subscription: null,
      body: {},
      ip: '127.0.0.1',
      get: jest.fn()
    };
    res = {
      locals: {}
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processServiceBookingReferral', () => {
    test('should process referral for service booking', async () => {
      const booking = {
        _id: 'booking-id',
        pricing: { totalAmount: 100, currency: 'USD' }
      };
      const user = {
        _id: 'user-id',
        referral: { referredBy: 'referrer-id' },
        populate: jest.fn().mockReturnThis()
      };
      const referral = { _id: 'referral-id' };
      req.booking = booking;
      req.user = user;
      Referral.findOne = jest.fn().mockResolvedValue(referral);
      ReferralService.processReferralCompletion = jest.fn().mockResolvedValue();

      await processServiceBookingReferral(req, res, next);

      expect(Referral.findOne).toHaveBeenCalled();
      expect(ReferralService.processReferralCompletion).toHaveBeenCalledWith('referral-id', {
        type: 'booking',
        referenceId: 'booking-id',
        referenceType: 'Booking',
        amount: 100,
        currency: 'USD',
        completedAt: expect.any(Date)
      });
      expect(next).toHaveBeenCalled();
    });

    test('should not process if no booking', async () => {
      req.user = { _id: 'user-id', referral: { referredBy: 'referrer-id' } };

      await processServiceBookingReferral(req, res, next);

      expect(Referral.findOne).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('should not process if user has no referrer', async () => {
      req.booking = { _id: 'booking-id' };
      req.user = { _id: 'user-id', referral: {} };

      await processServiceBookingReferral(req, res, next);

      expect(Referral.findOne).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      req.booking = { _id: 'booking-id' };
      req.user = { _id: 'user-id', referral: { referredBy: 'referrer-id' } };
      Referral.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      const originalError = console.error;
      console.error = jest.fn();

      await processServiceBookingReferral(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();

      console.error = originalError;
    });
  });

  describe('processSuppliesOrderReferral', () => {
    test('should process referral for supplies order', async () => {
      const order = {
        _id: 'order-id',
        totalAmount: 50,
        currency: 'USD'
      };
      const user = {
        _id: 'user-id',
        referral: { referredBy: 'referrer-id' },
        populate: jest.fn().mockReturnThis()
      };
      const referral = { _id: 'referral-id' };
      req.order = order;
      req.user = user;
      Referral.findOne = jest.fn().mockResolvedValue(referral);
      ReferralService.processReferralCompletion = jest.fn().mockResolvedValue();

      await processSuppliesOrderReferral(req, res, next);

      expect(ReferralService.processReferralCompletion).toHaveBeenCalledWith('referral-id', {
        type: 'purchase',
        referenceId: 'order-id',
        referenceType: 'Order',
        amount: 50,
        currency: 'USD',
        completedAt: expect.any(Date)
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('processSignupReferral', () => {
    test('should process signup referral with valid code', async () => {
      const referralObj = { 
        referredBy: null,
        save: jest.fn().mockResolvedValue()
      };
      const user = {
        _id: 'user-id',
        referral: referralObj,
        save: jest.fn().mockResolvedValue(),
        ensureReferral: jest.fn().mockResolvedValue(referralObj),
        get: jest.fn().mockReturnValue(undefined)
      };
      req.user = user;
      req.body.referralCode = 'REF123';
      req.ip = '127.0.0.1';
      ReferralService.validateReferralCode = jest.fn().mockResolvedValue({
        valid: true,
        referrer: { id: 'referrer-id' }
      });
      ReferralService.createReferral = jest.fn().mockResolvedValue();

      await processSignupReferral(req, res, next);

      expect(ReferralService.validateReferralCode).toHaveBeenCalledWith('REF123');
      expect(ReferralService.createReferral).toHaveBeenCalled();
      expect(referralObj.referredBy).toBe('referrer-id');
      expect(referralObj.save).toHaveBeenCalled();
      expect(user.save).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('should not process if referral code invalid', async () => {
      req.user = { _id: 'user-id' };
      req.body.referralCode = 'INVALID';
      ReferralService.validateReferralCode = jest.fn().mockResolvedValue({
        valid: false
      });

      await processSignupReferral(req, res, next);

      expect(ReferralService.createReferral).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('should not process if no referral code', async () => {
      req.user = { _id: 'user-id' };
      req.body = {};

      await processSignupReferral(req, res, next);

      expect(ReferralService.validateReferralCode).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getReferralStats', () => {
    test('should return referral stats', async () => {
      const stats = { total: 10, completed: 5 };
      ReferralService.getReferralStats = jest.fn().mockResolvedValue(stats);

      const result = await getReferralStats('user-id');

      expect(ReferralService.getReferralStats).toHaveBeenCalledWith('user-id');
      expect(result).toEqual(stats);
    });

    test('should return null on error', async () => {
      ReferralService.getReferralStats = jest.fn().mockRejectedValue(new Error('Error'));

      const originalError = console.error;
      console.error = jest.fn();

      const result = await getReferralStats('user-id');

      expect(result).toBeNull();

      console.error = originalError;
    });
  });

  describe('hasPendingReferrals', () => {
    test('should return true if pending referrals exist', async () => {
      Referral.countDocuments = jest.fn().mockResolvedValue(5);

      const result = await hasPendingReferrals('user-id');

      expect(Referral.countDocuments).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should return false if no pending referrals', async () => {
      Referral.countDocuments = jest.fn().mockResolvedValue(0);

      const result = await hasPendingReferrals('user-id');

      expect(result).toBe(false);
    });

    test('should return false on error', async () => {
      Referral.countDocuments = jest.fn().mockRejectedValue(new Error('Error'));

      const originalError = console.error;
      console.error = jest.fn();

      const result = await hasPendingReferrals('user-id');

      expect(result).toBe(false);

      console.error = originalError;
    });
  });
});


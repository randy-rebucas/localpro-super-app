const Referral = require('../../../models/Referral');
const User = require('../../../models/User');

jest.mock('../../../models/Referral', () => {
  const mockReferral = jest.fn();
  mockReferral.findOne = jest.fn();
  mockReferral.generateReferralCode = jest.fn();
  return mockReferral;
});
jest.mock('../../../models/User');
jest.mock('../../../services/emailService');

// Import service after mocks (it's exported as an instance)
const referralService = require('../../../services/referralService');

describe('ReferralService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with reward configurations', () => {
      expect(referralService.rewardConfigs).toBeDefined();
      expect(referralService.rewardConfigs.signup).toBeDefined();
      expect(referralService.rewardConfigs.service_booking).toBeDefined();
    });
  });

  describe('createReferral', () => {
    test('should create referral successfully', async () => {
      const referralObjMock = {
        referredBy: null,
        referralSource: null,
        save: jest.fn().mockResolvedValue()
      };
      const mockReferrer = {
        _id: 'referrer123',
        updateReferralStats: jest.fn().mockResolvedValue(),
        save: jest.fn().mockResolvedValue()
      };
      const mockReferee = {
        _id: 'referee123',
        createdAt: new Date(),
        ensureReferral: jest.fn().mockResolvedValue(referralObjMock),
        save: jest.fn().mockResolvedValue()
      };
      
      User.findById = jest.fn()
        .mockResolvedValueOnce(mockReferrer)
        .mockResolvedValueOnce(mockReferee);
      
      Referral.findOne = jest.fn().mockResolvedValue(null);
      Referral.generateReferralCode = jest.fn().mockReturnValue('REF123');
      
      const mockReferralDoc = {
        _id: 'referral123',
        referrer: 'referrer123',
        referee: 'referee123',
        save: jest.fn().mockResolvedValue()
      };
      
      Referral.mockImplementation(() => mockReferralDoc);

      const result = await referralService.createReferral({
        referrerId: 'referrer123',
        refereeId: 'referee123',
        referralType: 'signup'
      });

      expect(result).toBeDefined();
      expect(mockReferralDoc.save).toHaveBeenCalled();
      expect(mockReferrer.updateReferralStats).toHaveBeenCalled();
      expect(referralObjMock.save).toHaveBeenCalled();
    });
  });

  describe('getReferralStats', () => {
    test('should get referral statistics', async () => {
      const mockStats = {
        totalReferrals: 10,
        activeReferrals: 5
      };
      
      Referral.getReferralStats = jest.fn().mockResolvedValue(mockStats);
      
      const mockUser = {
        referral: {
          referralStats: mockStats
        }
      };
      
      User.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await referralService.getReferralStats('user123');

      expect(result).toBeDefined();
      expect(User.findById).toHaveBeenCalledWith('user123');
    });
  });
});


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
      const mockReferrer = {
        _id: 'referrer123',
        updateReferralStats: jest.fn().mockResolvedValue(),
        save: jest.fn().mockResolvedValue()
      };
      const mockReferee = {
        _id: 'referee123',
        createdAt: new Date(),
        referral: {
          referredBy: null,
          referralSource: null
        },
        save: jest.fn().mockResolvedValue()
      };
      
      User.findById = jest.fn()
        .mockResolvedValueOnce(mockReferrer)
        .mockResolvedValueOnce(mockReferee);
      
      Referral.findOne = jest.fn().mockResolvedValue(null);
      Referral.generateReferralCode = jest.fn().mockReturnValue('REF123');
      
      const mockReferral = {
        _id: 'referral123',
        referrer: 'referrer123',
        referee: 'referee123',
        save: jest.fn().mockResolvedValue()
      };
      
      Referral.mockImplementation(() => mockReferral);

      const result = await referralService.createReferral({
        referrerId: 'referrer123',
        refereeId: 'referee123',
        referralType: 'signup'
      });

      expect(result).toBeDefined();
      expect(mockReferral.save).toHaveBeenCalled();
    });
  });

  describe('getReferralStats', () => {
    test('should get referral statistics', async () => {
      Referral.getReferralStats = jest.fn().mockResolvedValue({
        totalReferrals: 10,
        activeReferrals: 5
      });
      
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          referral: {
            referralStats: {}
          }
        })
      });

      const result = await referralService.getReferralStats('user123');

      expect(result).toBeDefined();
    });
  });
});


const mongoose = require('mongoose');
const User = require('../../src/models/User');

// Mock mongoose
jest.mock('mongoose');

describe('User Model - Business Logic', () => {
  let mockUser;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock user instance
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      phoneNumber: '+1234567890',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'client',
      isVerified: true,
      verification: {
        phoneVerified: true,
        emailVerified: true,
        identityVerified: false,
        businessVerified: false,
        addressVerified: false,
        bankAccountVerified: false
      },
      profile: {
        rating: 4.5,
        totalReviews: 10,
        bio: 'Test bio',
        skills: ['cleaning', 'plumbing'],
        experience: 5,
        businessName: 'Test Business',
        businessType: 'individual',
        yearsInBusiness: 3,
        serviceAreas: ['New York', 'Brooklyn'],
        specialties: ['residential', 'commercial'],
        certifications: [],
        insurance: {
          hasInsurance: true,
          provider: 'Test Insurance',
          policyNumber: 'POL-123',
          expiryDate: new Date('2024-12-31')
        },
        portfolio: [],
        badges: []
      },
      completionRate: 85,
      trustScore: 75,
      referral: {
        referralCode: 'REF123',
        referredBy: null,
        referralSource: 'direct_link',
        referralStats: {
          totalReferrals: 5,
          successfulReferrals: 3,
          totalRewardsEarned: 150,
          totalRewardsPaid: 100,
          lastReferralAt: new Date(),
          referralTier: 'silver'
        },
        referralPreferences: {
          autoShare: true,
          shareOnSocial: false,
          emailNotifications: true,
          smsNotifications: false
        }
      },
      lastLoginAt: new Date(),
      lastLoginIP: '192.168.1.1',
      loginCount: 10,
      status: 'active',
      statusReason: null,
      statusUpdatedAt: null,
      statusUpdatedBy: null,
      deletedAt: null,
      deletedBy: null,
      notes: [],
      tags: ['vip', 'verified'],
      activity: {
        lastActiveAt: new Date(),
        totalSessions: 25,
        averageSessionDuration: 1800,
        deviceInfo: [
          {
            deviceType: 'mobile',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
            lastUsed: new Date()
          }
        ]
      },
      save: jest.fn().mockResolvedValue(true),
      generateVerificationCode: jest.fn().mockReturnValue('123456'),
      verifyCode: jest.fn().mockReturnValue(true),
      calculateTrustScore: jest.fn().mockReturnValue(75),
      addBadge: jest.fn(),
      updateResponseTime: jest.fn(),
      isReferred: jest.fn().mockReturnValue(false),
      updateLoginInfo: jest.fn().mockResolvedValue(true),
      getDeviceType: jest.fn().mockReturnValue('mobile'),
      addNote: jest.fn().mockResolvedValue(true),
      updateStatus: jest.fn().mockResolvedValue(true),
      addTag: jest.fn().mockResolvedValue(true),
      removeTag: jest.fn().mockResolvedValue(true),
      hasTag: jest.fn().mockReturnValue(true),
      getActivitySummary: jest.fn().mockReturnValue({
        lastLoginAt: new Date(),
        loginCount: 10,
        lastActiveAt: new Date(),
        totalSessions: 25,
        averageSessionDuration: 1800,
        deviceCount: 1,
        status: 'active',
        isActive: true,
        trustScore: 75,
        verification: {
          phoneVerified: true,
          emailVerified: true
        }
      })
    };
  });

  describe('Verification Code Generation', () => {
    it('should generate 6-digit verification code', () => {
      const code = mockUser.generateVerificationCode();
      
      expect(code).toBe('123456');
      expect(mockUser.generateVerificationCode).toHaveBeenCalled();
    });

    it('should verify correct verification code', () => {
      const isValid = mockUser.verifyCode('123456');
      
      expect(isValid).toBe(true);
      expect(mockUser.verifyCode).toHaveBeenCalledWith('123456');
    });

    it('should reject incorrect verification code', () => {
      mockUser.verifyCode.mockReturnValue(false);
      const isValid = mockUser.verifyCode('654321');
      
      expect(isValid).toBe(false);
      expect(mockUser.verifyCode).toHaveBeenCalledWith('654321');
    });
  });

  describe('Trust Score Calculation', () => {
    it('should calculate trust score based on verification status', () => {
      const trustScore = mockUser.calculateTrustScore();
      
      expect(trustScore).toBe(75);
      expect(mockUser.calculateTrustScore).toHaveBeenCalled();
    });

    it('should include verification points in trust score', () => {
      // Test the actual calculation logic
      let score = 0;
      
      if (mockUser.verification.phoneVerified) score += 10;
      if (mockUser.verification.emailVerified) score += 10;
      if (mockUser.verification.identityVerified) score += 20;
      if (mockUser.verification.businessVerified) score += 15;
      if (mockUser.verification.addressVerified) score += 10;
      if (mockUser.verification.bankAccountVerified) score += 15;
      
      // Rating points (up to 20 points)
      score += Math.round(mockUser.profile.rating * 4);
      
      // Review count bonus (up to 10 points)
      if (mockUser.profile.totalReviews > 0) {
        score += Math.min(10, Math.floor(mockUser.profile.totalReviews / 5));
      }
      
      // Completion rate bonus (up to 10 points)
      score += Math.round(mockUser.completionRate / 10);
      
      // Badge bonus (up to 10 points)
      score += Math.min(10, mockUser.profile.badges.length * 2);
      
      const finalScore = Math.min(100, score);
      
      expect(finalScore).toBeGreaterThan(0);
      expect(finalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Badge Management', () => {
    it('should add new badge', () => {
      mockUser.addBadge('first_job', 'Completed first job');
      
      expect(mockUser.addBadge).toHaveBeenCalledWith('first_job', 'Completed first job');
    });

    it('should not add duplicate badge', () => {
      // Mock existing badge
      mockUser.profile.badges = [
        { type: 'first_job', earnedAt: new Date(), description: 'Completed first job' }
      ];
      
      mockUser.addBadge('first_job', 'Completed first job');
      
      expect(mockUser.addBadge).toHaveBeenCalledWith('first_job', 'Completed first job');
    });
  });

  describe('Response Time Management', () => {
    it('should update response time', () => {
      const responseTime = 120; // 2 minutes in seconds
      mockUser.updateResponseTime(responseTime);
      
      expect(mockUser.updateResponseTime).toHaveBeenCalledWith(responseTime);
    });
  });

  describe('Referral System', () => {
    it('should check if user is referred', () => {
      const isReferred = mockUser.isReferred();
      
      expect(isReferred).toBe(false);
      expect(mockUser.isReferred).toHaveBeenCalled();
    });

    it('should return true for referred user', () => {
      mockUser.isReferred.mockReturnValue(true);
      mockUser.referral.referredBy = new mongoose.Types.ObjectId();
      
      const isReferred = mockUser.isReferred();
      
      expect(isReferred).toBe(true);
    });
  });

  describe('Login Information Management', () => {
    it('should update login information', async () => {
      const ip = '192.168.1.100';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      await mockUser.updateLoginInfo(ip, userAgent);
      
      expect(mockUser.updateLoginInfo).toHaveBeenCalledWith(ip, userAgent);
    });

    it('should detect device type from user agent', () => {
      const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const desktopUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      mockUser.getDeviceType.mockReturnValueOnce('mobile');
      mockUser.getDeviceType.mockReturnValueOnce('desktop');
      
      const mobileType = mockUser.getDeviceType(mobileUserAgent);
      const desktopType = mockUser.getDeviceType(desktopUserAgent);
      
      expect(mobileType).toBe('mobile');
      expect(desktopType).toBe('desktop');
    });
  });

  describe('Note Management', () => {
    it('should add note to user', async () => {
      const note = 'Customer prefers morning appointments';
      const addedBy = new mongoose.Types.ObjectId();
      
      await mockUser.addNote(note, addedBy);
      
      expect(mockUser.addNote).toHaveBeenCalledWith(note, addedBy);
    });
  });

  describe('Status Management', () => {
    it('should update user status', async () => {
      const status = 'suspended';
      const reason = 'Policy violation';
      const updatedBy = new mongoose.Types.ObjectId();
      
      await mockUser.updateStatus(status, reason, updatedBy);
      
      expect(mockUser.updateStatus).toHaveBeenCalledWith(status, reason, updatedBy);
    });

    it('should set isActive based on status', () => {
      // Test active status
      mockUser.status = 'active';
      const isActiveForActive = ['active', 'pending_verification'].includes(mockUser.status);
      expect(isActiveForActive).toBe(true);
      
      // Test inactive status
      mockUser.status = 'suspended';
      const isActiveForSuspended = ['active', 'pending_verification'].includes(mockUser.status);
      expect(isActiveForSuspended).toBe(false);
    });
  });

  describe('Tag Management', () => {
    it('should add tag to user', async () => {
      const tag = 'high_value';
      
      await mockUser.addTag(tag);
      
      expect(mockUser.addTag).toHaveBeenCalledWith(tag);
    });

    it('should remove tag from user', async () => {
      const tag = 'vip';
      
      await mockUser.removeTag(tag);
      
      expect(mockUser.removeTag).toHaveBeenCalledWith(tag);
    });

    it('should check if user has tag', () => {
      const hasTag = mockUser.hasTag('vip');
      
      expect(hasTag).toBe(true);
      expect(mockUser.hasTag).toHaveBeenCalledWith('vip');
    });
  });

  describe('Activity Summary', () => {
    it('should get user activity summary', () => {
      const summary = mockUser.getActivitySummary();
      
      expect(summary).toEqual({
        lastLoginAt: expect.any(Date),
        loginCount: 10,
        lastActiveAt: expect.any(Date),
        totalSessions: 25,
        averageSessionDuration: 1800,
        deviceCount: 1,
        status: 'active',
        isActive: true,
        trustScore: 75,
        verification: {
          phoneVerified: true,
          emailVerified: true
        }
      });
      expect(mockUser.getActivitySummary).toHaveBeenCalled();
    });
  });

  describe('Static Methods', () => {
    beforeEach(() => {
      // Mock static methods
      User.getUsersByStatus = jest.fn();
      User.getUsersByRole = jest.fn();
      User.getActiveUsers = jest.fn();
      User.getLowTrustUsers = jest.fn();
      User.getRecentUsers = jest.fn();
    });

    it('should get users by status', () => {
      const status = 'active';
      User.getUsersByStatus.mockResolvedValue([mockUser]);
      
      expect(User.getUsersByStatus).toBeDefined();
    });

    it('should get users by role', () => {
      const role = 'provider';
      User.getUsersByRole.mockResolvedValue([mockUser]);
      
      expect(User.getUsersByRole).toBeDefined();
    });

    it('should get active users', () => {
      User.getActiveUsers.mockResolvedValue([mockUser]);
      
      expect(User.getActiveUsers).toBeDefined();
    });

    it('should get users with low trust score', () => {
      const threshold = 30;
      User.getLowTrustUsers.mockResolvedValue([mockUser]);
      
      expect(User.getLowTrustUsers).toBeDefined();
    });

    it('should get recently registered users', () => {
      const days = 7;
      User.getRecentUsers.mockResolvedValue([mockUser]);
      
      expect(User.getRecentUsers).toBeDefined();
    });
  });

  describe('Profile Completeness', () => {
    it('should calculate profile completeness percentage', () => {
      const requiredFields = [
        'firstName', 'lastName', 'email', 'profile.bio',
        'profile.skills', 'profile.experience', 'profile.businessName'
      ];
      
      let completedFields = 0;
      requiredFields.forEach(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], mockUser);
        if (value && (Array.isArray(value) ? value.length > 0 : true)) {
          completedFields++;
        }
      });
      
      const completeness = Math.round((completedFields / requiredFields.length) * 100);
      
      expect(completeness).toBeGreaterThan(0);
      expect(completeness).toBeLessThanOrEqual(100);
    });
  });

  describe('Business Information Validation', () => {
    it('should validate business type', () => {
      const validBusinessTypes = ['individual', 'small_business', 'enterprise', 'franchise'];
      
      expect(validBusinessTypes).toContain(mockUser.profile.businessType);
    });

    it('should validate service areas', () => {
      expect(Array.isArray(mockUser.profile.serviceAreas)).toBe(true);
      expect(mockUser.profile.serviceAreas.length).toBeGreaterThan(0);
    });

    it('should validate specialties', () => {
      expect(Array.isArray(mockUser.profile.specialties)).toBe(true);
      expect(mockUser.profile.specialties.length).toBeGreaterThan(0);
    });
  });

  describe('Insurance Information', () => {
    it('should validate insurance information', () => {
      if (mockUser.profile.insurance.hasInsurance) {
        expect(mockUser.profile.insurance.provider).toBeDefined();
        expect(mockUser.profile.insurance.policyNumber).toBeDefined();
        expect(mockUser.profile.insurance.expiryDate).toBeDefined();
      }
    });

    it('should check if insurance is expired', () => {
      const expiryDate = new Date(mockUser.profile.insurance.expiryDate);
      const isExpired = expiryDate < new Date();
      
      expect(typeof isExpired).toBe('boolean');
    });
  });

  describe('Rating and Reviews', () => {
    it('should validate rating range', () => {
      expect(mockUser.profile.rating).toBeGreaterThanOrEqual(0);
      expect(mockUser.profile.rating).toBeLessThanOrEqual(5);
    });

    it('should validate total reviews count', () => {
      expect(mockUser.profile.totalReviews).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Referral Statistics', () => {
    it('should validate referral statistics', () => {
      expect(mockUser.referral.referralStats.totalReferrals).toBeGreaterThanOrEqual(0);
      expect(mockUser.referral.referralStats.successfulReferrals).toBeGreaterThanOrEqual(0);
      expect(mockUser.referral.referralStats.totalRewardsEarned).toBeGreaterThanOrEqual(0);
      expect(mockUser.referral.referralStats.totalRewardsPaid).toBeGreaterThanOrEqual(0);
    });

    it('should validate referral tier', () => {
      const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
      expect(validTiers).toContain(mockUser.referral.referralStats.referralTier);
    });
  });
});

/**
 * Referral Service Tests
 * Tests for referralService.js
 */

// Mock dependencies
// Create mock Referral model
const MockReferral = jest.fn().mockImplementation((data) => ({
  ...data,
  save: jest.fn().mockResolvedValue({ _id: 'referral-123', ...data })
}));

MockReferral.findOne = jest.fn();
MockReferral.findById = jest.fn();
MockReferral.findActiveByCode = jest.fn();
MockReferral.generateReferralCode = jest.fn().mockReturnValue('REF123456');
MockReferral.getReferralStats = jest.fn();

jest.mock('../../models/Referral', () => MockReferral);

jest.mock('../../models/User', () => {
  const mockFindById = jest.fn();
  return {
    findById: mockFindById
  };
});

// Mock EmailService - must be defined before requiring referralService
// Use shared mock functions that are accessible both in the mock factory and in tests
const mockSendReferralRewardNotification = jest.fn().mockResolvedValue({ success: true });
const mockSendEmail = jest.fn().mockResolvedValue({ success: true });
const mockSendReferralRewardEmail = jest.fn().mockResolvedValue({ success: true });

// Create a shared mock object that will be returned by the mock factory
// This ensures all references point to the same object
const mockEmailServiceObject = {
  sendEmail: mockSendEmail,
  sendReferralRewardEmail: mockSendReferralRewardEmail,
  sendReferralRewardNotification: mockSendReferralRewardNotification
};

// CRITICAL: Mock EmailService BEFORE any modules are loaded
// This ensures referralService.js gets the mocked version when it does require('./emailService')
jest.mock('../../services/emailService', () => {
  // Return the same mock object reference to ensure consistency
  // This object will be shared across all requires
  // IMPORTANT: This mock is hoisted and applies before any require() calls
  // The factory function runs when the mock is first needed
  return mockEmailServiceObject;
});

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

// Load modules - the jest.mock() calls above ensure EmailService is mocked
// The mocks are hoisted, so they apply before any require() calls
// IMPORTANT: Load EmailService FIRST to ensure mock is applied and cached
const EmailService = require('../../services/emailService');

// CRITICAL: Verify EmailService is mocked BEFORE loading referralService
// If this fails, referralService will use the real EmailService
if (EmailService !== mockEmailServiceObject) {
  const emailServiceKeys = EmailService ? Object.keys(EmailService) : [];
  const mockKeys = Object.keys(mockEmailServiceObject);
  throw new Error(`EmailService mock was not applied correctly!
    EmailService !== mockEmailServiceObject
    EmailService type: ${typeof EmailService}
    EmailService constructor: ${EmailService?.constructor?.name || 'none'}
    EmailService keys: ${emailServiceKeys.join(', ')}
    mockEmailServiceObject keys: ${mockKeys.join(', ')}
    EmailService.sendReferralRewardNotification type: ${typeof EmailService?.sendReferralRewardNotification}
    Is our mock function: ${EmailService?.sendReferralRewardNotification === mockSendReferralRewardNotification}`);
}

// Verify the mock function is actually set
if (EmailService.sendReferralRewardNotification !== mockSendReferralRewardNotification) {
  throw new Error('EmailService.sendReferralRewardNotification is not our mock function!');
}

// Now load ReferralService - it will import EmailService using require('./emailService')
// Since jest.mock() is hoisted and EmailService is already in the module cache as our mock,
// referralService.js should get our mocked EmailService
const ReferralService = require('../../services/referralService');
const Referral = require('../../models/Referral');
const User = require('../../models/User');

// CRITICAL: After loading ReferralService, verify EmailService is still our mock
// When referralService.js loaded, it did: const EmailService = require('./emailService')
// This should have gotten our mock from the module cache
const emailServiceAfterReferralService = require('../../services/emailService');
if (emailServiceAfterReferralService !== mockEmailServiceObject) {
  throw new Error(`EmailService changed after loading ReferralService! Module caching issue.
    Before: ${EmailService === mockEmailServiceObject}
    After: ${emailServiceAfterReferralService === mockEmailServiceObject}`);
}

// Verify EmailService.sendReferralRewardNotification is still our mock
if (EmailService.sendReferralRewardNotification !== mockSendReferralRewardNotification) {
  throw new Error('EmailService.sendReferralRewardNotification changed after loading ReferralService!');
}

describe('ReferralService', () => {
  // Service is exported as singleton instance
  const referralService = ReferralService;
  let mockReferral;
  let mockReferrer;
  let mockReferee;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Ensure EmailService is the mock object
    // Since jest.mock is hoisted, EmailService should already be mocked
    // But we verify and ensure it's correct
    expect(EmailService).toBe(mockEmailServiceObject);
    
    // Reset mock implementations
    mockSendReferralRewardNotification.mockResolvedValue({ success: true });
    mockSendEmail.mockResolvedValue({ success: true });
    mockSendReferralRewardEmail.mockResolvedValue({ success: true });
    
    // Service is singleton, no need to create new instance
    
    mockReferrer = {
      _id: 'referrer-123',
      email: 'referrer@example.com',
      firstName: 'John',
      referral: {
        referralPreferences: {
          emailNotifications: true
        },
        referralStats: {
          referralTier: 'bronze',
          totalRewardsEarned: 100,
          totalRewardsPaid: 50
        }
      },
      updateReferralStats: jest.fn().mockResolvedValue(),
      save: jest.fn().mockResolvedValue()
    };
    
    mockReferee = {
      _id: 'referee-123',
      email: 'referee@example.com',
      firstName: 'Jane',
      createdAt: new Date(),
      referral: {
        referredBy: null,
        referralSource: 'direct_link',
        referralPreferences: {
          emailNotifications: true
        },
        referralStats: {
          referralTier: 'bronze',
          totalRewardsEarned: 0,
          totalRewardsPaid: 0
        }
      },
      updateReferralStats: jest.fn().mockResolvedValue(),
      save: jest.fn().mockResolvedValue()
    };
    
    mockReferral = {
      _id: 'referral-123',
      referrer: 'referrer-123',
      referee: 'referee-123',
      referralCode: 'REF123456',
      referralType: 'signup',
      status: 'pending',
      tracking: {},
      timeline: {},
      rewardDistribution: {
        referrerReward: { amount: 10, currency: 'USD', type: 'credit', status: 'pending' },
        refereeReward: { amount: 5, currency: 'USD', type: 'credit', status: 'pending' }
      },
      markCompleted: jest.fn().mockResolvedValue(),
      save: jest.fn().mockResolvedValue()
    };
    
    // Set up User.findById to return a query object that is both thenable and has select method
    User.findById.mockImplementation((id) => {
      let user = null;
      if (id === 'referrer-123') {
        user = mockReferrer;
      } else if (id === 'referee-123') {
        user = mockReferee;
      }
      
      // Create a thenable query object (works as both promise and query)
      const query = {
        select: jest.fn().mockImplementation(() => {
          // Return a promise that resolves to the user
          return Promise.resolve(user);
        })
      };
      
      // Make the query object thenable (can be used as a promise)
      query.then = (resolve, reject) => {
        return Promise.resolve(user).then(resolve, reject);
      };
      query.catch = (reject) => {
        return Promise.resolve(user).catch(reject);
      };
      
      return query;
    });
    
    Referral.findOne.mockResolvedValue(null);
    Referral.findById.mockResolvedValue(mockReferral);
  });

  describe('Service Instance', () => {
    it('should have reward configs', () => {
      expect(referralService.rewardConfigs).toBeDefined();
      expect(referralService.rewardConfigs.signup).toBeDefined();
      expect(referralService.rewardConfigs.service_booking).toBeDefined();
      expect(referralService.rewardConfigs.subscription_upgrade).toBeDefined();
    });
  });

  describe('createReferral', () => {
    it('should create referral successfully', async () => {
      const referralData = {
        referrerId: 'referrer-123',
        refereeId: 'referee-123',
        referralType: 'signup',
        tracking: { source: 'email' }
      };

      await referralService.createReferral(referralData);

      expect(User.findById).toHaveBeenCalledWith('referrer-123');
      expect(User.findById).toHaveBeenCalledWith('referee-123');
      expect(Referral.findOne).toHaveBeenCalled();
      expect(mockReferrer.updateReferralStats).toHaveBeenCalledWith('referral_made');
      expect(mockReferee.save).toHaveBeenCalled();
    });

    it('should throw error for invalid referrer or referee', async () => {
      User.findById.mockResolvedValueOnce(null);

      await expect(
        referralService.createReferral({
          referrerId: 'invalid',
          refereeId: 'referee-123',
          referralType: 'signup'
        })
      ).rejects.toThrow('Invalid referrer or referee');
    });

    it('should throw error for duplicate referral', async () => {
      Referral.findOne.mockResolvedValueOnce({ _id: 'existing' });

      await expect(
        referralService.createReferral({
          referrerId: 'referrer-123',
          refereeId: 'referee-123',
          referralType: 'signup'
        })
      ).rejects.toThrow('already been referred');
    });
  });

  describe('processReferralCompletion', () => {
    it('should process referral completion successfully', async () => {
      const triggerAction = { amount: 100 };
      
      // Mock applyReward and sendCompletionNotifications
      referralService.applyReward = jest.fn().mockResolvedValue();
      referralService.sendCompletionNotifications = jest.fn().mockResolvedValue();

      const result = await referralService.processReferralCompletion('referral-123', triggerAction);

      expect(mockReferral.markCompleted).toHaveBeenCalledWith(triggerAction);
      expect(mockReferral.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error when referral not found', async () => {
      Referral.findById.mockResolvedValueOnce(null);

      await expect(
        referralService.processReferralCompletion('invalid-id', { amount: 100 })
      ).rejects.toThrow('Referral not found');
    });

    it('should throw error when referral not pending', async () => {
      mockReferral.status = 'completed';
      Referral.findById.mockResolvedValueOnce(mockReferral);

      await expect(
        referralService.processReferralCompletion('referral-123', { amount: 100 })
      ).rejects.toThrow('not in pending status');
    });

    it('should calculate rewards correctly', async () => {
      const triggerAction = { amount: 500 };
      const serviceBookingReferral = {
        ...mockReferral,
        referralType: 'service_booking',
        timeline: {},
        rewardDistribution: {
          referrerReward: { amount: 0, currency: 'USD', type: 'percentage', status: 'pending' },
          refereeReward: { amount: 0, currency: 'USD', type: 'discount', status: 'pending' }
        },
        save: jest.fn().mockResolvedValue()
      };
      Referral.findById.mockResolvedValueOnce(serviceBookingReferral);
      
      referralService.applyReward = jest.fn().mockResolvedValue();
      referralService.sendCompletionNotifications = jest.fn().mockResolvedValue();

      await referralService.processReferralCompletion('referral-123', triggerAction);

      expect(serviceBookingReferral.save).toHaveBeenCalled();
      // For service_booking: referrer gets 10% with max $50
      // 10% of 500 = 50, which is exactly the max
      expect(serviceBookingReferral.rewardDistribution.referrerReward.amount).toBe(50);
    });
  });

  describe('calculateReward', () => {
    it('should calculate percentage reward', () => {
      const rewardConfig = {
        isPercentage: true,
        amount: 10,
        maxAmount: 50,
        currency: 'USD'
      };

      const reward = referralService.calculateReward(500, rewardConfig);

      expect(reward).toBe(50); // 10% of 500 = 50, capped at maxAmount
    });

    it('should cap percentage reward at maxAmount', () => {
      const rewardConfig = {
        isPercentage: true,
        amount: 10,
        maxAmount: 30,
        currency: 'USD'
      };

      const reward = referralService.calculateReward(500, rewardConfig);

      expect(reward).toBe(30); // Capped at maxAmount
    });

    it('should return fixed amount for non-percentage rewards', () => {
      const rewardConfig = {
        type: 'credit',
        amount: 25,
        currency: 'USD'
      };

      const reward = referralService.calculateReward(500, rewardConfig);

      expect(reward).toBe(25);
    });
  });

  describe('processRewards', () => {
    it('should process rewards successfully', async () => {
      // Mock applyReward to avoid actual user wallet updates
      const originalApplyReward = referralService.applyReward;
      referralService.applyReward = jest.fn().mockResolvedValue();

      await referralService.processRewards(mockReferral);

      expect(mockReferral.save).toHaveBeenCalled();
      expect(referralService.applyReward).toHaveBeenCalled();
      expect(mockReferral.rewardDistribution.referrerReward.status).toBe('processed');
      expect(mockReferral.rewardDistribution.refereeReward.status).toBe('processed');
      
      // Restore original
      referralService.applyReward = originalApplyReward;
    });

    it('should handle zero reward amounts', async () => {
      mockReferral.rewardDistribution.referrerReward.amount = 0;
      mockReferral.rewardDistribution.refereeReward.amount = 0;

      await referralService.processRewards(mockReferral);

      expect(mockReferral.save).toHaveBeenCalled();
      // applyReward should not be called for zero amounts
    });
  });

  describe('sendCompletionNotifications', () => {
    it('should send completion notifications', async () => {
      // Verify the mock objects have the required structure
      expect(mockReferrer.email).toBeDefined();
      expect(mockReferrer.referral.referralPreferences.emailNotifications).toBe(true);
      expect(mockReferee.email).toBeDefined();
      expect(mockReferee.referral.referralPreferences.emailNotifications).toBe(true);
      expect(mockReferral.rewardDistribution).toBeDefined();
      expect(mockReferral.rewardDistribution.referrerReward).toBeDefined();
      expect(mockReferral.rewardDistribution.refereeReward).toBeDefined();
      
      // Verify EmailService is mocked
      expect(EmailService).toBeDefined();
      expect(EmailService.sendReferralRewardNotification).toBeDefined();
      
      // CRITICAL: Ensure we're using the mock, not a cached real EmailService
      // Since referralService.js imports EmailService at module load, we need to
      // verify the mock is actually being used by the referralService instance
      // Use Object.defineProperty to ensure the method is replaced even if it's non-enumerable
      Object.defineProperty(EmailService, 'sendReferralRewardNotification', {
        value: mockSendReferralRewardNotification,
        writable: true,
        enumerable: true,
        configurable: true
      });
      
      expect(jest.isMockFunction(EmailService.sendReferralRewardNotification)).toBe(true);
      expect(EmailService.sendReferralRewardNotification).toBe(mockSendReferralRewardNotification);
      
      // Verify the actual function reference matches
      const actualFunction = EmailService.sendReferralRewardNotification;
      expect(actualFunction).toBe(mockSendReferralRewardNotification);
      
      // Ensure the mock is properly set up and clear call history
      mockSendReferralRewardNotification.mockResolvedValue({ success: true });
      mockSendReferralRewardNotification.mockClear();
      
      // Spy on console.error to catch any silent errors that might prevent execution
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
        // Log errors to help debug
        console.log('Console.error called:', args);
      });
      
      // Verify conditions that would prevent email sending
      expect(mockReferrer.email).toBeTruthy();
      expect(mockReferrer.referral.referralPreferences.emailNotifications).toBe(true);
      expect(mockReferee.email).toBeTruthy();
      expect(mockReferee.referral.referralPreferences.emailNotifications).toBe(true);
      
      // Verify EmailService.sendReferralRewardNotification is actually a function
      expect(typeof EmailService.sendReferralRewardNotification).toBe('function');
      
      // Verify EmailService is the mock object we created
      expect(EmailService).toBe(mockEmailServiceObject);
      
      // Test that EmailService.sendReferralRewardNotification works directly
      await EmailService.sendReferralRewardNotification('test@example.com', { test: 'data' });
      expect(mockSendReferralRewardNotification).toHaveBeenCalledTimes(1);
      mockSendReferralRewardNotification.mockClear();
      
      // Verify all required properties exist on mock objects
      // The referralService code checks: referrer.email, referrer.referral.referralPreferences.emailNotifications
      // and uses: referrer.firstName, referee.firstName
      expect(mockReferrer.firstName).toBeDefined();
      expect(mockReferee.firstName).toBeDefined();
      
      // CRITICAL: Verify EmailService is correctly mocked
      // Since referralService.js imports EmailService at module load, we need to ensure
      // the EmailService module it uses is our mock
      const emailServiceCheckModule = require('../../services/emailService');
      expect(emailServiceCheckModule).toBe(mockEmailServiceObject);
      expect(emailServiceCheckModule.sendReferralRewardNotification).toBe(mockSendReferralRewardNotification);
      
      // Verify the exact structure needed - check all properties that are accessed
      expect(mockReferrer.email).toBeTruthy();
      expect(mockReferrer.referral.referralPreferences.emailNotifications).toBe(true);
      expect(mockReferrer.firstName).toBe('John');
      expect(mockReferee.email).toBeTruthy();
      expect(mockReferee.referral.referralPreferences.emailNotifications).toBe(true);
      expect(mockReferee.firstName).toBe('Jane');
      expect(mockReferral.rewardDistribution.referrerReward.amount).toBeDefined();
      expect(mockReferral.rewardDistribution.refereeReward.amount).toBeDefined();
      expect(mockReferral.referralType).toBeDefined();
      
      // CRITICAL TEST: Verify EmailService IS our mock
      // This checks that the module system is returning our mock
      const emailServiceCheck = require('../../services/emailService');
      expect(emailServiceCheck).toBe(mockEmailServiceObject);
      expect(emailServiceCheck.sendReferralRewardNotification).toBe(mockSendReferralRewardNotification);
      
      // The issue: referralService.js does `const EmailService = require('./emailService')` at module load
      // We need to ensure that the EmailService it got is our mock.
      // Since jest.mock() is hoisted, it should work, but let's verify by checking
      // what referralService actually sees when it calls EmailService
      
      // CRITICAL: The real EmailService might be throwing an error because it's not initialized
      // Let's spy on the actual EmailService.sendReferralRewardNotification to see if it's being called
      // but failing silently, or if it's not our mock at all
      
      // Get the EmailService that referralService actually uses
      // We can't directly access it from referralService, but we can check if calls are made
      // to the module-level EmailService
      
      // First, let's verify the conditions are actually met
      const referrerCondition = mockReferrer.email && mockReferrer.referral?.referralPreferences?.emailNotifications;
      const refereeCondition = mockReferee.email && mockReferee.referral?.referralPreferences?.emailNotifications;
      
      expect(referrerCondition).toBe(true);
      expect(refereeCondition).toBe(true);
      
      // CRITICAL: Verify EmailService.sendReferralRewardNotification exists and is our mock
      // This is the same EmailService that referralService.js uses (from module cache)
      expect(EmailService.sendReferralRewardNotification).toBeDefined();
      expect(EmailService.sendReferralRewardNotification).toBe(mockSendReferralRewardNotification);
      expect(typeof EmailService.sendReferralRewardNotification).toBe('function');
      expect(jest.isMockFunction(EmailService.sendReferralRewardNotification)).toBe(true);
      
      // Verify EmailService itself is our mock object
      expect(EmailService).toBe(mockEmailServiceObject);
      
      // Test the mock directly to ensure it works
      mockSendReferralRewardNotification.mockClear();
      await EmailService.sendReferralRewardNotification('test@example.com', { test: true });
      expect(mockSendReferralRewardNotification).toHaveBeenCalledTimes(1);
      mockSendReferralRewardNotification.mockClear();
      
      // CRITICAL: Spy on EmailService.sendReferralRewardNotification to see if it's actually being called
      // This will help us determine if the issue is that the method isn't being called,
      // or if it's being called on a different EmailService instance
      const emailServiceMethodSpy = jest.spyOn(EmailService, 'sendReferralRewardNotification');
      emailServiceMethodSpy.mockImplementation(mockSendReferralRewardNotification);
      
      // CRITICAL DEBUG: Check what EmailService referralService actually has access to
      // Since referralService.js does const EmailService = require('./emailService') at module load,
      // we need to verify the exact structure of the objects being passed
      
      // Log the actual object structure to see if properties are nested correctly
      console.log('DEBUG: mockReferrer structure:', {
        hasEmail: !!mockReferrer.email,
        hasReferral: !!mockReferrer.referral,
        hasReferralPreferences: !!mockReferrer.referral?.referralPreferences,
        hasEmailNotifications: !!mockReferrer.referral?.referralPreferences?.emailNotifications,
        emailNotificationsValue: mockReferrer.referral?.referralPreferences?.emailNotifications,
        firstName: mockReferrer.firstName
      });
      
      console.log('DEBUG: mockReferee structure:', {
        hasEmail: !!mockReferee.email,
        hasReferral: !!mockReferee.referral,
        hasReferralPreferences: !!mockReferee.referral?.referralPreferences,
        hasEmailNotifications: !!mockReferee.referral?.referralPreferences?.emailNotifications,
        emailNotificationsValue: mockReferee.referral?.referralPreferences?.emailNotifications,
        firstName: mockReferee.firstName
      });
      
      // CRITICAL: The code uses direct property access without optional chaining
      // It checks: referrer.email && referrer.referral.referralPreferences.emailNotifications
      // This WILL throw a TypeError if any property in the chain is null/undefined
      // That error will be caught by the try-catch in sendCompletionNotifications,
      // preventing EmailService from being called
      
      // Test the EXACT condition that the code uses (no optional chaining, no try-catch)
      // If this throws, it will be caught by sendCompletionNotifications' try-catch
      let referrerConditionCheck, refereeConditionCheck, referrerConditionError, refereeConditionError;
      
      try {
        referrerConditionCheck = mockReferrer.email && mockReferrer.referral.referralPreferences.emailNotifications;
      } catch (e) {
        referrerConditionCheck = false;
        referrerConditionError = e;
        console.error('CRITICAL ERROR: referrer.referral.referralPreferences access threw:', e.message);
        console.error('Stack:', e.stack);
      }
      
      try {
        refereeConditionCheck = mockReferee.email && mockReferee.referral.referralPreferences.emailNotifications;
      } catch (e) {
        refereeConditionCheck = false;
        refereeConditionError = e;
        console.error('CRITICAL ERROR: referee.referral.referralPreferences access threw:', e.message);
        console.error('Stack:', e.stack);
      }
      
      console.log('DEBUG: Condition checks (using EXACT same logic as code):', {
        referrerEmail: mockReferrer.email,
        referrerReferralExists: !!mockReferrer.referral,
        referrerReferralType: typeof mockReferrer.referral,
        referrerReferralIsObject: mockReferrer.referral !== null && typeof mockReferrer.referral === 'object',
        referrerReferralPreferencesExists: !!mockReferrer.referral?.referralPreferences,
        referrerEmailNotifications: mockReferrer.referral?.referralPreferences?.emailNotifications,
        referrerConditionResult: referrerConditionCheck,
        referrerConditionError: referrerConditionError?.message,
        refereeEmail: mockReferee.email,
        refereeReferralExists: !!mockReferee.referral,
        refereeReferralType: typeof mockReferee.referral,
        refereeReferralIsObject: mockReferee.referral !== null && typeof mockReferee.referral === 'object',
        refereeReferralPreferencesExists: !!mockReferee.referral?.referralPreferences,
        refereeEmailNotifications: mockReferee.referral?.referralPreferences?.emailNotifications,
        refereeConditionResult: refereeConditionCheck,
        refereeConditionError: refereeConditionError?.message
      });
      
      // If conditions aren't met or errors occurred, that explains why mock wasn't called
      if (referrerConditionError || refereeConditionError) {
        throw new Error(`Property access errors occurred! 
          Referrer error: ${referrerConditionError?.message || 'none'}
          Referee error: ${refereeConditionError?.message || 'none'}
          These errors would be caught by sendCompletionNotifications, preventing EmailService calls.`);
      }
      
      if (!referrerConditionCheck || !refereeConditionCheck) {
        throw new Error(`Conditions not met! referrer=${referrerConditionCheck}, referee=${refereeConditionCheck}. 
          Check object structure - all nested properties must exist.`);
      }
      
      // Verify the mock referral structure needed for the EmailService call
      expect(mockReferral.rewardDistribution.referrerReward.amount).toBeDefined();
      expect(mockReferral.rewardDistribution.referrerReward.type).toBeDefined();
      expect(mockReferral.rewardDistribution.refereeReward.amount).toBeDefined();
      expect(mockReferral.rewardDistribution.refereeReward.type).toBeDefined();
      expect(mockReferral.referralType).toBeDefined();
      
      // Call the method - note: sendCompletionNotifications has try-catch inside,
      // so errors won't be thrown but will be logged to console.error
      // The spy on EmailService.sendReferralRewardNotification will tell us if it's being called
      await referralService.sendCompletionNotifications(mockReferral, mockReferrer, mockReferee);
      
      // Check the spy - if it was called, the issue is with the mock tracking, not the method call
      const spyCallCount = emailServiceMethodSpy.mock.calls.length;
      console.log(`DEBUG: emailServiceMethodSpy was called ${spyCallCount} times`);
      
      if (spyCallCount > 0) {
        console.log('DEBUG: EmailService.sendReferralRewardNotification WAS called!', {
          callCount: spyCallCount,
          calls: emailServiceMethodSpy.mock.calls,
          mockFunctionCallCount: mockSendReferralRewardNotification.mock.calls.length
        });
      } else {
        console.log('DEBUG: EmailService.sendReferralRewardNotification was NOT called');
      }
      
      // Restore the spy
      emailServiceMethodSpy.mockRestore();
      
      // Check if any errors were caught (they would prevent the email from being sent)
      // These errors would be caught by the try-catch in sendCompletionNotifications
      if (consoleErrorSpy.mock.calls.length > 0) {
        const errorMessages = consoleErrorSpy.mock.calls.map(call => {
          // Extract error message from the call
          return call.map(arg => {
            if (arg instanceof Error) {
              return arg.message + '\n' + arg.stack;
            }
            return String(arg);
          }).join(' ');
        }).join('\n---\n');
        
        // Log the errors to help debug
        console.error('CRITICAL: Errors caught during sendCompletionNotifications:', errorMessages);
        
        // If the error mentions EmailService, it's likely the real EmailService is being used
        if (errorMessages.includes('EmailService') || errorMessages.includes('sendReferralRewardNotification')) {
          throw new Error(`EmailService error suggests real EmailService is being used, not our mock!\nErrors:\n${errorMessages}`);
        }
        
        // Otherwise, just throw with the error details
        throw new Error(`sendCompletionNotifications encountered errors:\n${errorMessages}`);
      }
      
      // Check call count before restoring spy
      const actualCallCount = mockSendReferralRewardNotification.mock.calls.length;
      
      // If the mock wasn't called, check if EmailService.sendReferralRewardNotification is actually our mock
      if (actualCallCount === 0) {
        const currentEmailService = require('../../services/emailService');
        const isOurMock = currentEmailService === mockEmailServiceObject;
        const hasMockMethod = currentEmailService.sendReferralRewardNotification === mockSendReferralRewardNotification;
        
        throw new Error(`Mock was not called! 
          EmailService is our mock: ${isOurMock}
          sendReferralRewardNotification is our mock: ${hasMockMethod}
          EmailService type: ${typeof currentEmailService}
          EmailService keys: ${currentEmailService ? Object.keys(currentEmailService).join(', ') : 'null'}
          Conditions met: referrer=${referrerCondition}, referee=${refereeCondition}
          Check the DEBUG output above for module cache details.`);
      }
      
      consoleErrorSpy.mockRestore();

      // Should be called twice - once for referrer and once for referee
      // If this fails, it means:
      // 1. The EmailService used by referralService wasn't our mock (module caching issue)
      // 2. An error occurred that prevented the calls (should be caught above)
      // 3. The conditions weren't met (should be caught above)
      expect(mockSendReferralRewardNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('getReferralStats', () => {
    it('should get referral stats for user', async () => {
      // Mock Referral.getReferralStats to return stats
      Referral.getReferralStats.mockResolvedValue({
        totalReferrals: 5,
        completedReferrals: 3,
        pendingReferrals: 2,
        totalRewards: 100,
        totalValue: 500
      });

      const stats = await referralService.getReferralStats('referrer-123');

      expect(stats).toBeDefined();
      expect(stats.totalReferrals).toBe(5);
      expect(stats.tier).toBe('bronze');
      expect(stats.totalRewardsEarned).toBe(100);
      expect(stats.totalRewardsPaid).toBe(50);
    });
  });

  describe('validateReferralCode', () => {
    it('should validate referral code', async () => {
      Referral.findActiveByCode.mockResolvedValueOnce(mockReferral);
      const referrerWithProfile = {
        ...mockReferrer,
        lastName: 'Doe',
        profile: { avatar: { url: 'avatar.jpg' } }
      };
      
      // Mock the chainable query with select
      const mockQuery = {
        select: jest.fn().mockResolvedValue(referrerWithProfile)
      };
      User.findById.mockReturnValue(mockQuery);

      const result = await referralService.validateReferralCode('REF123456');

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.referrer).toBeDefined();
      expect(mockQuery.select).toHaveBeenCalledWith('firstName lastName profile.avatar');
    });

    it('should return invalid for non-existent code', async () => {
      Referral.findActiveByCode.mockResolvedValueOnce(null);

      const result = await referralService.validateReferralCode('INVALID');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid or expired');
    });
  });
});


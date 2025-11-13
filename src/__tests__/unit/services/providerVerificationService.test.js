const Provider = require('../../../models/Provider');

jest.mock('../../../models/Provider');
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}));
jest.mock('../../../utils/auditLogger', () => ({
  auditLogger: {
    logUser: jest.fn()
  }
}));

// Import service after mocks (it's exported as an instance)
const service = require('../../../services/providerVerificationService');

describe('ProviderVerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with onboarding steps', () => {
      expect(service.onboardingSteps).toBeDefined();
      expect(service.onboardingSteps.length).toBeGreaterThan(0);
    });

    test('should initialize with verification requirements', () => {
      expect(service.verificationRequirements).toBeDefined();
      expect(service.verificationRequirements.individual).toBeDefined();
      expect(service.verificationRequirements.business).toBeDefined();
    });
  });

  describe('getOnboardingProgress', () => {
    test('should return default progress when provider not found', async () => {
      Provider.findOne = jest.fn().mockResolvedValue(null);

      const result = await service.getOnboardingProgress('user123');

      expect(result.completed).toBe(false);
      expect(result.progress).toBe(0);
    });

    test('should return progress for existing provider', async () => {
      Provider.findOne = jest.fn().mockResolvedValue({
        _id: 'provider123',
        userId: 'user123',
        onboarding: {
          completed: false,
          progress: 50,
          steps: [
            { step: 'profile_setup', completed: true, completedAt: new Date() }
          ]
        }
      });

      const result = await service.getOnboardingProgress('user123');

      expect(result).toBeDefined();
      expect(result.completed).toBe(false);
      expect(result.progress).toBe(50);
    });
  });
});


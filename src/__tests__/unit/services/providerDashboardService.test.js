const Provider = require('../../../models/Provider');

jest.mock('../../../models/Provider');
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Import service after mocks (it's exported as an instance)
const service = require('../../../services/providerDashboardService');

describe('ProviderDashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with timeframes', () => {
      expect(service.timeframes).toBeDefined();
      expect(service.timeframes['7d']).toBe(7 * 24 * 60 * 60 * 1000);
      expect(service.timeframes['30d']).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('getDashboardData', () => {
    test('should throw error when provider not found', async () => {
      Provider.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.getDashboardData('user123')).rejects.toThrow('Provider profile not found');
    });

    test('should get dashboard data for existing provider', async () => {
      Provider.findOne = jest.fn().mockResolvedValue({
        _id: 'provider123',
        userId: 'user123'
      });
      
      service.getOverviewData = jest.fn().mockResolvedValue({});
      service.getEarningsData = jest.fn().mockResolvedValue({});
      service.getPerformanceData = jest.fn().mockResolvedValue({});
      service.getRecentActivity = jest.fn().mockResolvedValue([]);
      service.getNotifications = jest.fn().mockResolvedValue([]);
      service.getTrendsData = jest.fn().mockResolvedValue({});

      const result = await service.getDashboardData('user123');

      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
    });
  });
});


// Mock cloudinary before requiring the config
jest.mock('cloudinary', () => {
  const mockUrl = jest.fn((publicId, _options) => {
    return `https://res.cloudinary.com/test-cloud/image/upload/${publicId}`;
  });

  return {
    v2: {
      config: jest.fn(() => ({
        cloud_name: 'test-cloud',
        api_key: 'test-key',
        api_secret: 'test-secret'
      })),
      uploader: {
        destroy: jest.fn(),
        upload: jest.fn()
      },
      api: {
        resource: jest.fn()
      },
      url: mockUrl
    }
  };
});

jest.mock('multer-storage-cloudinary', () => {
  return class MockCloudinaryStorage {
    constructor(options) {
      this.params = options.params;
    }
  };
});

const { cloudinary, uploaders, cloudinaryUtils, storageConfigs } = require('../../../config/cloudinary');

describe('Cloudinary Configuration', () => {
  describe('Cloudinary Instance', () => {
    test('should export cloudinary instance', () => {
      expect(cloudinary).toBeDefined();
      expect(typeof cloudinary.config).toBe('function');
    });

    test('should be configured with environment variables', () => {
      const config = cloudinary.config();
      expect(config).toBeDefined();
    });
  });

  describe('Storage Configurations', () => {
    test('should export storageConfigs object', () => {
      expect(storageConfigs).toBeDefined();
      expect(typeof storageConfigs).toBe('object');
    });

    test('should have all required storage configurations', () => {
      const expectedStorages = [
        'userProfiles',
        'marketplace',
        'academy',
        'facilityCare',
        'rentals',
        'supplies',
        'ads',
        'trustVerification',
        'communication',
        'finance',
        'analytics',
        'localproPlus',
        'jobs'
      ];

      expectedStorages.forEach(storage => {
        expect(storageConfigs[storage]).toBeDefined();
      });
    });

    test('should have correct folder paths for each storage', () => {
      expect(storageConfigs.userProfiles.params.folder).toBe('localpro/users/profiles');
      expect(storageConfigs.marketplace.params.folder).toBe('localpro/marketplace');
      expect(storageConfigs.communication.params.folder).toBe('localpro/communication');
    });
  });

  describe('Uploaders', () => {
    test('should export uploaders object', () => {
      expect(uploaders).toBeDefined();
      expect(typeof uploaders).toBe('object');
    });

    test('should have uploader for each storage configuration', () => {
      Object.keys(storageConfigs).forEach(key => {
        expect(uploaders[key]).toBeDefined();
        expect(typeof uploaders[key].single).toBe('function');
        expect(typeof uploaders[key].array).toBe('function');
      });
    });

    test('should have correct file size limits', () => {
      const uploader = uploaders.marketplace;
      expect(uploader.limits.fileSize).toBe(10 * 1024 * 1024); // 10MB
      expect(uploader.limits.files).toBe(5);
    });
  });

  describe('Cloudinary Utils', () => {
    test('should export cloudinaryUtils object', () => {
      expect(cloudinaryUtils).toBeDefined();
      expect(typeof cloudinaryUtils).toBe('object');
    });

    test('should have deleteFile function', () => {
      expect(typeof cloudinaryUtils.deleteFile).toBe('function');
    });

    test('should have getFileInfo function', () => {
      expect(typeof cloudinaryUtils.getFileInfo).toBe('function');
    });

    test('should have transformUrl function', () => {
      expect(typeof cloudinaryUtils.transformUrl).toBe('function');
    });

    test('should have generateResponsiveUrls function', () => {
      expect(typeof cloudinaryUtils.generateResponsiveUrls).toBe('function');
    });

    describe('transformUrl', () => {
      test('should generate URL from public_id', () => {
        const publicId = 'test/image';
        const url = cloudinaryUtils.transformUrl(publicId);
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
      });

      test('should accept transformations parameter', () => {
        const publicId = 'test/image';
        const url = cloudinaryUtils.transformUrl(publicId, { width: 200, height: 200 });
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
      });
    });

    describe('generateResponsiveUrls', () => {
      test('should generate responsive URLs with default widths', () => {
        const publicId = 'test/image';
        const urls = cloudinaryUtils.generateResponsiveUrls(publicId);
        
        expect(Array.isArray(urls)).toBe(true);
        expect(urls.length).toBe(4); // Default widths: [320, 640, 1024, 1920]
        expect(urls[0]).toHaveProperty('width');
        expect(urls[0]).toHaveProperty('url');
      });

      test('should generate responsive URLs with custom widths', () => {
        const publicId = 'test/image';
        const customWidths = [100, 200, 300];
        const urls = cloudinaryUtils.generateResponsiveUrls(publicId, customWidths);
        
        expect(Array.isArray(urls)).toBe(true);
        expect(urls.length).toBe(3);
        urls.forEach((urlObj, index) => {
          expect(urlObj.width).toBe(customWidths[index]);
          expect(urlObj.url).toBeDefined();
        });
      });
    });
  });
});


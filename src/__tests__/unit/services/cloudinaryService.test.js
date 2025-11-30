jest.mock('cloudinary', () => {
  const mockUploader = {
    upload: jest.fn(),
    destroy: jest.fn()
  };
  
  const mockV2 = {
    config: jest.fn(),
    uploader: mockUploader
  };
  
  return {
    v2: mockV2
  };
});

// Import after mocking cloudinary
const cloudinary = require('cloudinary');

// Import service after mocks (it's exported as an instance)
const cloudinaryService = require('../../../services/cloudinaryService');

describe('CloudinaryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    test('should return error when no file provided', async () => {
      const result = await cloudinaryService.uploadFile(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No file provided');
    });

    test('should upload file from buffer', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
        originalname: 'test.png'
      };

      cloudinary.v2.uploader.upload.mockResolvedValue({
        public_id: 'test-id',
        secure_url: 'https://example.com/image.jpg',
        url: 'https://example.com/image.jpg'
      });

      const result = await cloudinaryService.uploadFile(mockFile, 'test-folder');
      
      expect(result.success).toBe(true);
      expect(cloudinary.v2.uploader.upload).toHaveBeenCalled();
    });

    test('should upload file from path', async () => {
      const mockFile = {
        path: '/tmp/test.png',
        originalname: 'test.png'
      };

      cloudinary.v2.uploader.upload.mockResolvedValue({
        public_id: 'test-id',
        secure_url: 'https://example.com/image.jpg'
      });

      const result = await cloudinaryService.uploadFile(mockFile);
      
      expect(result.success).toBe(true);
    });
  });

  describe('deleteFile', () => {
    test('should delete file by public ID', async () => {
      cloudinary.v2.uploader.destroy.mockResolvedValue({ result: 'ok' });

      const result = await cloudinaryService.deleteFile('test-public-id');
      
      expect(result.success).toBe(true);
      expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('test-public-id', {});
    });
  });
});


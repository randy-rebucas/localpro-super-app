const {
  validateObjectIdParam,
  validateMultipleObjectIds,
  validatePaginationParams,
  validateSearchParams,
  validateFileUpload,
  validateDateRange
} = require('../../../middleware/routeValidation');
const { validateObjectId } = require('../../../utils/controllerValidation');
const { sendValidationError } = require('../../../utils/responseHelper');

jest.mock('../../../utils/controllerValidation');
jest.mock('../../../utils/responseHelper');

describe('Route Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      file: null,
      files: null
    };
    res = {};
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateObjectIdParam', () => {
    test('should call next if ObjectId is valid', () => {
      req.params.id = '507f1f77bcf86cd799439011';
      validateObjectId.mockReturnValue(true);
      const middleware = validateObjectIdParam('id');

      middleware(req, res, next);

      expect(validateObjectId).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(next).toHaveBeenCalled();
    });

    test('should return validation error if ObjectId is invalid', () => {
      req.params.id = 'invalid-id';
      validateObjectId.mockReturnValue(false);
      const middleware = validateObjectIdParam('id');

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalledWith(res, [{
        field: 'id',
        message: 'Invalid id format. Must be a valid MongoDB ObjectId (24 hexadecimal characters)',
        code: 'INVALID_ID_FORMAT',
        received: 'invalid-id',
        expectedFormat: '24 hexadecimal characters (e.g., 507f1f77bcf86cd799439011)'
      }]);
      expect(next).not.toHaveBeenCalled();
    });

    test('should use custom param name', () => {
      req.params.userId = '507f1f77bcf86cd799439011';
      validateObjectId.mockReturnValue(true);
      const middleware = validateObjectIdParam('userId');

      middleware(req, res, next);

      expect(validateObjectId).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateMultipleObjectIds', () => {
    test('should call next if all ObjectIds are valid', () => {
      req.params = {
        id: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012'
      };
      validateObjectId.mockReturnValue(true);
      const middleware = validateMultipleObjectIds(['id', 'userId']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should return validation error if any ObjectId is invalid', () => {
      req.params = {
        id: '507f1f77bcf86cd799439011',
        userId: 'invalid-id'
      };
      validateObjectId
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      const middleware = validateMultipleObjectIds(['id', 'userId']);

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should skip validation if param is missing', () => {
      req.params = {
        id: '507f1f77bcf86cd799439011'
      };
      validateObjectId.mockReturnValue(true);
      const middleware = validateMultipleObjectIds(['id', 'userId']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validatePaginationParams', () => {
    test('should call next if pagination params are valid', () => {
      req.query = { page: '1', limit: '10' };
      const middleware = validatePaginationParams;

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should return error if page is invalid', () => {
      req.query = { page: '0', limit: '10' };
      const middleware = validatePaginationParams;

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error if limit is too large', () => {
      req.query = { page: '1', limit: '200' };
      const middleware = validatePaginationParams;

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should use default values if params are missing', () => {
      req.query = {};
      const middleware = validatePaginationParams;

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateSearchParams', () => {
    test('should call next if search params are valid', () => {
      req.query = { search: 'test query' };
      const middleware = validateSearchParams;

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should return error if search term is too short', () => {
      req.query = { search: 'a' };
      const middleware = validateSearchParams;

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error if category is not a string', () => {
      req.query = { category: 123 };
      const middleware = validateSearchParams;

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow missing search params', () => {
      req.query = {};
      const middleware = validateSearchParams;

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateFileUpload', () => {
    test('should call next if file is valid', () => {
      req.file = {
        size: 1024 * 1024, // 1MB
        mimetype: 'image/jpeg'
      };
      const middleware = validateFileUpload();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should return error if no file uploaded', () => {
      req.file = null;
      req.files = null;
      const middleware = validateFileUpload();

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error if file is too large', () => {
      req.file = {
        size: 10 * 1024 * 1024, // 10MB
        mimetype: 'image/jpeg'
      };
      const middleware = validateFileUpload({ maxSize: 5 * 1024 * 1024 });

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error if file type is not allowed', () => {
      req.file = {
        size: 1024 * 1024,
        mimetype: 'application/pdf'
      };
      const middleware = validateFileUpload({ allowedTypes: ['image/jpeg'] });

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should validate multiple files', () => {
      req.files = [
        { size: 1024 * 1024, mimetype: 'image/jpeg' },
        { size: 1024 * 1024, mimetype: 'image/png' }
      ];
      const middleware = validateFileUpload();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateDateRange', () => {
    test('should call next if date range is valid', () => {
      req.query = {
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };
      const middleware = validateDateRange;

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should return error if start date is invalid', () => {
      req.query = {
        startDate: 'invalid-date',
        endDate: '2023-12-31'
      };
      const middleware = validateDateRange;

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error if end date is invalid', () => {
      req.query = {
        startDate: '2023-01-01',
        endDate: 'invalid-date'
      };
      const middleware = validateDateRange;

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error if start date is after end date', () => {
      req.query = {
        startDate: '2023-12-31',
        endDate: '2023-01-01'
      };
      const middleware = validateDateRange;

      middleware(req, res, next);

      expect(sendValidationError).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow missing date params', () => {
      req.query = {};
      const middleware = validateDateRange;

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});


const mongoose = require('mongoose');
const connectDB = require('../../../config/database');

// Mock mongoose
jest.mock('mongoose');

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_USER;
    delete process.env.MONGODB_PASSWORD;
    delete process.env.MONGODB_MAX_POOL_SIZE;
    delete process.env.MONGODB_MIN_POOL_SIZE;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('connectDB function', () => {
    let originalExit;

    beforeEach(() => {
      originalExit = process.exit;
      process.exit = jest.fn();
    });

    afterEach(() => {
      process.exit = originalExit;
    });

    test('should be a function', () => {
      expect(typeof connectDB).toBe('function');
    });

    test('should use default MongoDB URI if not provided', async () => {
      mongoose.connect.mockResolvedValue({
        connection: {
          host: 'localhost',
          port: 27017,
          name: 'localpro-super-app'
        }
      });

      // Mock console methods to avoid output during tests
      const originalLog = console.log;
      const originalError = console.error;
      console.log = jest.fn();
      console.error = jest.fn();

      try {
        await connectDB();
      } catch (error) {
        // Expected to fail without actual MongoDB connection
      }

      expect(mongoose.connect).toHaveBeenCalled();
      const callArgs = mongoose.connect.mock.calls[0];
      expect(callArgs[0]).toBe('mongodb://localhost:27017/localpro-super-app');

      console.log = originalLog;
      console.error = originalError;
    });

    test('should use MONGODB_URI from environment', async () => {
      const testUri = 'mongodb://test:27017/test-db';
      process.env.MONGODB_URI = testUri;

      mongoose.connect.mockResolvedValue({
        connection: {
          host: 'test',
          port: 27017,
          name: 'test-db'
        }
      });

      const originalLog = console.log;
      const originalError = console.error;
      console.log = jest.fn();
      console.error = jest.fn();

      try {
        await connectDB();
      } catch (error) {
        // Expected to fail without actual MongoDB connection
      }

      expect(mongoose.connect).toHaveBeenCalled();
      const callArgs = mongoose.connect.mock.calls[0];
      expect(callArgs[0]).toBe(testUri);

      console.log = originalLog;
      console.error = originalError;
    });

    test('should configure connection options correctly', async () => {
      mongoose.connect.mockResolvedValue({
        connection: {
          host: 'localhost',
          port: 27017,
          name: 'test'
        }
      });

      const originalLog = console.log;
      const originalError = console.error;
      console.log = jest.fn();
      console.error = jest.fn();

      try {
        await connectDB();
      } catch (error) {
        // Expected to fail without actual MongoDB connection
      }

      expect(mongoose.connect).toHaveBeenCalled();
      const callArgs = mongoose.connect.mock.calls[0];
      const options = callArgs[1];

      expect(options).toHaveProperty('maxPoolSize');
      expect(options).toHaveProperty('minPoolSize');
      expect(options).toHaveProperty('retryWrites', true);
      expect(options).toHaveProperty('retryReads', true);
      expect(options).toHaveProperty('writeConcern');
      expect(options).toHaveProperty('readPreference', 'primaryPreferred');

      console.log = originalLog;
      console.error = originalError;
    });

    test('should add authentication if MONGODB_USER and MONGODB_PASSWORD are provided', async () => {
      process.env.MONGODB_USER = 'testuser';
      process.env.MONGODB_PASSWORD = 'testpass';

      mongoose.connect.mockResolvedValue({
        connection: {
          host: 'localhost',
          port: 27017,
          name: 'test'
        }
      });

      const originalLog = console.log;
      const originalError = console.error;
      console.log = jest.fn();
      console.error = jest.fn();

      try {
        await connectDB();
      } catch (error) {
        // Expected to fail without actual MongoDB connection
      }

      expect(mongoose.connect).toHaveBeenCalled();
      const callArgs = mongoose.connect.mock.calls[0];
      const options = callArgs[1];

      expect(options.auth).toBeDefined();
      expect(options.auth.username).toBe('testuser');
      expect(options.auth.password).toBe('testpass');

      console.log = originalLog;
      console.error = originalError;
    });

    test('should enable TLS in production environment', async () => {
      process.env.NODE_ENV = 'production';

      mongoose.connect.mockResolvedValue({
        connection: {
          host: 'localhost',
          port: 27017,
          name: 'test'
        }
      });

      const originalLog = console.log;
      const originalError = console.error;
      console.log = jest.fn();
      console.error = jest.fn();

      try {
        await connectDB();
      } catch (error) {
        // Expected to fail without actual MongoDB connection
      }

      expect(mongoose.connect).toHaveBeenCalled();
      const callArgs = mongoose.connect.mock.calls[0];
      const options = callArgs[1];

      expect(options.tls).toBe(true);

      console.log = originalLog;
      console.error = originalError;
    });

    test('should set up connection event listeners', async () => {
      // Mock mongoose.connection with event listener methods
      mongoose.connection = {
        on: jest.fn(),
        host: 'localhost',
        port: 27017,
        name: 'test'
      };

      mongoose.connect.mockResolvedValue({
        connection: mongoose.connection
      });

      const originalLog = console.log;
      const originalError = console.error;
      console.log = jest.fn();
      console.error = jest.fn();

      try {
        await connectDB();
      } catch (error) {
        // Expected to fail without actual MongoDB connection
      }

      // Verify connection object exists and event listeners were set up
      expect(mongoose.connection).toBeDefined();
      expect(mongoose.connection.on).toHaveBeenCalled();

      console.log = originalLog;
      console.error = originalError;
    });

    test('should handle connection errors gracefully', async () => {
      const testError = new Error('Connection failed');
      mongoose.connect.mockRejectedValue(testError);

      const originalError = console.error;
      console.error = jest.fn();

      try {
        await connectDB();
      } catch (error) {
        expect(error).toBe(testError);
      }

      expect(console.error).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(1);

      console.error = originalError;
    });
  });
});


module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/tests/**',
    '!src/seeders/**',
    '!src/templates/**'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/config/databaseTransport$': '<rootDir>/tests/__mocks__/databaseTransport.js',
    '^\.\/databaseTransport$': '<rootDir>/tests/__mocks__/databaseTransport.js',
    '^src/services/auditService$': '<rootDir>/tests/__mocks__/auditService.js',
    '^\.\/services\/auditService$': '<rootDir>/tests/__mocks__/auditService.js',
    '^\.\.\/services\/auditService$': '<rootDir>/tests/__mocks__/auditService.js',
    '^src/middleware/auditLogger$': '<rootDir>/tests/__mocks__/auditLogger.js',
    '^\.\/middleware\/auditLogger$': '<rootDir>/tests/__mocks__/auditLogger.js',
    '^src/config/logger$': '<rootDir>/tests/__mocks__/logger.js',
    '^\.\/config\/logger$': '<rootDir>/tests/__mocks__/logger.js',
    '^\.\.\/config\/logger$': '<rootDir>/tests/__mocks__/logger.js',
    '^src/services/databasePerformanceMonitor$': '<rootDir>/tests/__mocks__/noop.js',
    '^\.\/services\/databasePerformanceMonitor$': '<rootDir>/tests/__mocks__/noop.js',
    '^\.\.\/services\/databasePerformanceMonitor$': '<rootDir>/tests/__mocks__/noop.js',
    '^src/routes/metricsStream$': '<rootDir>/tests/__mocks__/noop.js',
    '^\.\/routes\/metricsStream$': '<rootDir>/tests/__mocks__/noop.js',
    '^\.\.\/routes\/metricsStream$': '<rootDir>/tests/__mocks__/noop.js'
  },
  
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/logs/',
    '/template-output/'
  ],
  
  // Global variables
  globals: {
    NODE_ENV: 'test'
  },
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true
};
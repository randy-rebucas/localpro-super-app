/**
 * Logger Mock
 * Prevents database transport initialization in tests
 */

module.exports = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  silly: jest.fn(),
  stream: {
    write: jest.fn()
  },
  log: jest.fn(),
  query: jest.fn(),
  startTimer: jest.fn()
};


// Mock Mongoose models and methods
const mockModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  save: jest.fn(),
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis()
};

// Mock Schema
const mockSchema = {
  virtual: jest.fn().mockReturnThis(),
  get: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  index: jest.fn().mockReturnThis(),
  statics: {},
  methods: {},
  pre: jest.fn().mockReturnThis(),
  post: jest.fn().mockReturnThis(),
  Types: {
    ObjectId: 'ObjectId',
    Mixed: 'Mixed',
    String: 'String',
    Number: 'Number',
    Date: 'Date',
    Boolean: 'Boolean',
    Array: 'Array'
  }
};

// Mock connection
const mockConnection = {
  readyState: 1,
  host: 'localhost',
  port: 27017,
  name: 'test-db'
};

module.exports = {
  connect: jest.fn().mockResolvedValue({ connection: mockConnection }),
  disconnect: jest.fn().mockResolvedValue(),
  connection: mockConnection,
  Schema: jest.fn().mockImplementation(() => mockSchema),
  model: jest.fn().mockImplementation(() => mockModel),
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => ({ toString: () => id || 'mock-id' }))
  }
};

// Add Schema.Types to the main export
module.exports.Schema.Types = mockSchema.Types;

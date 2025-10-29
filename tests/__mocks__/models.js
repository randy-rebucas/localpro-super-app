// Mock all models
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

// User model
const User = { ...mockModel };
const Agency = { ...mockModel };
const Payment = { ...mockModel };
const UserSubscription = { ...mockModel };
const Transaction = { ...mockModel };
const Booking = { ...mockModel };
const Order = { ...mockModel };

// LocalProPlus models
const LocalProPlus = {
  Payment,
  UserSubscription
};

// Finance models
const Finance = {
  Transaction
};

// Marketplace models
const Marketplace = {
  Booking
};

// Supplies models
const Supplies = {
  Order
};

module.exports = {
  User,
  Agency,
  LocalProPlus,
  Finance,
  Marketplace,
  Supplies
};

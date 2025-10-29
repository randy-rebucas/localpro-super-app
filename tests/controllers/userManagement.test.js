const userManagementController = require('../../src/controllers/userManagementController');
const User = require('../../src/models/User');

describe('User Management Controller', () => {
  let req, res;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should get all users with default pagination', async () => {
      const mockUsers = [
        createMockUser({ _id: 'user-1', firstName: 'John', lastName: 'Doe' }),
        createMockUser({ _id: 'user-2', firstName: 'Jane', lastName: 'Smith' })
      ];

      // Mock the query chain
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers)
      };
      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(2);

      await userManagementController.getAllUsers(req, res);

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          users: mockUsers,
          pagination: {
            current: 1,
            pages: 1,
            total: 2,
            limit: 10
          }
        }
      });
    });

    it('should filter users by role', async () => {
      req.query = { role: 'provider' };
      const mockUsers = [createMockUser({ role: 'provider' })];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers)
      };
      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(1);

      await userManagementController.getAllUsers(req, res);

      expect(User.find).toHaveBeenCalledWith({ role: 'provider' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should search users by name or email', async () => {
      req.query = { search: 'john' };
      const mockUsers = [createMockUser({ firstName: 'John' })];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers)
      };
      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(1);

      await userManagementController.getAllUsers(req, res);

      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { firstName: { $regex: 'john', $options: 'i' } },
          { lastName: { $regex: 'john', $options: 'i' } },
          { email: { $regex: 'john', $options: 'i' } },
          { phoneNumber: { $regex: 'john', $options: 'i' } },
          { 'profile.businessName': { $regex: 'john', $options: 'i' } }
        ]
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      User.find.mockReturnValue(mockQuery);

      await userManagementController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      req.params = { id: 'user-id' };
      req.user = { id: 'user-id', role: 'admin' };
      const mockUser = createMockUser({ _id: 'user-id' });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser)
      };
      User.findById.mockReturnValue(mockQuery);

      await userManagementController.getUserById(req, res);

      expect(User.findById).toHaveBeenCalledWith('user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should return 404 if user not found', async () => {
      req.params = { id: 'non-existent-id' };
      req.user = { id: 'user-id', role: 'admin' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      };
      User.findById.mockReturnValue(mockQuery);

      await userManagementController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      req.params = { id: 'user-id' };
      req.body = {
        firstName: 'John Updated',
        lastName: 'Doe Updated'
      };

      const mockUser = createMockUser({ _id: 'user-id' });
      User.findById.mockResolvedValue(mockUser);
      mockUser.save.mockResolvedValue();

      await userManagementController.updateUser(req, res);

      expect(mockUser.firstName).toBe('John Updated');
      expect(mockUser.lastName).toBe('Doe Updated');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle role updates with validation', async () => {
      req.params = { id: 'user-id' };
      req.body = { role: 'provider' };

      const mockUser = createMockUser({ _id: 'user-id', role: 'client' });
      User.findById.mockResolvedValue(mockUser);
      mockUser.save.mockResolvedValue();

      await userManagementController.updateUser(req, res);

      expect(mockUser.role).toBe('provider');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle validation errors', async () => {
      req.params = { id: 'user-id' };
      req.body = { email: 'invalid-email' };

      const mockUser = createMockUser({ _id: 'user-id' });
      User.findById.mockResolvedValue(mockUser);
      mockUser.save.mockRejectedValue(new Error('Validation error'));

      await userManagementController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error'
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      req.params = { id: 'user-id' };
      const mockUser = createMockUser({ _id: 'user-id', role: 'client' });

      User.findById.mockResolvedValue(mockUser);
      mockUser.remove.mockResolvedValue();

      await userManagementController.deleteUser(req, res);

      expect(mockUser.remove).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully'
      });
    });

    it('should prevent deletion of admin users', async () => {
      req.params = { id: 'admin-id' };
      const mockUser = createMockUser({ _id: 'admin-id', role: 'admin' });

      User.findById.mockResolvedValue(mockUser);

      await userManagementController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot delete admin users'
      });
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        role: 'client'
      };

      req.body = userData;

      const mockUser = createMockUser(userData);
      User.create.mockResolvedValue(mockUser);

      await userManagementController.createUser(req, res);

      expect(User.create).toHaveBeenCalledWith(userData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
        message: 'User created successfully'
      });
    });

    it('should handle duplicate email error', async () => {
      const userData = {
        email: 'existing@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890'
      };

      req.body = userData;

      User.create.mockRejectedValue(new Error('User with this phone number or email already exists'));

      await userManagementController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this phone number or email already exists'
      });
    });

    it('should handle validation errors', async () => {
      const userData = {
        email: 'john@example.com',
        firstName: 'John'
        // Missing lastName and phoneNumber
      };

      req.body = userData;

      await userManagementController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Phone number, first name, and last name are required'
      });
    });
  });
});
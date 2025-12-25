const httpMocks = require('node-mocks-http');

jest.mock('../../models/Communication', () => ({
  Conversation: {},
  Message: {},
  Notification: {
    findOne: jest.fn(),
    findOneAndDelete: jest.fn()
  }
}));

const communicationController = require('../../controllers/communicationController');
const { Notification } = require('../../models/Communication');

describe('communicationController (notifications)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('markNotificationAsRead', () => {
    it('should return 400 when notificationId is missing/invalid', async () => {
      const req = httpMocks.createRequest({
        method: 'PUT',
        params: { notificationId: 'undefined' },
        user: { id: '507f1f77bcf86cd799439011' }
      });
      const res = httpMocks.createResponse();

      await communicationController.markNotificationAsRead(req, res);

      expect(res.statusCode).toBe(400);
      expect(Notification.findOne).not.toHaveBeenCalled();
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Valid notificationId is required/i)
        })
      );
    });
  });

  describe('deleteNotification', () => {
    it('should return 400 when notificationId is missing/invalid', async () => {
      const req = httpMocks.createRequest({
        method: 'DELETE',
        params: { notificationId: 'undefined' },
        user: { id: '507f1f77bcf86cd799439011' }
      });
      const res = httpMocks.createResponse();

      await communicationController.deleteNotification(req, res);

      expect(res.statusCode).toBe(400);
      expect(Notification.findOneAndDelete).not.toHaveBeenCalled();
      expect(res._getJSONData()).toEqual(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Valid notificationId is required/i)
        })
      );
    });
  });
});



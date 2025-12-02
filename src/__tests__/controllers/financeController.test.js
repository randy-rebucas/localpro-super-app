const financeController = require('../../controllers/financeController');
const httpMocks = require('node-mocks-http');

describe('financeController', () => {
  describe('requestTopUp', () => {
    it('should respond with 400 if payload is missing', async () => {
      const req = httpMocks.createRequest({ method: 'POST', body: {} });
      const res = httpMocks.createResponse();
      await financeController.requestTopUp(req, res);
      expect(res.statusCode).toBe(400);
      expect(res._getData()).toMatch(/Amount and payment method are required/);
    });
    // Add more tests for valid payload, error handling, etc.
  });
});

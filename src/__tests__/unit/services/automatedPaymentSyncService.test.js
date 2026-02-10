jest.mock('../../../services/paypalService', () => ({
  getOrder: jest.fn()
}));

jest.mock('../../../services/paymongoService', () => ({
  getPaymentIntent: jest.fn()
}));

jest.mock('../../../models/Marketplace', () => ({
  Booking: {
    find: jest.fn(),
    updateMany: jest.fn()
  }
}));

jest.mock('../../../../features/supplies', () => ({
  Order: {
    find: jest.fn(),
    updateMany: jest.fn()
  }
}));

jest.mock('../../../models/Finance', () => ({
  Transaction: {
    find: jest.fn(),
    updateMany: jest.fn()
  }
}));

jest.mock('../../../models/LocalProPlus', () => ({
  Payment: {
    find: jest.fn(),
    updateMany: jest.fn()
  }
}));

const PayPalService = require('../../../services/paypalService');
const paymongoService = require('../../../services/paymongoService');
const { Booking } = require('../../../models/Marketplace');
const { Order } = require('../../../../features/supplies');
const { Transaction } = require('../../../models/Finance');
const { Payment } = require('../../../models/LocalProPlus');

const { AutomatedPaymentSyncService } = require('../../../services/automatedPaymentSyncService');

describe('AutomatedPaymentSyncService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.PAYPAL_CLIENT_ID = 'test';
    process.env.PAYPAL_CLIENT_SECRET = 'test';
    process.env.PAYMONGO_SECRET_KEY = 'sk_test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('syncPayPal should update Booking/Order/Transaction/Payment when PayPal order is COMPLETED', async () => {
    Booking.find.mockReturnValue({ select: () => ({ lean: async () => ([{ payment: { paypalOrderId: 'ORDER123' }, status: 'pending' }]) }) });
    Order.find.mockReturnValue({ select: () => ({ lean: async () => ([{ payment: { paypalOrderId: 'ORDER123' }, status: 'pending' }]) }) });
    Transaction.find.mockReturnValue({ select: () => ({ lean: async () => ([{ paypalOrderId: 'ORDER123', status: 'pending' }]) }) });
    Payment.find.mockReturnValue({ select: () => ({ lean: async () => ([{ paymentDetails: { paypalOrderId: 'ORDER123' }, status: 'pending' }]) }) });

    Booking.updateMany.mockResolvedValue({ modifiedCount: 1 });
    Order.updateMany.mockResolvedValue({ modifiedCount: 1 });
    Transaction.updateMany.mockResolvedValue({ modifiedCount: 1 });
    Payment.updateMany.mockResolvedValue({ modifiedCount: 1 });

    PayPalService.getOrder.mockResolvedValue({
      success: true,
      data: {
        status: 'COMPLETED',
        purchase_units: [{
          payments: { captures: [{ id: 'CAPTURE123', create_time: new Date().toISOString() }] }
        }]
      }
    });

    const svc = new AutomatedPaymentSyncService();
    const stats = await svc.runOnce({ maxConcurrency: 1 });

    expect(stats.paypal.checked).toBe(1);
    expect(Booking.updateMany).toHaveBeenCalled();
    expect(Order.updateMany).toHaveBeenCalled();
    expect(Transaction.updateMany).toHaveBeenCalled();
    expect(Payment.updateMany).toHaveBeenCalled();
  });

  test('syncPayMongo should update LocalProPlus Payment when intent succeeds', async () => {
    // PayPal finds nothing
    Booking.find.mockReturnValue({ select: () => ({ lean: async () => ([]) }) });
    Order.find.mockReturnValue({ select: () => ({ lean: async () => ([]) }) });
    Transaction.find.mockReturnValue({ select: () => ({ lean: async () => ([]) }) });
    Payment.find
      .mockReturnValueOnce({ select: () => ({ lean: async () => ([]) }) }) // paypal
      .mockReturnValueOnce({ select: () => ({ lean: async () => ([{ paymentDetails: { paymongoIntentId: 'pi_123' }, status: 'pending' }]) }) }); // paymongo

    paymongoService.getPaymentIntent.mockResolvedValue({
      success: true,
      data: {
        attributes: {
          status: 'succeeded',
          charges: { data: [{ id: 'ch_123' }] }
        }
      }
    });
    Payment.updateMany.mockResolvedValue({ modifiedCount: 1 });

    const svc = new AutomatedPaymentSyncService();
    const stats = await svc.runOnce({ maxConcurrency: 1 });

    expect(stats.paymongo.checked).toBe(1);
    expect(Payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ 'paymentDetails.paymongoIntentId': 'pi_123', status: 'pending' }),
      expect.any(Object)
    );
  });
});



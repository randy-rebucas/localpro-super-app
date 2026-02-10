const cron = require('node-cron');
const logger = require('../config/logger');
const PayPalService = require('./paypalService');
const paymongoService = require('./paymongoService');

const { Booking } = require('../models/Marketplace');
const { Order } = require('../../features/supplies');
const { Transaction } = require('../models/Finance');
const { Payment } = require('../models/LocalProPlus');

const DEFAULT_SCHEDULE = '0 * * * *'; // hourly

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function mapPayPalOrderToGenericStatus(orderStatus) {
  // PayPal order statuses commonly: CREATED, SAVED, APPROVED, COMPLETED, VOIDED
  const s = String(orderStatus || '').toUpperCase();
  if (s === 'COMPLETED') return 'completed';
  if (s === 'VOIDED') return 'failed';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'cancelled';
  if (s === 'APPROVED' || s === 'CREATED' || s === 'SAVED') return 'pending';
  return 'pending';
}

function mapGenericToBookingPaymentStatus(generic) {
  if (generic === 'completed') return 'paid';
  if (generic === 'failed') return 'failed';
  if (generic === 'cancelled') return 'failed';
  if (generic === 'refunded') return 'refunded';
  return 'pending';
}

function mapGenericToOrderPaymentStatus(generic) {
  // Supplies order payment schema: pending/paid/failed/refunded
  return mapGenericToBookingPaymentStatus(generic);
}

function mapPayMongoIntentToGenericStatus(intentStatus) {
  const s = String(intentStatus || '').toLowerCase();
  if (s === 'succeeded') return 'completed';
  if (s === 'processing') return 'pending';
  if (s === 'awaiting_payment_method') return 'pending';
  if (s === 'awaiting_next_action') return 'pending';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'failed' || s === 'payment_failed') return 'failed';
  return 'pending';
}

class AutomatedPaymentSyncService {
  constructor() {
    this.isRunning = false;
    this.jobs = [];
  }

  start() {
    if (this.isRunning) {
      logger.warn('Automated payment sync service is already running');
      return;
    }

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.PAYMENT_SYNC_SCHEDULE || DEFAULT_SCHEDULE;
    const maxConcurrency = parseInt(process.env.PAYMENT_SYNC_MAX_CONCURRENCY || '5');

    // Run once shortly after startup (optional)
    if (process.env.PAYMENT_SYNC_ON_STARTUP === 'true') {
      setTimeout(() => {
        this.runOnce({ maxConcurrency }).catch(() => {});
      }, 10_000);
    }

    this.jobs.push(
      cron.schedule(
        schedule,
        async () => {
          await this.runOnce({ maxConcurrency });
        },
        { timezone }
      )
    );

    this.isRunning = true;
    logger.info('Automated payment sync service started', { timezone, schedule, maxConcurrency });
  }

  stop() {
    this.jobs.forEach(j => j.stop());
    this.jobs = [];
    this.isRunning = false;
    logger.info('Automated payment sync service stopped');
  }

  async runOnce({ maxConcurrency = 5 } = {}) {
    const startedAt = Date.now();
    const stats = {
      paypal: { checked: 0, updated: 0, errors: 0 },
      paymongo: { checked: 0, updated: 0, errors: 0 }
    };

    try {
      await this.syncPayPal({ maxConcurrency, stats });
    } catch (e) {
      stats.paypal.errors += 1;
      logger.error('PayPal sync batch failed', e);
    }

    try {
      await this.syncPayMongo({ maxConcurrency, stats });
    } catch (e) {
      stats.paymongo.errors += 1;
      logger.error('PayMongo sync batch failed', e);
    }

    logger.info('Automated payment sync completed', {
      durationMs: Date.now() - startedAt,
      stats
    });

    return stats;
  }

  async syncPayPal({ maxConcurrency, stats }) {
    const canUsePayPal = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
    if (!canUsePayPal) return;

    // Find pending PayPal orders across modules
    const [bookings, orders, transactions, payments] = await Promise.all([
      Booking.find({ 'payment.method': 'paypal', 'payment.status': 'pending', 'payment.paypalOrderId': { $exists: true, $ne: null } })
        .select('_id payment status')
        .lean(),
      Order.find({ 'payment.method': 'paypal', 'payment.status': 'pending', 'payment.paypalOrderId': { $exists: true, $ne: null } })
        .select('_id payment status')
        .lean(),
      Transaction.find({ paymentMethod: 'paypal', status: 'pending', paypalOrderId: { $exists: true, $ne: null } })
        .select('_id paypalOrderId status')
        .lean(),
      Payment.find({ paymentMethod: 'paypal', status: 'pending', 'paymentDetails.paypalOrderId': { $exists: true, $ne: null } })
        .select('_id status paymentDetails processedAt')
        .lean()
    ]);

    const uniqueOrderIds = new Set();
    bookings.forEach(b => uniqueOrderIds.add(b.payment.paypalOrderId));
    orders.forEach(o => uniqueOrderIds.add(o.payment.paypalOrderId));
    transactions.forEach(t => uniqueOrderIds.add(t.paypalOrderId));
    payments.forEach(p => uniqueOrderIds.add(p.paymentDetails?.paypalOrderId));

    const ids = [...uniqueOrderIds].filter(Boolean);
    if (ids.length === 0) return;

    for (const batch of chunk(ids, maxConcurrency)) {
      await Promise.all(
        batch.map(async (orderId) => {
          stats.paypal.checked += 1;
          try {
            const orderRes = await PayPalService.getOrder(orderId);
            if (!orderRes.success) return;

            const order = orderRes.data;
            const generic = mapPayPalOrderToGenericStatus(order.status);

            // capture id (if captured)
            const captureId =
              order.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
              null;
            const captureTime =
              order.purchase_units?.[0]?.payments?.captures?.[0]?.create_time ||
              null;

            // Update Marketplace bookings
            const bookingStatus = mapGenericToBookingPaymentStatus(generic);
            if (bookingStatus !== 'pending') {
              const upd = await Booking.updateMany(
                { 'payment.paypalOrderId': orderId, 'payment.status': 'pending' },
                {
                  $set: {
                    'payment.status': bookingStatus,
                    ...(captureId ? { 'payment.paypalTransactionId': captureId } : {}),
                    ...(captureTime ? { 'payment.paidAt': new Date(captureTime) } : {})
                  }
                }
              );
              if (upd.modifiedCount > 0) stats.paypal.updated += upd.modifiedCount;
            }

            // Update Supplies orders
            const orderPayStatus = mapGenericToOrderPaymentStatus(generic);
            if (orderPayStatus !== 'pending') {
              const upd = await Order.updateMany(
                { 'payment.paypalOrderId': orderId, 'payment.status': 'pending' },
                {
                  $set: {
                    'payment.status': orderPayStatus,
                    ...(captureId ? { 'payment.paypalTransactionId': captureId } : {}),
                    ...(captureTime ? { 'payment.paidAt': new Date(captureTime) } : {}),
                    ...(orderPayStatus === 'paid' ? { status: 'confirmed' } : {})
                  }
                }
              );
              if (upd.modifiedCount > 0) stats.paypal.updated += upd.modifiedCount;
            }

            // Update Finance transactions
            if (generic !== 'pending') {
              const upd = await Transaction.updateMany(
                { paypalOrderId: orderId, status: 'pending' },
                {
                  $set: {
                    status: generic,
                    ...(captureId ? { paypalTransactionId: captureId } : {})
                  }
                }
              );
              if (upd.modifiedCount > 0) stats.paypal.updated += upd.modifiedCount;
            }

            // Update LocalProPlus payments
            if (generic !== 'pending') {
              const upd = await Payment.updateMany(
                { 'paymentDetails.paypalOrderId': orderId, status: 'pending' },
                {
                  $set: {
                    status: generic,
                    processedAt: new Date(),
                    ...(captureId ? { 'paymentDetails.paypalPaymentId': captureId } : {}),
                    ...(captureId ? { 'paymentDetails.transactionId': captureId } : {})
                  }
                }
              );
              if (upd.modifiedCount > 0) stats.paypal.updated += upd.modifiedCount;
            }
          } catch (error) {
            stats.paypal.errors += 1;
            logger.warn('PayPal sync error', { orderId, error: error.message });
          }
        })
      );
    }
  }

  async syncPayMongo({ maxConcurrency, stats }) {
    const canUsePayMongo = !!process.env.PAYMONGO_SECRET_KEY;
    if (!canUsePayMongo) return;

    // LocalProPlus payments pending via PayMongo
    const payments = await Payment.find({
      paymentMethod: 'paymongo',
      status: 'pending',
      'paymentDetails.paymongoIntentId': { $exists: true, $ne: null }
    })
      .select('_id status paymentDetails processedAt')
      .lean();

    const intentIds = [...new Set(payments.map(p => p.paymentDetails?.paymongoIntentId).filter(Boolean))];
    if (intentIds.length === 0) return;

    for (const batch of chunk(intentIds, maxConcurrency)) {
      await Promise.all(
        batch.map(async (intentId) => {
          stats.paymongo.checked += 1;
          try {
            const intentRes = await paymongoService.getPaymentIntent(intentId);
            if (!intentRes.success) return;

            const intent = intentRes.data;
            const intentStatus = intent.attributes?.status;
            const generic = mapPayMongoIntentToGenericStatus(intentStatus);

            if (generic === 'pending') return;

            const chargeId = intent.attributes?.charges?.data?.[0]?.id || null;

            const upd = await Payment.updateMany(
              { 'paymentDetails.paymongoIntentId': intentId, status: 'pending' },
              {
                $set: {
                  status: generic,
                  processedAt: new Date(),
                  ...(chargeId ? { 'paymentDetails.paymongoChargeId': chargeId } : {})
                }
              }
            );
            if (upd.modifiedCount > 0) stats.paymongo.updated += upd.modifiedCount;
          } catch (error) {
            stats.paymongo.errors += 1;
            logger.warn('PayMongo sync error', { intentId, error: error.message });
          }
        })
      );
    }
  }
}

module.exports = {
  AutomatedPaymentSyncService,
  automatedPaymentSyncService: new AutomatedPaymentSyncService()
};



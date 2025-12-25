const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const { Order } = require('../models/Supplies');
const User = require('../models/User');
const { Notification } = require('../models/Communication');

/**
 * Automated Supplies Fulfillment / Delivery Confirmation
 *
 * - Delivery confirmation request: shipped orders with no actualDelivery past ETA (or shipped too long)
 * - Optional admin alert for very late deliveries
 *
 * Notifications only (no automatic status changes).
 */
class AutomatedSuppliesFulfillmentService {
  constructor() {
    this.isRunning = false;
    this.jobs = [];
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const deliverySchedule = process.env.SUPPLIES_DELIVERY_CONFIRMATION_SCHEDULE || '0 */6 * * *'; // every 6 hours
    const lateSchedule = process.env.SUPPLIES_LATE_DELIVERY_SCHEDULE || '30 9 * * *'; // daily 9:30
    const autoDeliverSchedule = process.env.SUPPLIES_AUTO_DELIVER_SCHEDULE || '0 3 * * *'; // daily 3:00

    this.jobs.push(
      cron.schedule(
        deliverySchedule,
        async () => {
          await this.runDeliveryConfirmationOnce();
        },
        { timezone }
      )
    );

    this.jobs.push(
      cron.schedule(
        lateSchedule,
        async () => {
          await this.runLateDeliveryAlertsOnce();
        },
        { timezone }
      )
    );

    this.jobs.push(
      cron.schedule(
        autoDeliverSchedule,
        async () => {
          await this.runAutoDeliverOnce();
        },
        { timezone }
      )
    );

    this.isRunning = true;
    logger.info('Automated supplies fulfillment service started', { timezone, deliverySchedule, lateSchedule });
  }

  stop() {
    this.jobs.forEach(j => j.stop());
    this.jobs = [];
    this.isRunning = false;
  }

  async runDeliveryConfirmationOnce() {
    if (process.env.ENABLE_AUTOMATED_SUPPLIES_DELIVERY_CONFIRMATION !== 'true') return;

    const dedupHours = parseInt(process.env.SUPPLIES_DELIVERY_DEDUP_HOURS || '24');
    const maxShippedDays = parseInt(process.env.SUPPLIES_DELIVERY_MAX_SHIPPED_DAYS || '14');
    const limit = parseInt(process.env.SUPPLIES_DELIVERY_LIMIT || '300');

    const now = new Date();
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);
    const shippedCutoff = new Date(now.getTime() - maxShippedDays * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      status: 'shipped',
      'shipping.actualDelivery': { $exists: false },
      $or: [
        { 'shipping.estimatedDelivery': { $lte: now } },
        { updatedAt: { $lte: shippedCutoff } }
      ]
    })
      .select('_id customer shipping.estimatedDelivery')
      .limit(limit)
      .lean();

    if (orders.length === 0) return;

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const orderUrlBase = `${frontend}/supplies/orders`;

    let sent = 0;
    let skipped = 0;

    for (const o of orders) {
      const existing = await Notification.findOne({
        user: o.customer,
        type: 'order_delivery_confirmation',
        'data.orderId': o._id,
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();

      if (existing) {
        skipped += 1;
        continue;
      }

      await NotificationService.sendNotification({
        userId: o.customer,
        type: 'order_delivery_confirmation',
        title: 'Confirm delivery',
        message: 'Has your order arrived? Please confirm delivery in the app.',
        data: { orderId: o._id, url: `${orderUrlBase}/${o._id}` },
        priority: 'medium'
      });
      sent += 1;
    }

    logger.info('Supplies delivery confirmation reminders completed', { orders: orders.length, sent, skipped });
  }

  async runLateDeliveryAlertsOnce() {
    if (process.env.ENABLE_AUTOMATED_SUPPLIES_LATE_DELIVERY_ALERTS !== 'true') return;

    const lateDays = parseInt(process.env.SUPPLIES_LATE_DELIVERY_DAYS || '7');
    const dedupHours = parseInt(process.env.SUPPLIES_LATE_DELIVERY_DEDUP_HOURS || '24');
    const limit = parseInt(process.env.SUPPLIES_LATE_DELIVERY_LIMIT || '200');

    const now = new Date();
    const cutoff = new Date(now.getTime() - lateDays * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);

    const orders = await Order.find({
      status: 'shipped',
      updatedAt: { $lte: cutoff },
      'shipping.actualDelivery': { $exists: false }
    })
      .select('_id customer updatedAt')
      .limit(limit)
      .lean();

    if (orders.length === 0) return;

    const admins = await User.find({ roles: { $in: ['admin'] }, isActive: true }).select('_id').lean();
    if (admins.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const o of orders) {
      for (const a of admins) {
        const existing = await Notification.findOne({
          user: a._id,
          type: 'order_delivery_late_alert',
          'data.orderId': o._id,
          createdAt: { $gte: dedupCutoff }
        })
          .select('_id')
          .lean();

        if (existing) {
          skipped += 1;
          continue;
        }

        await NotificationService.sendNotification({
          userId: a._id,
          type: 'order_delivery_late_alert',
          title: 'Late delivery alert',
          message: 'An order appears to be delayed in shipped status.',
          data: { orderId: o._id, customerId: o.customer },
          priority: 'high'
        });
        sent += 1;
      }
    }

    logger.info('Supplies late delivery alerts completed', { orders: orders.length, admins: admins.length, sent, skipped });
  }

  async runAutoDeliverOnce() {
    if (process.env.ENABLE_AUTOMATED_SUPPLIES_AUTO_DELIVER !== 'true') return;

    const shippedDays = parseInt(process.env.SUPPLIES_AUTO_DELIVER_AFTER_DAYS || '10');
    const limit = parseInt(process.env.SUPPLIES_AUTO_DELIVER_LIMIT || '200');

    const now = new Date();
    const cutoff = new Date(now.getTime() - shippedDays * 24 * 60 * 60 * 1000);

    // Only auto-deliver paid orders that have been shipped for long enough and not already delivered.
    const orders = await Order.find({
      status: 'shipped',
      updatedAt: { $lte: cutoff },
      'shipping.actualDelivery': { $exists: false },
      'payment.status': 'paid'
    })
      .select('_id customer updatedAt')
      .limit(limit);

    if (orders.length === 0) return;

    let updated = 0;
    for (const o of orders) {
      o.status = 'delivered';
      o.shipping = o.shipping || {};
      o.shipping.actualDelivery = now;
      await o.save();

      // Notify customer (order_confirmation is used elsewhere; keep a dedicated type)
      await NotificationService.sendNotification({
        userId: o.customer,
        type: 'order_auto_delivered',
        title: 'Order marked delivered',
        message: 'Your order has been marked as delivered. If this is incorrect, please contact support.',
        data: { orderId: o._id },
        priority: 'medium'
      });

      updated += 1;
    }

    logger.info('Supplies auto-deliver completed', { shippedDays, checked: orders.length, updated });
  }
}

module.exports = new AutomatedSuppliesFulfillmentService();



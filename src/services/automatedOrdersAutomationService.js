const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const { Order } = require('../models/Supplies');
const { Notification } = require('../models/Communication');
const User = require('../models/User');

/**
 * Automated Orders Automation Service (Supplies)
 *
 * - Abandoned order payment nudges (pending + payment pending)
 * - Processing SLA alerts (processing too long)
 *
 * Only sends notifications (no automatic state changes).
 */
class AutomatedOrdersAutomationService {
  constructor() {
    this.isRunning = false;
    this.jobs = [];
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const abandonedSchedule = process.env.ORDER_ABANDONED_PAYMENT_SCHEDULE || '0 */2 * * *'; // every 2 hours
    const slaSchedule = process.env.ORDER_SLA_SCHEDULE || '15 9 * * *'; // daily

    this.jobs.push(
      cron.schedule(
        abandonedSchedule,
        async () => {
          await this.runAbandonedPaymentOnce();
        },
        { timezone }
      )
    );

    this.jobs.push(
      cron.schedule(
        slaSchedule,
        async () => {
          await this.runProcessingSlaOnce();
        },
        { timezone }
      )
    );

    this.isRunning = true;
    logger.info('Automated orders automation service started', { timezone, abandonedSchedule, slaSchedule });
  }

  stop() {
    this.jobs.forEach(j => j.stop());
    this.jobs = [];
    this.isRunning = false;
  }

  async runAbandonedPaymentOnce() {
    if (process.env.ENABLE_AUTOMATED_ORDER_ABANDONED_PAYMENT !== 'true') return;

    const minAgeMinutes = parseInt(process.env.ORDER_ABANDONED_MIN_AGE_MINUTES || '60');
    const maxAgeDays = parseInt(process.env.ORDER_ABANDONED_MAX_AGE_DAYS || '7');
    const limit = parseInt(process.env.ORDER_ABANDONED_LIMIT || '200');
    const dedupHours = parseInt(process.env.ORDER_ABANDONED_DEDUP_HOURS || '24');

    const now = new Date();
    const minAge = new Date(now.getTime() - minAgeMinutes * 60 * 1000);
    const maxAge = new Date(now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);

    const orders = await Order.find({
      createdAt: { $lte: minAge, $gte: maxAge },
      status: { $in: ['pending', 'confirmed'] },
      'payment.status': 'pending'
    })
      .select('_id customer totalAmount currency createdAt')
      .limit(limit)
      .lean();

    if (orders.length === 0) return;

    let sent = 0;
    let skipped = 0;

    for (const o of orders) {
      // dedupe per customer+order within window
      const existing = await Notification.findOne({
        user: o.customer,
        type: 'order_payment_pending',
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
        type: 'order_payment_pending',
        title: 'Complete your order',
        message: 'Your supplies order is still pending payment. Complete checkout to confirm it.',
        data: { orderId: o._id },
        priority: 'medium'
      });
      sent += 1;
    }

    logger.info('Abandoned order payment nudges completed', { orders: orders.length, sent, skipped });
  }

  async runProcessingSlaOnce() {
    if (process.env.ENABLE_AUTOMATED_ORDER_SLA_ALERTS !== 'true') return;

    const processingDays = parseInt(process.env.ORDER_PROCESSING_SLA_DAYS || '3');
    const limit = parseInt(process.env.ORDER_SLA_LIMIT || '200');
    const dedupHours = parseInt(process.env.ORDER_SLA_DEDUP_HOURS || '24');

    const now = new Date();
    const cutoff = new Date(now.getTime() - processingDays * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupHours * 60 * 60 * 1000);

    const orders = await Order.find({
      status: 'processing',
      updatedAt: { $lte: cutoff }
    })
      .select('_id customer updatedAt')
      .limit(limit)
      .lean();

    if (orders.length === 0) return;

    // Notify admins too (optional)
    const notifyAdmins = process.env.ORDER_SLA_NOTIFY_ADMINS === 'true';
    let admins = [];
    if (notifyAdmins) {
      admins = await User.find({ roles: { $in: ['admin'] }, isActive: true }).select('_id').lean();
    }

    let sentCustomer = 0;
    let sentAdmins = 0;
    let skipped = 0;

    for (const o of orders) {
      const existing = await Notification.findOne({
        user: o.customer,
        type: 'order_sla_alert',
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
        type: 'order_sla_alert',
        title: 'Order update',
        message: 'Your order is taking longer than usual to process. We’re on it and will update you soon.',
        data: { orderId: o._id },
        priority: 'medium'
      });
      sentCustomer += 1;

      if (notifyAdmins && admins.length > 0) {
        await Promise.allSettled(
          admins.map(a =>
            NotificationService.sendNotification({
              userId: a._id,
              type: 'order_sla_alert',
              title: 'Order SLA alert',
              message: 'An order has been in processing beyond SLA.',
              data: { orderId: o._id, customerId: o.customer },
              priority: 'high'
            })
          )
        );
        sentAdmins += admins.length;
      }
    }

    logger.info('Order SLA alerts completed', { orders: orders.length, sentCustomer, sentAdmins, skipped });
  }
}

module.exports = new AutomatedOrdersAutomationService();



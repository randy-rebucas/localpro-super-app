const User = require('../../../src/models/User');
const suppliesRepo = require('../repositories/suppliesRepository');
const orderRepo = require('../repositories/orderRepository');
const EmailService = require('../../../src/services/emailService');
const logger = require('../../../src/config/logger');
const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/SuppliesErrors');

const createOrder = async (supplyId, { quantity, deliveryAddress, specialInstructions, contactInfo }, user) => {
  if (!quantity || !deliveryAddress) {
    throw new ValidationError('Quantity and delivery address are required');
  }

  const supply = await suppliesRepo.findByIdRaw(supplyId);
  if (!supply) throw new NotFoundError('Supply item');

  if (!supply.isActive) {
    throw new ValidationError('Supply item is not available');
  }

  if (supply.inventory.quantity < quantity) {
    throw new ValidationError('Insufficient quantity available');
  }

  const totalCost = supply.pricing.retailPrice * quantity;

  const order = {
    user: user.id,
    quantity,
    totalCost,
    deliveryAddress,
    specialInstructions,
    contactInfo,
    status: 'pending',
    createdAt: new Date()
  };

  supply.orders.push(order);
  await suppliesRepo.save(supply);

  try {
    await EmailService.sendEmail({
      to: supply.supplier.email,
      subject: 'New Supply Order',
      template: 'order-confirmation',
      data: {
        supplyTitle: supply.title,
        clientName: `${user.firstName} ${user.lastName}`,
        quantity,
        totalCost,
        deliveryAddress,
        specialInstructions
      }
    });
  } catch (err) {
    logger.warn('Failed to send order notification email', { error: err.message });
  }

  return order;
};

const updateOrderStatus = async (supplyId, orderId, status, user) => {
  if (!status) {
    throw new ValidationError('Status is required');
  }

  const supply = await suppliesRepo.findByIdRaw(supplyId);
  if (!supply) throw new NotFoundError('Supply item');

  if (supply.supplier.toString() !== user.id) {
    throw new ForbiddenError('Not authorized to update order status');
  }

  const order = orderRepo.findOrderInSupply(supply, orderId);
  if (!order) throw new NotFoundError('Order');

  order.status = status;
  order.updatedAt = new Date();

  if (status === 'completed') {
    supply.inventory.quantity -= order.quantity;
  }

  await suppliesRepo.save(supply);

  try {
    const client = await User.findById(order.user);
    await EmailService.sendEmail({
      to: client.email,
      subject: 'Supply Order Status Update',
      template: 'application-status-update',
      data: {
        supplyTitle: supply.title,
        status,
        quantity: order.quantity,
        totalCost: order.totalCost
      }
    });
  } catch (err) {
    logger.warn('Failed to send order status email', { error: err.message });
  }

  return order;
};

const getMyOrders = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const supplies = await suppliesRepo.findWithUserOrders(userId, { skip, limit: Number(limit) });
  const userOrders = orderRepo.extractUserOrders(supplies, userId);

  return { orders: userOrders, count: userOrders.length };
};

module.exports = {
  createOrder,
  updateOrderStatus,
  getMyOrders
};

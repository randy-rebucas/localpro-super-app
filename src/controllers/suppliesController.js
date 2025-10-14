const { Product, SubscriptionKit, Order } = require('../models/Supplies');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const PayPalService = require('../services/paypalService');

// @desc    Get all products
// @route   GET /api/supplies/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      isSubscriptionEligible,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (minPrice || maxPrice) {
      filter['pricing.retailPrice'] = {};
      if (minPrice) filter['pricing.retailPrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.retailPrice'].$lte = Number(maxPrice);
    }
    if (isSubscriptionEligible !== undefined) {
      filter.isSubscriptionEligible = isSubscriptionEligible === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .populate('supplier', 'firstName lastName businessName')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single product
// @route   GET /api/supplies/products/:id
// @access  Public
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('supplier', 'firstName lastName businessName contact');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new product
// @route   POST /api/supplies/products
// @access  Private (Supplier)
const createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      supplier: req.user.id
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get subscription kits
// @route   GET /api/supplies/subscription-kits
// @access  Public
const getSubscriptionKits = async (req, res) => {
  try {
    const { category, targetAudience } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;
    if (targetAudience) filter.targetAudience = { $in: [new RegExp(targetAudience, 'i')] };

    const kits = await SubscriptionKit.find(filter)
      .populate('products.product', 'name pricing images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: kits.length,
      data: kits
    });
  } catch (error) {
    console.error('Get subscription kits error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single subscription kit
// @route   GET /api/supplies/subscription-kits/:id
// @access  Public
const getSubscriptionKit = async (req, res) => {
  try {
    const kit = await SubscriptionKit.findById(req.params.id)
      .populate('products.product', 'name description pricing images specifications');

    if (!kit) {
      return res.status(404).json({
        success: false,
        message: 'Subscription kit not found'
      });
    }

    res.status(200).json({
      success: true,
      data: kit
    });
  } catch (error) {
    console.error('Get subscription kit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create order
// @route   POST /api/supplies/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items, subscriptionKitId, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`
        });
      }

      const itemTotal = product.pricing.retailPrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.pricing.retailPrice
      });
    }

    const orderData = {
      customer: req.user.id,
      items: orderItems,
      subscriptionKit: subscriptionKitId,
      totalAmount,
      shippingAddress,
      isSubscription: !!subscriptionKitId,
      payment: {
        method: paymentMethod || 'cash',
        status: paymentMethod === 'paypal' ? 'pending' : 'pending'
      }
    };

    const order = await Order.create(orderData);

    // Handle PayPal payment if selected
    if (paymentMethod === 'paypal') {
      try {
        // Get user details for PayPal
        const user = await User.findById(req.user.id).select('firstName lastName email');
        
        // Create PayPal order
        const paypalOrderData = {
          amount: totalAmount,
          currency: 'USD',
          description: `Supplies order #${order._id}`,
          referenceId: order._id.toString(),
          items: orderItems.map(item => ({
            name: item.product.name || 'Product',
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toFixed(2)
            },
            quantity: item.quantity.toString()
          })),
          shipping: shippingAddress ? {
            name: `${user.firstName} ${user.lastName}`,
            address_line_1: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.zipCode,
            country_code: shippingAddress.country || 'US'
          } : undefined
        };

        const paypalOrderResult = await PayPalService.createOrder(paypalOrderData);
        
        if (!paypalOrderResult.success) {
          throw new Error('Failed to create PayPal order');
        }

        // Update order with PayPal order ID
        order.payment.paypalOrderId = paypalOrderResult.data.id;
        await order.save();

        // Populate order details
        await order.populate([
          { path: 'items.product', select: 'name pricing images' },
          { path: 'subscriptionKit', select: 'name pricing frequency' },
          { path: 'customer', select: 'firstName lastName email' }
        ]);

        res.status(201).json({
          success: true,
          message: 'Order created successfully with PayPal payment',
          data: {
            order,
            paypalApprovalUrl: paypalOrderResult.data.links.find(link => link.rel === 'approve')?.href
          }
        });
        return;
      } catch (paypalError) {
        console.error('PayPal order error:', paypalError);
        // Fall back to regular order creation
        order.payment.method = 'cash';
        await order.save();
      }
    }

    // Populate order details
    await order.populate([
      { path: 'items.product', select: 'name pricing images' },
      { path: 'subscriptionKit', select: 'name pricing frequency' },
      { path: 'customer', select: 'firstName lastName email' }
    ]);

    // Send order confirmation email to customer if email is available
    if (order.customer.email) {
      try {
        await EmailService.sendOrderConfirmation(order.customer.email, order);
        console.log(`Order confirmation email sent to: ${order.customer.email}`);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the order if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user orders
// @route   GET /api/supplies/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const { status, isSubscription } = req.query;
    const userId = req.user.id;

    const filter = { customer: userId };
    if (status) filter.status = status;
    if (isSubscription !== undefined) filter.isSubscription = isSubscription === 'true';

    const orders = await Order.find(filter)
      .populate('items.product', 'name pricing images')
      .populate('subscriptionKit', 'name pricing frequency')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/supplies/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the customer or supplier
    const isCustomer = order.customer.toString() === req.user.id;
    const isSupplier = req.user.role === 'supplier' || req.user.role === 'admin';

    if (!isCustomer && !isSupplier) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    order.status = status;
    if (status === 'delivered') {
      order.shipping.actualDelivery = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Subscribe to subscription kit
// @route   POST /api/supplies/subscribe
// @access  Private
const subscribeToKit = async (req, res) => {
  try {
    const { kitId, frequency, shippingAddress } = req.body;

    const kit = await SubscriptionKit.findById(kitId);
    if (!kit) {
      return res.status(404).json({
        success: false,
        message: 'Subscription kit not found'
      });
    }

    // Calculate pricing based on frequency
    let price = 0;
    switch (frequency) {
      case 'weekly':
        price = kit.pricing.monthlyPrice / 4;
        break;
      case 'bi-weekly':
        price = kit.pricing.monthlyPrice / 2;
        break;
      case 'monthly':
        price = kit.pricing.monthlyPrice;
        break;
      case 'quarterly':
        price = kit.pricing.quarterlyPrice;
        break;
      default:
        price = kit.pricing.monthlyPrice;
    }

    // Create subscription order
    const orderData = {
      customer: req.user.id,
      subscriptionKit: kitId,
      totalAmount: price,
      shippingAddress,
      isSubscription: true,
      subscriptionDetails: {
        frequency,
        nextDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true
      }
    };

    const order = await Order.create(orderData);

    // Populate order details
    await order.populate([
      { path: 'subscriptionKit', select: 'name pricing frequency' },
      { path: 'customer', select: 'firstName lastName email' }
    ]);

    // Send order confirmation email to customer if email is available
    if (order.customer.email) {
      try {
        await EmailService.sendOrderConfirmation(order.customer.email, order);
        console.log(`Subscription confirmation email sent to: ${order.customer.email}`);
      } catch (emailError) {
        console.error('Failed to send subscription confirmation email:', emailError);
        // Don't fail the subscription if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: order
    });
  } catch (error) {
    console.error('Subscribe to kit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Handle PayPal order payment approval
// @route   POST /api/supplies/orders/paypal/approve
// @access  Private
const approvePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Capture the PayPal order
    const captureResult = await PayPalService.captureOrder(orderId);
    
    if (!captureResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to capture PayPal payment'
      });
    }

    // Find the order
    const order = await Order.findOne({
      customer: userId,
      'payment.paypalOrderId': orderId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order payment status
    order.payment.status = 'paid';
    order.payment.paypalTransactionId = captureResult.data.purchase_units[0].payments.captures[0].id;
    order.payment.paidAt = new Date();
    order.status = 'confirmed';
    await order.save();

    // Send order confirmation email
    await order.populate([
      { path: 'items.product', select: 'name pricing images' },
      { path: 'subscriptionKit', select: 'name pricing frequency' },
      { path: 'customer', select: 'firstName lastName email' }
    ]);

    if (order.customer.email) {
      try {
        await EmailService.sendOrderConfirmation(order.customer.email, order);
        console.log(`Order confirmation email sent to: ${order.customer.email}`);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'PayPal payment approved successfully',
      data: order
    });
  } catch (error) {
    console.error('Approve PayPal order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get PayPal order details for supplies
// @route   GET /api/supplies/orders/paypal/order/:orderId
// @access  Private
const getPayPalOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Verify the order belongs to the user
    const order = await Order.findOne({
      customer: userId,
      'payment.paypalOrderId': orderId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order details from PayPal
    const paypalOrderResult = await PayPalService.getOrder(orderId);
    
    if (!paypalOrderResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get PayPal order details'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order,
        paypalOrder: paypalOrderResult.data
      }
    });
  } catch (error) {
    console.error('Get PayPal order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  getSubscriptionKits,
  getSubscriptionKit,
  createOrder,
  getOrders,
  updateOrderStatus,
  subscribeToKit,
  approvePayPalOrder,
  getPayPalOrderDetails
};

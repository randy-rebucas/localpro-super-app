const { Product, SubscriptionKit, Order } = require('../models/Supplies');

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
    const { items, subscriptionKitId, shippingAddress } = req.body;

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
      isSubscription: !!subscriptionKitId
    };

    const order = await Order.create(orderData);

    // Populate order details
    await order.populate([
      { path: 'items.product', select: 'name pricing images' },
      { path: 'subscriptionKit', select: 'name pricing frequency' }
    ]);

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
    await order.populate('subscriptionKit', 'name pricing frequency');

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

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  getSubscriptionKits,
  getSubscriptionKit,
  createOrder,
  getOrders,
  updateOrderStatus,
  subscribeToKit
};

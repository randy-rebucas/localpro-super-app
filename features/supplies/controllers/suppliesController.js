const suppliesService = require('../services/suppliesService');
const orderService = require('../services/orderService');
const reviewService = require('../services/reviewService');
const descriptionService = require('../services/descriptionService');
const statisticsService = require('../services/statisticsService');
const { AppError } = require('../errors/SuppliesErrors');
const logger = require('../../../src/config/logger');

const handleError = (res, error, fallbackMessage) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details && { details: error.details })
    });
  }
  logger.error(fallbackMessage, { error: error.message, stack: error.stack });
  return res.status(500).json({ success: false, message: 'Server error' });
};

// @desc    Get all supplies
// @route   GET /api/supplies
const getSupplies = async (req, res) => {
  try {
    const result = await suppliesService.listSupplies(req.query);
    return res.status(200).json({ success: true, ...result, data: result.supplies });
  } catch (error) {
    return handleError(res, error, 'Get supplies error');
  }
};

// @desc    Get detailed information about a supply item
// @route   GET /api/supplies/:id
const getSupply = async (req, res) => {
  try {
    const result = await suppliesService.getSupplyDetail(req.params.id, req.query);
    return res.status(200).json({ success: true, message: 'Supply details retrieved successfully', data: result });
  } catch (error) {
    return handleError(res, error, 'Get supply detail error');
  }
};

// @desc    Create new supply item
// @route   POST /api/supplies
const createSupply = async (req, res) => {
  try {
    const supply = await suppliesService.createSupply(req.body, req.user.id);
    return res.status(201).json({ success: true, message: 'Supply item created successfully', data: supply });
  } catch (error) {
    return handleError(res, error, 'Create supply error');
  }
};

// @desc    Update supply item
// @route   PUT /api/supplies/:id
const updateSupply = async (req, res) => {
  try {
    const supply = await suppliesService.updateSupply(req.params.id, req.body, req.user);
    return res.status(200).json({ success: true, message: 'Supply item updated successfully', data: supply });
  } catch (error) {
    return handleError(res, error, 'Update supply error');
  }
};

// @desc    Patch supply item (partial update)
// @route   PATCH /api/supplies/:id
const patchSupply = async (req, res) => {
  try {
    const result = await suppliesService.patchSupply(req.params.id, req.body, req.user);
    return res.status(200).json({ success: true, message: 'Supply item updated successfully', data: result });
  } catch (error) {
    return handleError(res, error, 'Patch supply error');
  }
};

// @desc    Delete supply item
// @route   DELETE /api/supplies/:id
const deleteSupply = async (req, res) => {
  try {
    await suppliesService.deleteSupply(req.params.id, req.user);
    return res.status(200).json({ success: true, message: 'Supply item deleted successfully' });
  } catch (error) {
    return handleError(res, error, 'Delete supply error');
  }
};

// @desc    Upload supply images
// @route   POST /api/supplies/:id/images
const uploadSupplyImages = async (req, res) => {
  try {
    const uploads = await suppliesService.uploadImages(req.params.id, req.files, req.user);
    return res.status(200).json({ success: true, message: `${uploads.length} image(s) uploaded successfully`, data: uploads });
  } catch (error) {
    return handleError(res, error, 'Upload supply images error');
  }
};

// @desc    Delete supply image
// @route   DELETE /api/supplies/:id/images/:imageId
const deleteSupplyImage = async (req, res) => {
  try {
    await suppliesService.deleteImage(req.params.id, req.params.imageId, req.user);
    return res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    return handleError(res, error, 'Delete supply image error');
  }
};

// @desc    Order supply item
// @route   POST /api/supplies/:id/order
const orderSupply = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.params.id, req.body, req.user);
    return res.status(201).json({ success: true, message: 'Supply item ordered successfully', data: order });
  } catch (error) {
    return handleError(res, error, 'Order supply error');
  }
};

// @desc    Update order status
// @route   PUT /api/supplies/:id/orders/:orderId/status
const updateOrderStatus = async (req, res) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.params.orderId, req.body.status, req.user);
    return res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
  } catch (error) {
    return handleError(res, error, 'Update order status error');
  }
};

// @desc    Add supply review
// @route   POST /api/supplies/:id/reviews
const addSupplyReview = async (req, res) => {
  try {
    const review = await reviewService.addReview(req.params.id, req.body, req.user.id);
    return res.status(201).json({ success: true, message: 'Review added successfully', data: review });
  } catch (error) {
    return handleError(res, error, 'Add supply review error');
  }
};

// @desc    Get user's supply items
// @route   GET /api/supplies/my-supplies
const getMySupplies = async (req, res) => {
  try {
    const result = await suppliesService.getMySupplies(req.user.id, req.query);
    return res.status(200).json({ success: true, ...result, data: result.supplies });
  } catch (error) {
    return handleError(res, error, 'Get my supplies error');
  }
};

// @desc    Get user's supply orders
// @route   GET /api/supplies/my-orders
const getMySupplyOrders = async (req, res) => {
  try {
    const result = await orderService.getMyOrders(req.user.id, req.query);
    return res.status(200).json({ success: true, count: result.count, data: result.orders });
  } catch (error) {
    return handleError(res, error, 'Get my supply orders error');
  }
};

// @desc    Get nearby supply items
// @route   GET /api/supplies/nearby
const getNearbySupplies = async (req, res) => {
  try {
    const result = await suppliesService.getNearbySupplies(req.query);
    return res.status(200).json({ success: true, ...result, data: result.supplies });
  } catch (error) {
    return handleError(res, error, 'Get nearby supplies error');
  }
};

// @desc    Get supply categories
// @route   GET /api/supplies/categories
const getSupplyCategories = async (req, res) => {
  try {
    const categories = await suppliesService.getCategories();
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    return handleError(res, error, 'Get supply categories error');
  }
};

// @desc    Get featured supply items
// @route   GET /api/supplies/featured
const getFeaturedSupplies = async (req, res) => {
  try {
    const supplies = await suppliesService.getFeaturedSupplies(req.query.limit);
    return res.status(200).json({ success: true, count: supplies.length, data: supplies });
  } catch (error) {
    return handleError(res, error, 'Get featured supplies error');
  }
};

// @desc    Get supply statistics
// @route   GET /api/supplies/statistics
const getSupplyStatistics = async (req, res) => {
  try {
    const stats = await statisticsService.getStatistics();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return handleError(res, error, 'Get supply statistics error');
  }
};

// @desc    Generate supply description using AI
// @route   POST /api/supplies/generate-description
const generateSupplyDescription = async (req, res) => {
  try {
    const { result, usage } = await descriptionService.generateDescription(req.body, req.user.id);
    return res.status(200).json({ success: true, message: 'Supply description generated successfully', data: result, usage });
  } catch (error) {
    return handleError(res, error, 'Generate supply description error');
  }
};

module.exports = {
  getSupplies,
  getSupply,
  createSupply,
  updateSupply,
  patchSupply,
  deleteSupply,
  uploadSupplyImages,
  deleteSupplyImage,
  orderSupply,
  updateOrderStatus,
  addSupplyReview,
  getMySupplies,
  getMySupplyOrders,
  getNearbySupplies,
  getSupplyCategories,
  getFeaturedSupplies,
  getSupplyStatistics,
  generateSupplyDescription
};

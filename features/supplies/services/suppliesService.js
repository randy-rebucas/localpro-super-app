const mongoose = require('mongoose');
const suppliesRepo = require('../repositories/suppliesRepository');
const CloudinaryService = require('../../../src/services/cloudinaryService');
const GoogleMapsService = require('../../../src/services/googleMapsService');
const logger = require('../../../src/config/logger');
const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/SuppliesErrors');

// --- Private helpers ---

const _checkOwnership = (supply, user) => {
  const userRoles = user.roles || [];
  const isAdmin = userRoles.includes('admin');
  const isSupplier = supply.supplier.toString() === user.id;
  if (!isSupplier && !isAdmin) {
    throw new ForbiddenError('Not authorized to update this supply item');
  }
};

const _geocodeLocation = async (locationData) => {
  if (!locationData?.street) return null;
  try {
    const address = `${locationData.street}, ${locationData.city}, ${locationData.state}`;
    const result = await GoogleMapsService.geocodeAddress(address);
    if (result.success && result.data.length > 0) {
      const loc = result.data[0];
      return {
        lat: loc.geometry.location.lat,
        lng: loc.geometry.location.lng
      };
    }
  } catch (err) {
    logger.warn('Geocoding failed, continuing without coordinates', { error: err.message });
  }
  return null;
};

const _deepMerge = (target, source) => {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && !(source[key] instanceof Date) && source[key].constructor === Object) {
      if (!target[key]) target[key] = {};
      _deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
};

// --- Public API ---

const listSupplies = async ({ search, category, location, minPrice, maxPrice, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) => {
  const filter = { isActive: true };

  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { tags: new RegExp(search, 'i') }
    ];
  }
  if (category) filter.category = category;
  if (location) filter['location.city'] = new RegExp(location, 'i');
  if (minPrice || maxPrice) {
    filter['pricing.retailPrice'] = {};
    if (minPrice) filter['pricing.retailPrice'].$gte = Number(minPrice);
    if (maxPrice) filter['pricing.retailPrice'].$lte = Number(maxPrice);
  }

  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  const skip = (page - 1) * limit;

  const [supplies, total] = await Promise.all([
    suppliesRepo.findAll(filter, { sort, skip, limit: Number(limit) }),
    suppliesRepo.countAll(filter)
  ]);

  return { supplies, total, page: Number(page), pages: Math.ceil(total / limit), count: supplies.length };
};

const getSupplyDetail = async (id, { includeOrders = 'false', includeReviews = 'true', includeRelated = 'true', includeStatistics = 'true' } = {}) => {
  const trimmedId = id.trim();

  if (!trimmedId || trimmedId.length !== 24) {
    throw new ValidationError('Invalid supply ID format', {
      receivedId: trimmedId,
      receivedLength: trimmedId?.length || 0,
      expectedLength: 24
    });
  }

  let supplyId;
  try {
    if (!mongoose.isValidObjectId(trimmedId)) throw new Error('Invalid ObjectId format');
    supplyId = new mongoose.Types.ObjectId(trimmedId);
  } catch (e) {
    logger.warn('Invalid supply ID format', { id: trimmedId, error: e.message });
    throw new ValidationError('Invalid supply ID format', { receivedId: trimmedId });
  }

  const supply = await suppliesRepo.findById(supplyId, {
    populate: { path: 'supplier', select: 'firstName lastName email phone profile.avatar profile.bio profile.rating' },
    lean: true
  });

  if (!supply) throw new NotFoundError('Supply item');
  if (!supply.isActive) throw new ForbiddenError('Supply item is not active');

  const supplyDetails = {
    supply: {
      id: supply._id,
      name: supply.name,
      title: supply.title,
      description: supply.description,
      category: supply.category,
      subcategory: supply.subcategory,
      brand: supply.brand,
      sku: supply.sku,
      pricing: supply.pricing,
      inventory: supply.inventory,
      specifications: supply.specifications,
      location: supply.location,
      images: supply.images,
      tags: supply.tags,
      isFeatured: supply.isFeatured,
      isSubscriptionEligible: supply.isSubscriptionEligible,
      averageRating: supply.averageRating,
      views: supply.views,
      supplier: supply.supplier,
      createdAt: supply.createdAt,
      updatedAt: supply.updatedAt
    }
  };

  if (includeReviews === 'true' || includeReviews === true) {
    const reviewData = await suppliesRepo.findById(supplyId, { select: 'reviews', populate: { path: 'reviews.user', select: 'firstName lastName profile.avatar' }, lean: true });
    supplyDetails.reviews = reviewData?.reviews?.map(r => ({
      id: r._id, user: r.user, rating: r.rating, comment: r.comment, createdAt: r.createdAt
    })) || [];
    supplyDetails.reviewCount = supplyDetails.reviews.length;
  }

  if (includeOrders === 'true' || includeOrders === true) {
    const orderData = await suppliesRepo.findById(supplyId, { select: 'orders', populate: { path: 'orders.user', select: 'firstName lastName profile.avatar email phone' }, lean: true });
    supplyDetails.orders = orderData?.orders?.map(o => ({
      id: o._id, user: o.user, quantity: o.quantity, totalCost: o.totalCost,
      deliveryAddress: o.deliveryAddress, specialInstructions: o.specialInstructions,
      contactInfo: o.contactInfo, status: o.status, createdAt: o.createdAt, updatedAt: o.updatedAt
    })) || [];
    supplyDetails.orderCount = supplyDetails.orders.length;
  }

  if (includeStatistics === 'true' || includeStatistics === true) {
    let reviewCount = supplyDetails.reviews?.length;
    if (reviewCount === undefined) {
      const rd = await suppliesRepo.findById(supplyId, { select: 'reviews', lean: true });
      reviewCount = rd?.reviews?.length || 0;
    }

    const stats = {
      views: supply.views || 0,
      averageRating: supply.averageRating || 0,
      reviewCount,
      orderCount: supplyDetails.orders?.length || 0,
      inventory: {
        quantity: supply.inventory?.quantity || 0,
        minStock: supply.inventory?.minStock || 0,
        maxStock: supply.inventory?.maxStock || null,
        inStock: (supply.inventory?.quantity || 0) > 0,
        lowStock: (supply.inventory?.quantity || 0) <= (supply.inventory?.minStock || 10)
      }
    };

    if (supplyDetails.orders && supplyDetails.orders.length > 0) {
      stats.orders = {
        total: supplyDetails.orders.length,
        pending: supplyDetails.orders.filter(o => o.status === 'pending').length,
        confirmed: supplyDetails.orders.filter(o => o.status === 'confirmed').length,
        processing: supplyDetails.orders.filter(o => o.status === 'processing').length,
        shipped: supplyDetails.orders.filter(o => o.status === 'shipped').length,
        delivered: supplyDetails.orders.filter(o => o.status === 'delivered').length,
        cancelled: supplyDetails.orders.filter(o => o.status === 'cancelled').length,
        totalRevenue: supplyDetails.orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.totalCost || 0), 0)
      };
    }

    supplyDetails.statistics = stats;
  }

  if (includeRelated === 'true' || includeRelated === true) {
    supplyDetails.relatedSupplies = await suppliesRepo.findRelated(supply.category, supply.subcategory, supplyId, 6);
  }

  await suppliesRepo.incrementViews(supplyId);

  logger.info('Supply details retrieved', {
    supplyId: id, supplyName: supply.name, category: supply.category,
    includeOrders, includeReviews, includeRelated, includeStatistics
  });

  return supplyDetails;
};

const createSupply = async (data, userId) => {
  const supplyData = { ...data, supplier: userId };

  const coords = await _geocodeLocation(supplyData.location);
  if (coords) supplyData.location.coordinates = coords;

  const supply = await suppliesRepo.create(supplyData);
  await supply.populate('supplier', 'firstName lastName profile.avatar');
  return supply;
};

const updateSupply = async (id, data, user) => {
  const supply = await suppliesRepo.findByIdRaw(id);
  if (!supply) throw new NotFoundError('Supply item');
  _checkOwnership(supply, user);

  if (data.location?.street && data.location.street !== supply.location?.street) {
    const coords = await _geocodeLocation(data.location);
    if (coords) data.location.coordinates = coords;
  }

  const updated = await suppliesRepo.updateById(id, data);
  return updated;
};

const patchSupply = async (id, data, user) => {
  const supply = await suppliesRepo.findByIdRaw(id);
  if (!supply) throw new NotFoundError('Supply item');
  _checkOwnership(supply, user);

  const updateData = { ...data };
  const updatedFields = [];
  const restrictedFields = ['_id', 'supplier', 'createdAt', 'updatedAt', 'orders', 'reviews', 'averageRating'];
  const allowedTopLevelFields = ['name', 'title', 'description', 'category', 'subcategory', 'brand', 'sku', 'pricing', 'inventory', 'specifications', 'location', 'images', 'tags', 'isActive', 'isFeatured', 'views', 'isSubscriptionEligible'];

  for (const field of allowedTopLevelFields) {
    if (updateData[field] !== undefined) {
      if (['pricing', 'inventory', 'specifications', 'location'].includes(field)) {
        if (!supply[field]) supply[field] = {};
        _deepMerge(supply[field], updateData[field]);
      } else if (field === 'images' || field === 'tags') {
        supply[field] = updateData[field];
      } else {
        supply[field] = updateData[field];
      }
      updatedFields.push(field);
      delete updateData[field];
    }
  }

  restrictedFields.forEach(field => delete updateData[field]);

  if (updatedFields.includes('location') && data.location?.street) {
    const coords = await _geocodeLocation(data.location);
    if (coords) supply.location.coordinates = coords;
  }

  if (updatedFields.length > 0) {
    await suppliesRepo.save(supply);
  }

  await supply.populate('supplier', 'firstName lastName profile.avatar');
  return { supply, updatedFields };
};

const deleteSupply = async (id, user) => {
  const supply = await suppliesRepo.findByIdRaw(id);
  if (!supply) throw new NotFoundError('Supply item');
  _checkOwnership(supply, user);

  supply.isActive = false;
  await suppliesRepo.save(supply);
};

const uploadImages = async (id, files, user) => {
  if (!files || files.length === 0) {
    throw new ValidationError('No files uploaded');
  }

  const supply = await suppliesRepo.findByIdRaw(id);
  if (!supply) throw new NotFoundError('Supply item');
  _checkOwnership(supply, user);

  const uploadResults = await Promise.all(
    files.map(file => CloudinaryService.uploadFile(file, 'localpro/supplies'))
  );

  const successfulUploads = uploadResults
    .filter(r => r.success)
    .map(r => ({ url: r.data.secure_url, publicId: r.data.public_id }));

  if (successfulUploads.length === 0) {
    throw new ValidationError('Failed to upload any images');
  }

  supply.images = [...supply.images, ...successfulUploads];
  await suppliesRepo.save(supply);
  return successfulUploads;
};

const deleteImage = async (id, imageId, user) => {
  const supply = await suppliesRepo.findByIdRaw(id);
  if (!supply) throw new NotFoundError('Supply item');

  // Note: deleteImage only allows supplier, not admin (original behavior)
  if (supply.supplier.toString() !== user.id) {
    throw new ForbiddenError('Not authorized to delete images for this supply item');
  }

  const image = supply.images.id(imageId);
  if (!image) throw new NotFoundError('Image');

  await CloudinaryService.deleteFile(image.publicId);
  image.remove();
  await suppliesRepo.save(supply);
};

const getMySupplies = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const [supplies, total] = await Promise.all([
    suppliesRepo.findBySupplier(userId, { skip, limit: Number(limit) }),
    suppliesRepo.countBySupplier(userId)
  ]);

  return { supplies, total, page: Number(page), pages: Math.ceil(total / limit), count: supplies.length };
};

const getNearbySupplies = async ({ lat, lng, radius = 10, page = 1, limit = 10 }) => {
  if (!lat || !lng) {
    throw new ValidationError('Latitude and longitude are required');
  }

  const skip = (page - 1) * limit;
  const { supplies, total } = await suppliesRepo.findNearby(lng, lat, radius, { skip, limit: Number(limit) });

  return { supplies, total, page: Number(page), pages: Math.ceil(total / limit), count: supplies.length };
};

const getCategories = async () => {
  return suppliesRepo.aggregateCategories();
};

const getFeaturedSupplies = async (limit = 10) => {
  return suppliesRepo.findFeatured(Number(limit));
};

module.exports = {
  listSupplies,
  getSupplyDetail,
  createSupply,
  updateSupply,
  patchSupply,
  deleteSupply,
  uploadImages,
  deleteImage,
  getMySupplies,
  getNearbySupplies,
  getCategories,
  getFeaturedSupplies
};

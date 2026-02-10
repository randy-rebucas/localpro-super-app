const { Product: Supplies } = require('../models/Supplies');

const findAll = async (filter, { sort, skip, limit }) => {
  return Supplies.find(filter)
    .populate('supplier', 'firstName lastName profile.avatar profile.rating')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

const countAll = async (filter) => {
  return Supplies.countDocuments(filter);
};

const findById = async (id, { populate, lean = false, select } = {}) => {
  let query = Supplies.findById(id);
  if (populate) query = query.populate(populate);
  if (select) query = query.select(select);
  if (lean) query = query.lean();
  return query;
};

const findByIdRaw = async (id) => {
  return Supplies.findById(id);
};

const create = async (data) => {
  return Supplies.create(data);
};

const save = async (doc) => {
  return doc.save();
};

const updateById = async (id, data, options = { new: true, runValidators: true }) => {
  return Supplies.findByIdAndUpdate(id, data, options);
};

const incrementViews = async (id) => {
  return Supplies.findByIdAndUpdate(id, { $inc: { views: 1 } });
};

const findBySupplier = async (supplierId, { skip, limit }) => {
  return Supplies.find({ supplier: supplierId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const countBySupplier = async (supplierId) => {
  return Supplies.countDocuments({ supplier: supplierId });
};

const findNearby = async (lng, lat, radiusKm, { skip, limit }) => {
  const geoFilter = {
    isActive: true,
    'location.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: radiusKm * 1000
      }
    }
  };

  const supplies = await Supplies.find(geoFilter)
    .populate('supplier', 'firstName lastName profile.avatar profile.rating')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Supplies.countDocuments(geoFilter);

  return { supplies, total };
};

const findFeatured = async (limit) => {
  return Supplies.find({ isActive: true, isFeatured: true })
    .populate('supplier', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
};

const findRelated = async (category, subcategory, excludeId, limit = 6) => {
  return Supplies.find({
    category,
    subcategory,
    isActive: true,
    _id: { $ne: excludeId }
  })
    .populate('supplier', 'firstName lastName profile.avatar')
    .select('name title description category subcategory pricing retailPrice images averageRating views')
    .sort({ averageRating: -1, views: -1 })
    .limit(limit)
    .lean();
};

const findWithUserOrders = async (userId, { skip, limit }) => {
  return Supplies.find({ 'orders.user': userId })
    .populate('supplier', 'firstName lastName profile.avatar')
    .sort({ 'orders.createdAt': -1 })
    .skip(skip)
    .limit(limit);
};

const aggregateCategories = async () => {
  return Supplies.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

const aggregateStatistics = async () => {
  const totalSupplies = await Supplies.countDocuments();

  const suppliesByCategory = await Supplies.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const totalOrders = await Supplies.aggregate([
    { $group: { _id: null, totalOrders: { $sum: { $size: '$orders' } } } }
  ]);

  const monthlyTrends = await Supplies.aggregate([
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  return {
    totalSupplies,
    suppliesByCategory,
    totalOrders: totalOrders[0]?.totalOrders || 0,
    monthlyTrends
  };
};

module.exports = {
  findAll,
  countAll,
  findById,
  findByIdRaw,
  create,
  save,
  updateById,
  incrementViews,
  findBySupplier,
  countBySupplier,
  findNearby,
  findFeatured,
  findRelated,
  findWithUserOrders,
  aggregateCategories,
  aggregateStatistics
};

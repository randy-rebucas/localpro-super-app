const { RentalItem } = require('../models/Rentals');

const findAll = async (filter, { sort, skip, limit }) => {
  return RentalItem.find(filter)
    .populate('owner', 'firstName lastName profile.avatar profile.rating')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

const countAll = async (filter) => {
  return RentalItem.countDocuments(filter);
};

const findById = async (id, { populate, lean = false, select } = {}) => {
  let query = RentalItem.findById(id);
  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(p => { query = query.populate(p); });
    } else {
      query = query.populate(populate);
    }
  }
  if (select) query = query.select(select);
  if (lean) query = query.lean();
  return query;
};

const findByIdRaw = async (id) => {
  return RentalItem.findById(id);
};

const create = async (data) => {
  return RentalItem.create(data);
};

const save = async (doc) => {
  return doc.save();
};

const updateById = async (id, data, options = { new: true, runValidators: true }) => {
  return RentalItem.findByIdAndUpdate(id, data, options);
};

const incrementViews = async (id) => {
  return RentalItem.findByIdAndUpdate(id, { $inc: { views: 1 } }, { runValidators: false });
};

const findByOwner = async (ownerId, { skip, limit }) => {
  return RentalItem.find({ owner: ownerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const countByOwner = async (ownerId) => {
  return RentalItem.countDocuments({ owner: ownerId });
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

  const rentals = await RentalItem.find(geoFilter)
    .populate('owner', 'firstName lastName profile.avatar profile.rating')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await RentalItem.countDocuments(geoFilter);

  return { rentals, total };
};

const findFeatured = async (limit) => {
  return RentalItem.find({ isActive: true, isFeatured: true })
    .populate('owner', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
};

const findWithUserBookings = async (userId, { skip, limit }) => {
  return RentalItem.find({ 'bookings.user': userId })
    .populate('owner', 'firstName lastName profile.avatar')
    .sort({ 'bookings.createdAt': -1 })
    .skip(skip)
    .limit(limit);
};

const aggregateCategories = async () => {
  return RentalItem.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

const aggregateStatistics = async () => {
  const totalRentalItem = await RentalItem.countDocuments();

  const rentalsByCategory = await RentalItem.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const totalBookings = await RentalItem.aggregate([
    {
      $group: {
        _id: null,
        totalBookings: { $sum: { $size: { $ifNull: ['$bookings', []] } } }
      }
    }
  ]);

  const monthlyTrends = await RentalItem.aggregate([
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  return {
    totalRentalItem,
    rentalsByCategory,
    totalBookings: totalBookings[0]?.totalBookings || 0,
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
  findByOwner,
  countByOwner,
  findNearby,
  findFeatured,
  findWithUserBookings,
  aggregateCategories,
  aggregateStatistics
};

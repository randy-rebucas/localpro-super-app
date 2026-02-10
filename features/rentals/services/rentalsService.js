const rentalsRepo = require('../repositories/rentalsRepository');
const CloudinaryService = require('../../../src/services/cloudinaryService');
const GoogleMapsService = require('../../../src/services/googleMapsService');
const logger = require('../../../src/config/logger');
const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/RentalsErrors');

// --- Private helpers ---

const _checkOwnership = (rental, user) => {
  const userRoles = user.roles || [];
  const isAdmin = userRoles.includes('admin');
  const isOwner = rental.owner.toString() === user.id;
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('Not authorized to update this rental item');
  }
};

const _geocodeLocation = async (locationData) => {
  const street = locationData?.address?.street || locationData?.street;
  const city = locationData?.address?.city || locationData?.city;
  const state = locationData?.address?.state || locationData?.state;

  if (!street || !city || !state) return null;

  try {
    const address = `${street}, ${city}, ${state}`;
    const result = await GoogleMapsService.geocodeAddress(address);
    if (result.success && result.data.length > 0) {
      const loc = result.data[0];
      return {
        street, city, state,
        lat: loc.geometry.location.lat,
        lng: loc.geometry.location.lng
      };
    }
  } catch (err) {
    logger.warn('Geocoding failed, continuing without coordinates', { error: err.message });
  }
  return null;
};

const _parseWeight = (weight) => {
  if (!weight) return null;

  if (typeof weight === 'object' && weight.value !== undefined) {
    return weight;
  }

  if (typeof weight === 'string') {
    const match = weight.match(/^([\d.]+)\s*(kg|lbs|lb|g|oz|tons?)?$/i);
    if (match) {
      const value = parseFloat(match[1]);
      let unit = (match[2] || 'lbs').toLowerCase();

      if (unit === 'lb') unit = 'lbs';
      if (unit === 'g') return { value: value * 0.00220462, unit: 'lbs' };
      if (unit === 'oz') return { value: value * 0.0625, unit: 'lbs' };
      if (unit === 'ton' || unit === 'tons') return { value: value * 2000, unit: 'lbs' };
      if (unit === 'kg') return { value: value * 2.20462, unit: 'lbs' };

      return { value, unit };
    }
  }

  return null;
};

// --- Public API ---

const listRentals = async ({ search, category, location, minPrice, maxPrice, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) => {
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
    filter['pricing.daily'] = {};
    if (minPrice) filter['pricing.daily'].$gte = Number(minPrice);
    if (maxPrice) filter['pricing.daily'].$lte = Number(maxPrice);
  }

  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  const skip = (page - 1) * limit;

  const [rentals, total] = await Promise.all([
    rentalsRepo.findAll(filter, { sort, skip, limit: Number(limit) }),
    rentalsRepo.countAll(filter)
  ]);

  return { rentals, total, page: Number(page), pages: Math.ceil(total / limit), count: rentals.length };
};

const getRentalDetail = async (id) => {
  const rental = await rentalsRepo.findById(id, {
    populate: [
      { path: 'owner', select: 'firstName lastName profile.avatar profile.bio profile.rating' },
      { path: 'bookings.user', select: 'firstName lastName profile.avatar' },
      { path: 'reviews.user', select: 'firstName lastName profile.avatar' }
    ],
    lean: true
  });

  if (!rental) throw new NotFoundError('Rental item');

  await rentalsRepo.incrementViews(id);

  return rental;
};

const createRental = async (data, userId) => {
  const rentalData = { ...data, owner: userId };

  if (!rentalData.title && rentalData.name) {
    rentalData.title = rentalData.name;
  }

  if (rentalData.specifications?.weight) {
    const parsedWeight = _parseWeight(rentalData.specifications.weight);
    if (parsedWeight) {
      rentalData.specifications.weight = parsedWeight;
    } else {
      delete rentalData.specifications.weight;
    }
  }

  const geo = await _geocodeLocation(rentalData.location);
  if (geo) {
    if (!rentalData.location.address) rentalData.location.address = {};
    rentalData.location.address.street = geo.street;
    rentalData.location.address.city = geo.city;
    rentalData.location.address.state = geo.state;
    rentalData.location.coordinates = { lat: geo.lat, lng: geo.lng };
  }

  const rental = await rentalsRepo.create(rentalData);
  await rental.populate('owner', 'firstName lastName profile.avatar');
  return rental;
};

const updateRental = async (id, data, user) => {
  const rental = await rentalsRepo.findByIdRaw(id);
  if (!rental) throw new NotFoundError('Rental item');
  _checkOwnership(rental, user);

  if (data.name && !data.title) {
    data.title = data.name;
  }

  if (data.specifications?.weight) {
    const parsedWeight = _parseWeight(data.specifications.weight);
    if (parsedWeight) {
      data.specifications.weight = parsedWeight;
    } else {
      delete data.specifications.weight;
    }
  }

  const street = data.location?.address?.street || data.location?.street;
  const currentStreet = rental.location?.address?.street || rental.location?.street;
  if (street && street !== currentStreet) {
    const geo = await _geocodeLocation(data.location);
    if (geo) {
      if (!data.location.address) data.location.address = {};
      data.location.address.street = geo.street;
      data.location.address.city = geo.city;
      data.location.address.state = geo.state;
      data.location.coordinates = { lat: geo.lat, lng: geo.lng };
    }
  }

  const updated = await rentalsRepo.updateById(id, data);
  return updated;
};

const deleteRental = async (id, user) => {
  const rental = await rentalsRepo.findByIdRaw(id);
  if (!rental) throw new NotFoundError('Rental item');
  _checkOwnership(rental, user);

  rental.isActive = false;
  await rentalsRepo.save(rental);
};

const uploadImages = async (id, files, user) => {
  if (!files || files.length === 0) {
    throw new ValidationError('No files uploaded');
  }

  const rental = await rentalsRepo.findByIdRaw(id);
  if (!rental) throw new NotFoundError('Rental item');
  _checkOwnership(rental, user);

  const uploadResults = await Promise.all(
    files.map(file => CloudinaryService.uploadFile(file, 'localpro/rentals'))
  );

  const successfulUploads = uploadResults
    .filter(r => r.success)
    .map(r => ({ url: r.data.secure_url, publicId: r.data.public_id }));

  if (successfulUploads.length === 0) {
    throw new ValidationError('Failed to upload any images');
  }

  rental.images = [...rental.images, ...successfulUploads];
  await rentalsRepo.save(rental);
  return successfulUploads;
};

const deleteImage = async (id, imageId, user) => {
  const rental = await rentalsRepo.findByIdRaw(id);
  if (!rental) throw new NotFoundError('Rental item');
  _checkOwnership(rental, user);

  const image = rental.images.id(imageId);
  if (!image) throw new NotFoundError('Image');

  await CloudinaryService.deleteFile(image.publicId);
  image.remove();
  await rentalsRepo.save(rental);
};

const getMyRentals = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const [rentals, total] = await Promise.all([
    rentalsRepo.findByOwner(userId, { skip, limit: Number(limit) }),
    rentalsRepo.countByOwner(userId)
  ]);

  return { rentals, total, page: Number(page), pages: Math.ceil(total / limit), count: rentals.length };
};

const getNearbyRentals = async ({ lat, lng, radius = 10, page = 1, limit = 10 }) => {
  if (!lat || !lng) {
    throw new ValidationError('Latitude and longitude are required');
  }

  const skip = (page - 1) * limit;
  const { rentals, total } = await rentalsRepo.findNearby(lng, lat, radius, { skip, limit: Number(limit) });

  return { rentals, total, page: Number(page), pages: Math.ceil(total / limit), count: rentals.length };
};

const getCategories = async () => {
  return rentalsRepo.aggregateCategories();
};

const getFeaturedRentals = async (limit = 10) => {
  return rentalsRepo.findFeatured(Number(limit));
};

module.exports = {
  listRentals,
  getRentalDetail,
  createRental,
  updateRental,
  deleteRental,
  uploadImages,
  deleteImage,
  getMyRentals,
  getNearbyRentals,
  getCategories,
  getFeaturedRentals
};

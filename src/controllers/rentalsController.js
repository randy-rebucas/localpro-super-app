const { RentalItem, Rental } = require('../models/Rentals');

// @desc    Get all rental items
// @route   GET /api/rentals/items
// @access  Public
const getRentalItems = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      location,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { isActive: true, 'availability.isAvailable': true };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (location) {
      filter['location.address.city'] = new RegExp(location, 'i');
    }
    if (minPrice || maxPrice) {
      filter['pricing.daily'] = {};
      if (minPrice) filter['pricing.daily'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.daily'].$lte = Number(maxPrice);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const items = await RentalItem.find(filter)
      .populate('owner', 'firstName lastName profile.avatar profile.rating')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await RentalItem.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: items
    });
  } catch (error) {
    console.error('Get rental items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single rental item
// @route   GET /api/rentals/items/:id
// @access  Public
const getRentalItem = async (req, res) => {
  try {
    const item = await RentalItem.findById(req.params.id)
      .populate('owner', 'firstName lastName profile.avatar profile.rating profile.experience');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Rental item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get rental item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create rental item
// @route   POST /api/rentals/items
// @access  Private
const createRentalItem = async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      owner: req.user.id
    };

    const item = await RentalItem.create(itemData);

    res.status(201).json({
      success: true,
      message: 'Rental item created successfully',
      data: item
    });
  } catch (error) {
    console.error('Create rental item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create rental booking
// @route   POST /api/rentals/book
// @access  Private
const createRental = async (req, res) => {
  try {
    const {
      itemId,
      startDate,
      endDate,
      pickupLocation,
      contactPerson,
      contactPhone
    } = req.body;

    const item = await RentalItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Rental item not found'
      });
    }

    // Check availability
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60)); // in hours

    // Calculate pricing
    let rate = 0;
    let period = 'hourly';
    
    if (duration >= 24 * 30) { // Monthly
      rate = item.pricing.monthly;
      period = 'monthly';
    } else if (duration >= 24 * 7) { // Weekly
      rate = item.pricing.weekly;
      period = 'weekly';
    } else if (duration >= 24) { // Daily
      rate = item.pricing.daily;
      period = 'daily';
    } else { // Hourly
      rate = item.pricing.hourly;
      period = 'hourly';
    }

    const subtotal = rate * Math.ceil(duration / (period === 'hourly' ? 1 : period === 'daily' ? 24 : period === 'weekly' ? 24 * 7 : 24 * 30));
    const deliveryFee = item.location.deliveryAvailable ? item.location.deliveryFee || 0 : 0;
    const deposit = item.requirements.deposit || 0;
    const totalAmount = subtotal + deliveryFee + deposit;

    const rentalData = {
      item: itemId,
      renter: req.user.id,
      owner: item.owner,
      rentalPeriod: {
        startDate: start,
        endDate: end,
        duration
      },
      pricing: {
        rate,
        period,
        subtotal,
        deliveryFee,
        deposit,
        totalAmount,
        currency: item.pricing.currency
      },
      pickup: {
        location: pickupLocation,
        contactPerson,
        contactPhone
      }
    };

    const rental = await Rental.create(rentalData);

    // Update item availability
    item.availability.schedule.push({
      startDate: start,
      endDate: end,
      reason: 'rented'
    });
    await item.save();

    // Populate rental details
    await rental.populate([
      { path: 'item', select: 'name category specifications images' },
      { path: 'renter', select: 'firstName lastName phoneNumber' },
      { path: 'owner', select: 'firstName lastName phoneNumber' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Rental booking created successfully',
      data: rental
    });
  } catch (error) {
    console.error('Create rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user rentals
// @route   GET /api/rentals
// @access  Private
const getUserRentals = async (req, res) => {
  try {
    const { status, type = 'all' } = req.query;
    const userId = req.user.id;

    let filter = {};
    if (type === 'renter') {
      filter.renter = userId;
    } else if (type === 'owner') {
      filter.owner = userId;
    } else {
      filter.$or = [{ renter: userId }, { owner: userId }];
    }

    if (status) filter.status = status;

    const rentals = await Rental.find(filter)
      .populate('item', 'name category specifications images')
      .populate('renter', 'firstName lastName phoneNumber')
      .populate('owner', 'firstName lastName phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rentals.length,
      data: rentals
    });
  } catch (error) {
    console.error('Get user rentals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update rental status
// @route   PUT /api/rentals/:id/status
// @access  Private
const updateRentalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const rentalId = req.params.id;

    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Check if user is authorized to update this rental
    if (rental.renter.toString() !== req.user.id && rental.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rental'
      });
    }

    rental.status = status;
    if (status === 'completed') {
      rental.return.actualTime = new Date();
    }

    await rental.save();

    res.status(200).json({
      success: true,
      message: 'Rental status updated successfully',
      data: rental
    });
  } catch (error) {
    console.error('Update rental status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add review to rental
// @route   POST /api/rentals/:id/review
// @access  Private
const addRentalReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const rentalId = req.params.id;

    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Check if user is the renter and rental is completed
    if (rental.renter.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the renter can add a review'
      });
    }

    if (rental.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed rentals'
      });
    }

    if (rental.review) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this rental'
      });
    }

    rental.review = {
      rating,
      comment,
      createdAt: new Date()
    };

    await rental.save();

    // Update item rating
    const item = await RentalItem.findById(rental.item);
    if (item) {
      const totalRating = item.rating.average * item.rating.count + rating;
      item.rating.count += 1;
      item.rating.average = totalRating / item.rating.count;
      await item.save();
    }

    res.status(200).json({
      success: true,
      message: 'Review added successfully',
      data: rental
    });
  } catch (error) {
    console.error('Add rental review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getRentalItems,
  getRentalItem,
  createRentalItem,
  createRental,
  getUserRentals,
  updateRentalStatus,
  addRentalReview
};

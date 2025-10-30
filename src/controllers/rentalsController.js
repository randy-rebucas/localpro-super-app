const { RentalItem, Rental } = require('../models/Rentals');
const User = require('../models/User');
const CloudinaryService = require('../services/cloudinaryService');
const GoogleMapsService = require('../services/googleMapsService');
const EmailService = require('../services/emailService');
const { validateObjectId } = require('../utils/controllerValidation');

// @desc    Get all rental items
// @route   GET /api/rentals
// @access  Public
const getRentalItem = async (req, res) => {
  try {
    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Text search
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Location filter
    if (location) {
      filter['location.city'] = new RegExp(location, 'i');
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter['pricing.daily'] = {};
      if (minPrice) filter['pricing.daily'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.daily'].$lte = Number(maxPrice);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const rentals = await RentalItem.find(filter)
      .populate('owner', 'firstName lastName profile.avatar profile.rating')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await RentalItem.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: rentals.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: rentals
    });
  } catch (error) {
    console.error('Get rentals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single rental item
// @route   GET /api/rentals/:id
// @access  Public
const getRental = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rental ID format'
      });
    }

    const rental = await RentalItem.findById(req.params.id)
      .populate('owner', 'firstName lastName profile.avatar profile.bio profile.rating')
      .populate('bookings.user', 'firstName lastName profile.avatar')
      .populate('reviews.user', 'firstName lastName profile.avatar');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental item not found'
      });
    }

    // Increment view count
    rental.views += 1;
    await rental.save();

    res.status(200).json({
      success: true,
      data: rental
    });
  } catch (error) {
    console.error('Get rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new rental item
// @route   POST /api/rentals
// @access  Private
const createRental = async (req, res) => {
  try {
    const rentalData = {
      ...req.body,
      owner: req.user.id
    };

    // Geocode location if provided
    if (rentalData.location?.street) {
      try {
        const address = `${rentalData.location.street}, ${rentalData.location.city}, ${rentalData.location.state}`;
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);
        
        if (geocodeResult.success && geocodeResult.data.length > 0) {
          const location = geocodeResult.data[0];
          rentalData.location.coordinates = {
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng
          };
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    const rental = await RentalItem.create(rentalData);

    await rental.populate('owner', 'firstName lastName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Rental item created successfully',
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

// @desc    Update rental item
// @route   PUT /api/rentals/:id
// @access  Private
const updateRental = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rental ID format'
      });
    }

    let rental = await RentalItem.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental item not found'
      });
    }

    // Check if user is the owner
    if (rental.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rental item'
      });
    }

    // Geocode location if changed
    if (req.body.location?.street && 
        req.body.location.street !== rental.location.street) {
      try {
        const address = `${req.body.location.street}, ${req.body.location.city}, ${req.body.location.state}`;
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);
        
        if (geocodeResult.success && geocodeResult.data.length > 0) {
          const location = geocodeResult.data[0];
          req.body.location.coordinates = {
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng
          };
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    rental = await RentalItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Rental item updated successfully',
      data: rental
    });
  } catch (error) {
    console.error('Update rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete rental item
// @route   DELETE /api/rentals/:id
// @access  Private
const deleteRental = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rental ID format'
      });
    }

    const rental = await RentalItem.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental item not found'
      });
    }

    // Check if user is the owner
    if (rental.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this rental item'
      });
    }

    // Soft delete
    rental.isActive = false;
    await rental.save();

    res.status(200).json({
      success: true,
      message: 'Rental item deleted successfully'
    });
  } catch (error) {
    console.error('Delete rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload rental images
// @route   POST /api/rentals/:id/images
// @access  Private
const uploadRentalImages = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rental ID format'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const rental = await RentalItem.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental item not found'
      });
    }

    // Check if user is the owner
    if (rental.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload images for this rental item'
      });
    }

    const uploadPromises = req.files.map(file => 
      CloudinaryService.uploadFile(file, 'localpro/rentals')
    );

    const uploadResults = await Promise.all(uploadPromises);

    const successfulUploads = uploadResults
      .filter(result => result.success)
      .map(result => ({
        url: result.data.secure_url,
        publicId: result.data.public_id
      }));

    if (successfulUploads.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload any images'
      });
    }

    // Add new images to rental
    rental.images = [...rental.images, ...successfulUploads];
    await rental.save();

    res.status(200).json({
      success: true,
      message: `${successfulUploads.length} image(s) uploaded successfully`,
      data: successfulUploads
    });
  } catch (error) {
    console.error('Upload rental images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete rental image
// @route   DELETE /api/rentals/:id/images/:imageId
// @access  Private
const deleteRentalImage = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rental ID format'
      });
    }

    const { imageId } = req.params;

    const rental = await RentalItem.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental item not found'
      });
    }

    // Check if user is the owner
    if (rental.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete images for this rental item'
      });
    }

    const image = rental.images.id(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete from Cloudinary
    await CloudinaryService.deleteFile(image.publicId);

    // Remove from rental
    image.remove();
    await rental.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete rental image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Book rental item
// @route   POST /api/rentals/:id/book
// @access  Private
const bookRental = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rental ID format'
      });
    }

    const { 
      startDate,
      endDate,
      quantity = 1,
      specialRequests,
      contactInfo
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const rental = await RentalItem.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental item not found'
      });
    }

    // Check if rental is available
    if (!rental.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Rental item is not available'
      });
    }

    // Check if dates are valid
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start <= now) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be in the future'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Check availability
    const isAvailable = rental.checkAvailability(start, end, quantity);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Rental item is not available for the selected dates'
      });
    }

    // Calculate total cost
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalCost = rental.pricing.daily * days * quantity;

    const booking = {
      user: req.user.id,
      startDate: start,
      endDate: end,
      quantity,
      totalCost,
      specialRequests,
      contactInfo,
      status: 'pending',
      createdAt: new Date()
    };

    rental.bookings.push(booking);
    await rental.save();

    // Send notification email to owner
    await EmailService.sendEmail({
      to: rental.owner.email,
      subject: 'New Rental Booking',
      template: 'booking-confirmation',
      data: {
        rentalTitle: rental.title,
        clientName: `${req.user.firstName} ${req.user.lastName}`,
        startDate,
        endDate,
        quantity,
        totalCost,
        specialRequests
      }
    });

    res.status(201).json({
      success: true,
      message: 'Rental item booked successfully',
      data: booking
    });
  } catch (error) {
    console.error('Book rental error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/rentals/:id/bookings/:bookingId/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rental ID format'
      });
    }

    const { bookingId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const rental = await RentalItem.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental item not found'
      });
    }

    // Check if user is the owner
    if (rental.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update booking status'
      });
    }

    const booking = rental.bookings.id(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    booking.updatedAt = new Date();

    await rental.save();

    // Send notification email to client
    const client = await User.findById(booking.user);
    await EmailService.sendEmail({
      to: client.email,
      subject: 'Rental Booking Status Update',
      template: 'application-status-update',
      data: {
        rentalTitle: rental.title,
        status,
        startDate: booking.startDate,
        endDate: booking.endDate
      }
    });

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add rental review
// @route   POST /api/rentals/:id/reviews
// @access  Private
const addRentalReview = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rental ID format'
      });
    }

    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const rental = await RentalItem.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental item not found'
      });
    }

    // Check if user has booked this rental
    const hasBooked = rental.bookings.some(booking => 
      booking.user.toString() === req.user.id && 
      booking.status === 'completed'
    );

    if (!hasBooked) {
      return res.status(403).json({
        success: false,
        message: 'You can only review rental items you have booked and completed'
      });
    }

    // Check if user has already reviewed
    const existingReview = rental.reviews.find(review => 
      review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this rental item'
      });
    }

    const review = {
      user: req.user.id,
      rating,
      comment,
      createdAt: new Date()
    };

    rental.reviews.push(review);

    // Update average rating
    const totalRating = rental.reviews.reduce((sum, review) => sum + review.rating, 0);
    rental.averageRating = totalRating / rental.reviews.length;

    await rental.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (error) {
    console.error('Add rental review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's rental items
// @route   GET /api/rentals/my-rentals
// @access  Private
const getMyRentalItem = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const rentals = await RentalItem.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await RentalItem.countDocuments({ owner: req.user.id });

    res.status(200).json({
      success: true,
      count: rentals.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: rentals
    });
  } catch (error) {
    console.error('Get my rentals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's rental bookings
// @route   GET /api/rentals/my-bookings
// @access  Private
const getMyRentalBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const rentals = await RentalItem.find({
      'bookings.user': req.user.id
    })
    .populate('owner', 'firstName lastName profile.avatar')
    .sort({ 'bookings.createdAt': -1 })
    .skip(skip)
    .limit(Number(limit));

    // Extract bookings for the user
    const userBookings = [];
    rentals.forEach(rental => {
      rental.bookings.forEach(booking => {
        if (booking.user.toString() === req.user.id) {
          userBookings.push({
            ...booking.toObject(),
            rental: {
              _id: rental._id,
              title: rental.title,
              owner: rental.owner
            }
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      count: userBookings.length,
      data: userBookings
    });
  } catch (error) {
    console.error('Get my rental bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get nearby rental items
// @route   GET /api/rentals/nearby
// @access  Public
const getNearbyRentalItem = async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const skip = (page - 1) * limit;

    const rentals = await RentalItem.find({
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .populate('owner', 'firstName lastName profile.avatar profile.rating')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

    const total = await RentalItem.countDocuments({
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000
        }
      }
    });

    res.status(200).json({
      success: true,
      count: rentals.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: rentals
    });
  } catch (error) {
    console.error('Get nearby rentals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get rental categories
// @route   GET /api/rentals/categories
// @access  Public
const getRentalCategories = async (req, res) => {
  try {
    const categories = await RentalItem.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get rental categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get featured rental items
// @route   GET /api/rentals/featured
// @access  Public
const getFeaturedRentalItem = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const rentals = await RentalItem.find({
      isActive: true,
      isFeatured: true
    })
    .populate('owner', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: rentals.length,
      data: rentals
    });
  } catch (error) {
    console.error('Get featured rentals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get rental statistics
// @route   GET /api/rentals/statistics
// @access  Private (Admin only)
const getRentalStatistics = async (req, res) => {
  try {
    // Get total rentals
    const totalRentalItem = await RentalItem.countDocuments();

    // Get rentals by category
    const rentalsByCategory = await RentalItem.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get total bookings
    const totalBookings = await RentalItem.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: { $size: '$bookings' } }
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await RentalItem.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRentalItem,
        rentalsByCategory,
        totalBookings: totalBookings[0]?.totalBookings || 0,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Get rental statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getRentalItem,
  getRental,
  createRental,
  updateRental,
  deleteRental,
  uploadRentalImages,
  deleteRentalImage,
  bookRental,
  updateBookingStatus,
  addRentalReview,
  getMyRentalItem,
  getMyRentalBookings,
  getNearbyRentalItem,
  getRentalCategories,
  getFeaturedRentalItem,
  getRentalStatistics
};
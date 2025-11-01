const { FacilityCareService: FacilityCare } = require('../models/FacilityCare');
const CloudinaryService = require('../services/cloudinaryService');
const GoogleMapsService = require('../services/googleMapsService');
const EmailService = require('../services/emailService');

// @desc    Get all facility care services
// @route   GET /api/facility-care
// @access  Public
const getFacilityCareServices = async (req, res) => {
  try {
    const {
      search,
      location,
      serviceType,
      facilityType,
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
        { 'facility.name': new RegExp(search, 'i') }
      ];
    }

    // Location filter
    if (location) {
      filter['facility.address.city'] = new RegExp(location, 'i');
    }

    // Service type filter
    if (serviceType) {
      filter.serviceType = serviceType;
    }

    // Facility type filter
    if (facilityType) {
      filter['facility.type'] = facilityType;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const services = await FacilityCare.find(filter)
      .populate('provider', 'firstName lastName profile.avatar profile.rating')
      .populate('facility.owner', 'firstName lastName profile.avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await FacilityCare.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: services.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: services
    });
  } catch (error) {
    console.error('Get facility care services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single facility care service
// @route   GET /api/facility-care/:id
// @access  Public
const getFacilityCareService = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid facility care service ID format'
      });
    }

    const service = await FacilityCare.findById(req.params.id)
      .populate('provider', 'firstName lastName profile.avatar profile.bio profile.rating profile.experience')
      .populate('facility.owner', 'firstName lastName profile.avatar profile.bio')
      .populate('bookings.client', 'firstName lastName profile.avatar')
      .populate('reviews.user', 'firstName lastName profile.avatar');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Facility care service not found'
      });
    }

    // Increment view count
    service.views += 1;
    await service.save();

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get facility care service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create facility care service
// @route   POST /api/facility-care
// @access  Private
const createFacilityCareService = async (req, res) => {
  try {
    const serviceData = {
      ...req.body,
      provider: req.user.id
    };

    // Geocode facility address if provided
    if (serviceData.facility?.address?.street) {
      try {
        const address = `${serviceData.facility.address.street}, ${serviceData.facility.address.city}, ${serviceData.facility.address.state}`;
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);
        
        if (geocodeResult.success && geocodeResult.data.length > 0) {
          const location = geocodeResult.data[0];
          serviceData.facility.address.coordinates = {
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng
          };
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    const service = await FacilityCare.create(serviceData);

    await service.populate('provider', 'firstName lastName profile.avatar');
    await service.populate('facility.owner', 'firstName lastName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Facility care service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Create facility care service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update facility care service
// @route   PUT /api/facility-care/:id
// @access  Private
const updateFacilityCareService = async (req, res) => {
  try {
    let service = await FacilityCare.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Facility care service not found'
      });
    }

    // Check if user is the provider
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service'
      });
    }

    // Geocode facility address if changed
    if (req.body.facility?.address?.street && 
        req.body.facility.address.street !== service.facility.address.street) {
      try {
        const address = `${req.body.facility.address.street}, ${req.body.facility.address.city}, ${req.body.facility.address.state}`;
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);
        
        if (geocodeResult.success && geocodeResult.data.length > 0) {
          const location = geocodeResult.data[0];
          req.body.facility.address.coordinates = {
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng
          };
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        // Continue without geocoding if it fails
      }
    }

    service = await FacilityCare.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Facility care service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Update facility care service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete facility care service
// @route   DELETE /api/facility-care/:id
// @access  Private
const deleteFacilityCareService = async (req, res) => {
  try {
    const service = await FacilityCare.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Facility care service not found'
      });
    }

    // Check if user is the provider
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service'
      });
    }

    // Soft delete
    service.isActive = false;
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Facility care service deleted successfully'
    });
  } catch (error) {
    console.error('Delete facility care service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload facility care service images
// @route   POST /api/facility-care/:id/images
// @access  Private
const uploadFacilityCareImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const service = await FacilityCare.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Facility care service not found'
      });
    }

    // Check if user is the provider
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload images for this service'
      });
    }

    const uploadPromises = req.files.map(file => 
      CloudinaryService.uploadFile(file, 'localpro/facility-care')
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

    // Add new images to service
    service.images = [...service.images, ...successfulUploads];
    await service.save();

    res.status(200).json({
      success: true,
      message: `${successfulUploads.length} image(s) uploaded successfully`,
      data: successfulUploads
    });
  } catch (error) {
    console.error('Upload facility care images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete facility care service image
// @route   DELETE /api/facility-care/:id/images/:imageId
// @access  Private
const deleteFacilityCareImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const service = await FacilityCare.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Facility care service not found'
      });
    }

    // Check if user is the provider
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete images for this service'
      });
    }

    const image = service.images.id(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete from Cloudinary
    await CloudinaryService.deleteFile(image.publicId);

    // Remove from service
    image.remove();
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete facility care image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Book facility care service
// @route   POST /api/facility-care/:id/book
// @access  Private
const bookFacilityCareService = async (req, res) => {
  try {
    const { 
      facilityId,
      serviceDate,
      serviceTime,
      duration,
      specialInstructions,
      contactInfo
    } = req.body;

    if (!facilityId || !serviceDate || !serviceTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID, service date, time, and duration are required'
      });
    }

    const service = await FacilityCare.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Facility care service not found'
      });
    }

    // Check if service is available
    if (!service.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Service is not available'
      });
    }

    // Check if date is in the future
    const bookingDate = new Date(`${serviceDate}T${serviceTime}`);
    if (bookingDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Service date must be in the future'
      });
    }

    const booking = {
      client: req.user.id,
      facilityId,
      serviceDate: new Date(serviceDate),
      serviceTime,
      duration,
      specialInstructions,
      contactInfo,
      status: 'pending',
      createdAt: new Date()
    };

    service.bookings.push(booking);
    await service.save();

    // Send notification email to provider
    await EmailService.sendEmail({
      to: service.provider.email,
      subject: 'New Facility Care Booking',
      template: 'booking-confirmation',
      data: {
        serviceTitle: service.title,
        clientName: `${req.user.firstName} ${req.user.lastName}`,
        serviceDate,
        serviceTime,
        duration,
        specialInstructions
      }
    });

    res.status(201).json({
      success: true,
      message: 'Facility care service booked successfully',
      data: booking
    });
  } catch (error) {
    console.error('Book facility care service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/facility-care/:id/bookings/:bookingId/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const service = await FacilityCare.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Facility care service not found'
      });
    }

    // Check if user is the provider
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update booking status'
      });
    }

    const booking = service.bookings.id(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    booking.updatedAt = new Date();

    await service.save();

    // Send notification email to client
    await EmailService.sendEmail({
      to: booking.client.email,
      subject: 'Facility Care Booking Status Update',
      template: 'application-status-update',
      data: {
        serviceTitle: service.title,
        status,
        serviceDate: booking.serviceDate,
        serviceTime: booking.serviceTime
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

// @desc    Add review to facility care service
// @route   POST /api/facility-care/:id/reviews
// @access  Private
const addFacilityCareReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const service = await FacilityCare.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Facility care service not found'
      });
    }

    // Check if user has booked this service
    const hasBooked = service.bookings.some(booking => 
      booking.client.toString() === req.user.id && 
      booking.status === 'completed'
    );

    if (!hasBooked) {
      return res.status(403).json({
        success: false,
        message: 'You can only review services you have booked and completed'
      });
    }

    // Check if user has already reviewed
    const existingReview = service.reviews.find(review => 
      review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this service'
      });
    }

    const review = {
      user: req.user.id,
      rating,
      comment,
      createdAt: new Date()
    };

    service.reviews.push(review);

    // Update average rating
    const totalRating = service.reviews.reduce((sum, review) => sum + review.rating, 0);
    service.averageRating = totalRating / service.reviews.length;

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (error) {
    console.error('Add facility care review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's facility care services
// @route   GET /api/facility-care/my/services
// @access  Private
const getMyFacilityCareServices = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const services = await FacilityCare.find({ provider: req.user.id })
      .populate('facility.owner', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await FacilityCare.countDocuments({ provider: req.user.id });

    res.status(200).json({
      success: true,
      count: services.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: services
    });
  } catch (error) {
    console.error('Get my facility care services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's facility care bookings
// @route   GET /api/facility-care/my/bookings
// @access  Private
const getMyFacilityCareBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const services = await FacilityCare.find({
      'bookings.client': req.user.id
    })
    .populate('provider', 'firstName lastName profile.avatar')
    .populate('facility.owner', 'firstName lastName profile.avatar')
    .sort({ 'bookings.createdAt': -1 })
    .skip(skip)
    .limit(Number(limit));

    // Extract bookings for the user
    const userBookings = [];
    services.forEach(service => {
      service.bookings.forEach(booking => {
        if (booking.client.toString() === req.user.id) {
          userBookings.push({
            ...booking.toObject(),
            service: {
              _id: service._id,
              title: service.title,
              provider: service.provider
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
    console.error('Get my facility care bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get nearby facility care services
// @route   GET /api/facility-care/nearby
// @access  Public
const getNearbyFacilityCareServices = async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const skip = (page - 1) * limit;

    const services = await FacilityCare.find({
      isActive: true,
      'facility.address.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .populate('provider', 'firstName lastName profile.avatar profile.rating')
    .populate('facility.owner', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

    const total = await FacilityCare.countDocuments({
      isActive: true,
      'facility.address.coordinates': {
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
      count: services.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: services
    });
  } catch (error) {
    console.error('Get nearby facility care services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getFacilityCareServices,
  getFacilityCareService,
  createFacilityCareService,
  updateFacilityCareService,
  deleteFacilityCareService,
  uploadFacilityCareImages,
  deleteFacilityCareImage,
  bookFacilityCareService,
  updateBookingStatus,
  addFacilityCareReview,
  getMyFacilityCareServices,
  getMyFacilityCareBookings,
  getNearbyFacilityCareServices
};
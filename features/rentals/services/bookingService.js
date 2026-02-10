const User = require('../../../src/models/User');
const rentalsRepo = require('../repositories/rentalsRepository');
const bookingRepo = require('../repositories/bookingRepository');
const EmailService = require('../../../src/services/emailService');
const logger = require('../../../src/config/logger');
const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/RentalsErrors');

const createBooking = async (rentalId, { startDate, endDate, quantity = 1, specialRequests, contactInfo }, user) => {
  if (!startDate || !endDate) {
    throw new ValidationError('Start date and end date are required');
  }

  const rental = await rentalsRepo.findByIdRaw(rentalId);
  if (!rental) throw new NotFoundError('Rental item');

  if (!rental.isActive) {
    throw new ValidationError('Rental item is not available');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (start <= now) {
    throw new ValidationError('Start date must be in the future');
  }

  if (end <= start) {
    throw new ValidationError('End date must be after start date');
  }

  const isAvailable = rental.checkAvailability(start, end, quantity);
  if (!isAvailable) {
    throw new ValidationError('Rental item is not available for the selected dates');
  }

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const totalCost = rental.pricing.daily * days * quantity;

  const booking = {
    user: user.id,
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
  await rentalsRepo.save(rental);

  try {
    await EmailService.sendEmail({
      to: rental.owner.email,
      subject: 'New Rental Booking',
      template: 'booking-confirmation',
      data: {
        rentalTitle: rental.title,
        clientName: `${user.firstName} ${user.lastName}`,
        startDate,
        endDate,
        quantity,
        totalCost,
        specialRequests
      }
    });
  } catch (err) {
    logger.warn('Failed to send booking notification email', { error: err.message });
  }

  return booking;
};

const updateBookingStatus = async (rentalId, bookingId, status, user) => {
  if (!status) {
    throw new ValidationError('Status is required');
  }

  const rental = await rentalsRepo.findByIdRaw(rentalId);
  if (!rental) throw new NotFoundError('Rental item');

  const userRoles = user.roles || [];
  const isAdmin = userRoles.includes('admin');
  const isOwner = rental.owner.toString() === user.id;
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('Not authorized to update booking status');
  }

  const booking = bookingRepo.findBookingInRental(rental, bookingId);
  if (!booking) throw new NotFoundError('Booking');

  booking.status = status;
  booking.updatedAt = new Date();

  await rentalsRepo.save(rental);

  try {
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
  } catch (err) {
    logger.warn('Failed to send booking status email', { error: err.message });
  }

  return booking;
};

const getMyBookings = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const rentals = await rentalsRepo.findWithUserBookings(userId, { skip, limit: Number(limit) });
  const userBookings = bookingRepo.extractUserBookings(rentals, userId);

  return { bookings: userBookings, count: userBookings.length };
};

module.exports = {
  createBooking,
  updateBookingStatus,
  getMyBookings
};

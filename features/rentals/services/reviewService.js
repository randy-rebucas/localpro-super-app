const rentalsRepo = require('../repositories/rentalsRepository');
const reviewRepo = require('../repositories/reviewRepository');
const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require('../errors/RentalsErrors');

const addReview = async (rentalId, { rating, comment }, userId) => {
  if (!rating || rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }

  const rental = await rentalsRepo.findByIdRaw(rentalId);
  if (!rental) throw new NotFoundError('Rental item');

  if (!reviewRepo.hasCompletedBooking(rental, userId)) {
    throw new ForbiddenError('You can only review rental items you have booked and completed');
  }

  if (reviewRepo.findUserReview(rental, userId)) {
    throw new ConflictError('You have already reviewed this rental item');
  }

  const review = {
    user: userId,
    rating,
    comment,
    createdAt: new Date()
  };

  rental.reviews.push(review);

  const totalRating = rental.reviews.reduce((sum, r) => sum + r.rating, 0);
  rental.averageRating = totalRating / rental.reviews.length;

  await rentalsRepo.save(rental);

  return review;
};

module.exports = {
  addReview
};

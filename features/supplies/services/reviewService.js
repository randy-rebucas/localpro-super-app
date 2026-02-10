const suppliesRepo = require('../repositories/suppliesRepository');
const reviewRepo = require('../repositories/reviewRepository');
const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require('../errors/SuppliesErrors');

const addReview = async (supplyId, { rating, comment }, userId) => {
  if (!rating || rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }

  const supply = await suppliesRepo.findByIdRaw(supplyId);
  if (!supply) throw new NotFoundError('Supply item');

  if (!reviewRepo.hasCompletedOrder(supply, userId)) {
    throw new ForbiddenError('You can only review supply items you have ordered and completed');
  }

  if (reviewRepo.findUserReview(supply, userId)) {
    throw new ConflictError('You have already reviewed this supply item');
  }

  const review = {
    user: userId,
    rating,
    comment,
    createdAt: new Date()
  };

  supply.reviews.push(review);

  const totalRating = supply.reviews.reduce((sum, r) => sum + r.rating, 0);
  supply.averageRating = totalRating / supply.reviews.length;

  await suppliesRepo.save(supply);

  return review;
};

module.exports = {
  addReview
};

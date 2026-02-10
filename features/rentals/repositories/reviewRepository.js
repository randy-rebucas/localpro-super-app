const findUserReview = (rentalDoc, userId) => {
  return rentalDoc.reviews.find(review =>
    review.user.toString() === userId
  );
};

const hasCompletedBooking = (rentalDoc, userId) => {
  return rentalDoc.bookings.some(booking =>
    booking.user.toString() === userId &&
    booking.status === 'completed'
  );
};

module.exports = {
  findUserReview,
  hasCompletedBooking
};

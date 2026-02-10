const findUserReview = (supplyDoc, userId) => {
  return supplyDoc.reviews.find(review =>
    review.user.toString() === userId
  );
};

const hasCompletedOrder = (supplyDoc, userId) => {
  return supplyDoc.orders.some(order =>
    order.user.toString() === userId &&
    order.status === 'completed'
  );
};

module.exports = {
  findUserReview,
  hasCompletedOrder
};

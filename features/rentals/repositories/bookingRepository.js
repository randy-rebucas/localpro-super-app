const findBookingInRental = (rentalDoc, bookingId) => {
  return rentalDoc.bookings.id(bookingId);
};

const extractUserBookings = (rentals, userId) => {
  const userBookings = [];
  rentals.forEach(rental => {
    rental.bookings.forEach(booking => {
      if (booking.user.toString() === userId) {
        userBookings.push({
          ...booking.toObject(),
          rental: {
            _id: rental._id,
            title: rental.title,
            name: rental.name,
            owner: rental.owner
          }
        });
      }
    });
  });
  return userBookings;
};

module.exports = {
  findBookingInRental,
  extractUserBookings
};

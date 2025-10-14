const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getRentalItems,
  getRentalItem,
  createRentalItem,
  createRental,
  getUserRentals,
  updateRentalStatus,
  addRentalReview
} = require('../controllers/rentalsController');

const router = express.Router();

// Public routes
router.get('/items', getRentalItems);
router.get('/items/:id', getRentalItem);

// Protected routes
router.use(auth);

// Rental item routes
router.post('/items', createRentalItem);

// Rental booking routes
router.post('/book', createRental);
router.get('/', getUserRentals);
router.put('/:id/status', updateRentalStatus);
router.post('/:id/review', addRentalReview);

module.exports = router;

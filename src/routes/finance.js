const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  applyForLoan,
  getUserLoans,
  applyForSalaryAdvance,
  getUserSalaryAdvances,
  getUserTransactions,
  approveLoan,
  disburseLoan
} = require('../controllers/financeController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Loan routes
router.post('/loans/apply', applyForLoan);
router.get('/loans', getUserLoans);

// Salary advance routes
router.post('/salary-advance/apply', applyForSalaryAdvance);
router.get('/salary-advances', getUserSalaryAdvances);

// Transaction routes
router.get('/transactions', getUserTransactions);

// Admin routes
router.put('/loans/:id/approve', authorize('admin'), approveLoan);
router.put('/loans/:id/disburse', authorize('admin'), disburseLoan);

module.exports = router;

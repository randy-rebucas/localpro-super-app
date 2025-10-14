const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  applyForLoan,
  getUserLoans,
  applyForSalaryAdvance,
  getUserSalaryAdvances,
  getUserTransactions,
  approveLoan,
  disburseLoan,
  repayLoanWithPayPal,
  approvePayPalLoanRepayment,
  repaySalaryAdvanceWithPayPal,
  approvePayPalSalaryAdvanceRepayment
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

// PayPal payment routes
router.post('/loans/:id/repay/paypal', repayLoanWithPayPal);
router.post('/loans/repay/paypal/approve', approvePayPalLoanRepayment);
router.post('/salary-advances/:id/repay/paypal', repaySalaryAdvanceWithPayPal);
router.post('/salary-advances/repay/paypal/approve', approvePayPalSalaryAdvanceRepayment);

module.exports = router;

const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getFinancialOverview,
  getTransactions,
  getEarnings,
  getExpenses,
  addExpense,
  requestWithdrawal,
  processWithdrawal,
  getTaxDocuments,
  getFinancialReports,
  updateWalletSettings
} = require('../controllers/financeController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Financial overview and analytics
router.get('/overview', getFinancialOverview);
router.get('/transactions', getTransactions);
router.get('/earnings', getEarnings);
router.get('/expenses', getExpenses);
router.get('/reports', getFinancialReports);

// Expense management
router.post('/expenses', addExpense);

// Withdrawal management
router.post('/withdraw', requestWithdrawal);
router.put('/withdrawals/:withdrawalId/process', authorize('admin'), processWithdrawal); // [ADMIN ONLY]

// Tax documents
router.get('/tax-documents', getTaxDocuments);

// Wallet settings
router.put('/wallet/settings', updateWalletSettings);

module.exports = router;

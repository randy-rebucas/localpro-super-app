const express = require('express');
const multer = require('multer');
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
  updateWalletSettings,
  requestTopUp,
  processTopUp
} = require('../controllers/financeController');

const router = express.Router();

// Configure multer for receipt image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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

// Top-up management
router.post('/top-up', upload.single('receipt'), requestTopUp);
router.put('/top-ups/:topUpId/process', authorize('admin'), processTopUp); // [ADMIN ONLY]

module.exports = router;
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
  getTopUpRequests,
  getMyTopUpRequests,
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

/**
 * @swagger
 * /api/finance/overview:
 *   get:
 *     summary: Get financial overview
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial overview
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Financial overview and analytics
router.get('/overview', getFinancialOverview);

/**
 * @swagger
 * /api/finance/transactions:
 *   get:
 *     summary: Get financial transactions
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense, withdrawal, deposit]
 *     responses:
 *       200:
 *         description: List of transactions
 */
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
router.get('/top-ups', authorize('admin'), getTopUpRequests); // [ADMIN ONLY]
router.get('/top-ups/my-requests', getMyTopUpRequests);
router.put('/top-ups/:topUpId/process', authorize('admin'), processTopUp); // [ADMIN ONLY]

module.exports = router;
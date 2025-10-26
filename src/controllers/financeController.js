const { Transaction, Finance } = require('../models/Finance');
const User = require('../models/User');
const { Booking } = require('../models/Marketplace');
// const Job = require('../models/Job');
const Referral = require('../models/Referral');
// const Agency = require('../models/Agency');
// const PayPalService = require('../services/paypalService');
// const PayMayaService = require('../services/paymayaService');
const EmailService = require('../services/emailService');
const logger = require('../utils/logger');


// @desc    Get user's financial overview
// @route   GET /api/finance/overview
// @access  Private
const getFinancialOverview = async(req, res) => {
  try {
    const userId = req.user.id;

    // Get user's financial data
    const finance = await Transaction.findOne({ user: userId });

    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Financial data not found'
      });
    }

    // Get recent transactions
    const recentTransactions = await Transaction.findOne({ user: userId })
      .select('transactions')
      .sort({ 'transactions.timestamp': -1 })
      .limit(10);

    // Get monthly earnings
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyEarnings = await Booking.aggregate([
      {
        $match: {
          type: 'booking',
          provider: userId,
          status: 'completed',
          createdAt: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$pricing.total' },
          bookingCount: { $sum: 1 }
        }
      }
    ]);

    // Get pending payments
    const pendingPayments = await Booking.aggregate([
      {
        $match: {
          type: 'booking',
          provider: userId,
          status: 'completed',
          'payment.status': 'pending'
        }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: '$pricing.total' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get referral earnings
    const referralEarnings = await Referral.aggregate([
      {
        $match: {
          referrer: userId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$rewardDistribution.referrerReward' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        wallet: finance.wallet,
        monthlyEarnings: monthlyEarnings[0] || { totalEarnings: 0, bookingCount: 0 },
        pendingPayments: pendingPayments[0] || { totalPending: 0, count: 0 },
        referralEarnings: referralEarnings[0] || { totalEarnings: 0, count: 0 },
        recentTransactions: recentTransactions?.transactions || []
      }
    });
  } catch (error) {
    logger.error('Get financial overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's transactions
// @route   GET /api/finance/transactions
// @access  Private
const getTransactions = async(req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (page - 1) * limit;

    const finance = await Finance.findOne({ user: req.user.id });

    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Financial data not found'
      });
    }

    // Build filter
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const transactions = finance.transactions
      .filter(transaction => {
        if (type && transaction.type !== type) return false;
        if (status && transaction.status !== status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(skip, skip + Number(limit));

    const total = finance.transactions.filter(transaction => {
      if (type && transaction.type !== type) return false;
      if (status && transaction.status !== status) return false;
      return true;
    }).length;

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's earnings
// @route   GET /api/finance/earnings
// @access  Private
const getEarnings = async(req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get earnings from completed bookings
    const earnings = await Booking.aggregate([
      {
        $match: {
          type: 'booking',
          provider: req.user.id,
          status: 'completed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: groupBy === 'day' ? { $dayOfMonth: '$createdAt' } : null
          },
          totalEarnings: { $sum: '$pricing.total' },
          bookingCount: { $sum: 1 },
          averageEarning: { $avg: '$pricing.total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get earnings by service category
    const earningsByCategory = await Booking.aggregate([
      {
        $match: {
          type: 'booking',
          provider: req.user.id,
          status: 'completed',
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'marketplaces',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceData'
        }
      },
      {
        $unwind: '$serviceData'
      },
      {
        $group: {
          _id: '$serviceData.category',
          totalEarnings: { $sum: '$pricing.total' },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalEarnings: -1 }
      }
    ]);

    // Get total earnings
    const totalEarnings = await Booking.aggregate([
      {
        $match: {
          type: 'booking',
          provider: req.user.id,
          status: 'completed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$pricing.total' },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        earnings,
        earningsByCategory,
        totalEarnings: totalEarnings[0] || { totalEarnings: 0, totalBookings: 0 }
      }
    });
  } catch (error) {
    logger.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's expenses
// @route   GET /api/finance/expenses
// @access  Private
const getExpenses = async(req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    const finance = await Finance.findOne({ user: req.user.id });

    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Financial data not found'
      });
    }

    // Filter expenses
    let expenses = finance.transactions.filter(transaction =>
      transaction.type === 'expense' && transaction.amount < 0
    );

    if (startDate || endDate) {
      expenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.timestamp);
        if (startDate && expenseDate < new Date(startDate)) return false;
        if (endDate && expenseDate > new Date(endDate)) return false;
        return true;
      });
    }

    if (category) {
      expenses = expenses.filter(expense => expense.category === category);
    }

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      acc[category].total += Math.abs(expense.amount);
      acc[category].count += 1;
      return acc;
    }, {});

    // Get monthly expenses
    const monthlyExpenses = expenses.reduce((acc, expense) => {
      const date = new Date(expense.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { total: 0, count: 0 };
      }
      acc[monthKey].total += Math.abs(expense.amount);
      acc[monthKey].count += 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        expenses,
        expensesByCategory,
        monthlyExpenses,
        totalExpenses: expenses.reduce((sum, expense) => sum + Math.abs(expense.amount), 0)
      }
    });
  } catch (error) {
    logger.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add expense
// @route   POST /api/finance/expenses
// @access  Private
const addExpense = async(req, res) => {
  try {
    const { amount, category, description, paymentMethod } = req.body;

    if (!amount || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Amount, category, and description are required'
      });
    }

    let finance = await Finance.findOne({ user: req.user.id });

    if (!finance) {
      finance = await Finance.create({ user: req.user.id });
    }

    const expense = {
      type: 'expense',
      amount: -Math.abs(amount), // Negative amount for expenses
      category,
      description,
      paymentMethod: paymentMethod || 'wallet',
      status: 'completed',
      timestamp: new Date()
    };

    finance.transactions.push(expense);

    // Update wallet balance
    finance.wallet.balance += expense.amount;
    finance.wallet.lastUpdated = new Date();

    await finance.save();

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense
    });
  } catch (error) {
    logger.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Request withdrawal
// @route   POST /api/finance/withdraw
// @access  Private
const requestWithdrawal = async(req, res) => {
  try {
    const { amount, paymentMethod, accountDetails } = req.body;

    if (!amount || !paymentMethod || !accountDetails) {
      return res.status(400).json({
        success: false,
        message: 'Amount, payment method, and account details are required'
      });
    }

    const finance = await Finance.findOne({ user: req.user.id });

    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Financial data not found'
      });
    }

    // Check if user has sufficient balance
    if (finance.wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Check minimum withdrawal amount
    const minWithdrawal = 100; // $100 minimum
    if (amount < minWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is $${minWithdrawal}`
      });
    }

    const withdrawal = {
      type: 'withdrawal',
      amount: -Math.abs(amount),
      category: 'withdrawal',
      description: `Withdrawal request via ${paymentMethod}`,
      paymentMethod,
      accountDetails,
      status: 'pending',
      timestamp: new Date()
    };

    finance.transactions.push(withdrawal);

    // Hold the amount in pending balance
    finance.wallet.balance -= amount;
    finance.wallet.pendingBalance += amount;
    finance.wallet.lastUpdated = new Date();

    await finance.save();

    // Send notification email to admin
    await EmailService.sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Withdrawal Request',
      template: 'withdrawal-request',
      data: {
        userName: `${req.user.firstName} ${req.user.lastName}`,
        amount,
        paymentMethod,
        accountDetails
      }
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: withdrawal
    });
  } catch (error) {
    logger.error('Request withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Process withdrawal
// @route   PUT /api/finance/withdrawals/:withdrawalId/process
// @access  Private (Admin only)
const processWithdrawal = async(req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Find the user with this withdrawal
    const finance = await Finance.findOne({
      'transactions._id': withdrawalId,
      'transactions.type': 'withdrawal'
    });

    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    const withdrawal = finance.transactions.id(withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal has already been processed'
      });
    }

    withdrawal.status = status;
    withdrawal.adminNotes = adminNotes;
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.user.id;

    if (status === 'approved') {
      // Move from pending to completed
      finance.wallet.pendingBalance -= Math.abs(withdrawal.amount);
    } else if (status === 'rejected') {
      // Return amount to available balance
      finance.wallet.balance += Math.abs(withdrawal.amount);
      finance.wallet.pendingBalance -= Math.abs(withdrawal.amount);
    }

    finance.wallet.lastUpdated = new Date();
    await finance.save();

    // Send notification email to user
    const user = await User.findById(finance.user);
    await EmailService.sendEmail({
      to: user.email,
      subject: 'Withdrawal Request Update',
      template: 'withdrawal-status-update',
      data: {
        userName: `${user.firstName} ${user.lastName}`,
        amount: Math.abs(withdrawal.amount),
        status,
        adminNotes
      }
    });

    res.status(200).json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: withdrawal
    });
  } catch (error) {
    logger.error('Process withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get tax documents
// @route   GET /api/finance/tax-documents
// @access  Private
const getTaxDocuments = async(req, res) => {
  try {
    const { year } = req.query;

    const finance = await Finance.findOne({ user: req.user.id });

    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Financial data not found'
      });
    }

    // Get earnings for the year
    const yearFilter = year ? new Date(`${year}-01-01`) : new Date(new Date().getFullYear(), 0, 1);
    const nextYear = new Date(yearFilter);
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const earnings = await Booking.aggregate([
      {
        $match: {
          type: 'booking',
          provider: req.user.id,
          status: 'completed',
          createdAt: { $gte: yearFilter, $lt: nextYear }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$pricing.total' },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    // Get expenses for the year
    const expenses = finance.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp);
      return transaction.type === 'expense' &&
             transactionDate >= yearFilter &&
             transactionDate < nextYear;
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

    // Get referral earnings for the year
    const referralEarnings = await Referral.aggregate([
      {
        $match: {
          referrer: req.user.id,
          status: 'completed',
          createdAt: { $gte: yearFilter, $lt: nextYear }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$rewardDistribution.referrerReward' },
          totalReferrals: { $sum: 1 }
        }
      }
    ]);

    const taxDocument = {
      year: year || new Date().getFullYear(),
      totalEarnings: earnings[0]?.totalEarnings || 0,
      totalBookings: earnings[0]?.totalBookings || 0,
      totalExpenses,
      totalReferralEarnings: referralEarnings[0]?.totalEarnings || 0,
      totalReferrals: referralEarnings[0]?.totalReferrals || 0,
      netIncome: (earnings[0]?.totalEarnings || 0) + (referralEarnings[0]?.totalEarnings || 0) - totalExpenses,
      expenses: expenses.map(expense => ({
        date: expense.timestamp,
        category: expense.category,
        description: expense.description,
        amount: Math.abs(expense.amount)
      }))
    };

    res.status(200).json({
      success: true,
      data: taxDocument
    });
  } catch (error) {
    logger.error('Get tax documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get financial reports
// @route   GET /api/finance/reports
// @access  Private
const getFinancialReports = async(req, res) => {
  try {
    const { startDate, endDate, reportType = 'summary' } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const finance = await Finance.findOne({ user: req.user.id });

    if (!finance) {
      return res.status(404).json({
        success: false,
        message: 'Financial data not found'
      });
    }

    let report = {};

    switch (reportType) {
    case 'summary': {
      // Get summary report
      const summary = await Booking.aggregate([
        {
          $match: {
            type: 'booking',
            provider: req.user.id,
            status: 'completed',
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$pricing.total' },
            totalBookings: { $sum: 1 },
            averageEarning: { $avg: '$pricing.total' }
          }
        }
      ]);

      const expenses = finance.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        if (startDate && transactionDate < new Date(startDate)) return false;
        if (endDate && transactionDate > new Date(endDate)) return false;
        return transaction.type === 'expense';
      });

      const totalExpenses = expenses.reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

      report = {
        totalEarnings: summary[0]?.totalEarnings || 0,
        totalBookings: summary[0]?.totalBookings || 0,
        averageEarning: summary[0]?.averageEarning || 0,
        totalExpenses,
        netIncome: (summary[0]?.totalEarnings || 0) - totalExpenses,
        expenseCount: expenses.length
      };
      break;
    }

    case 'detailed': {
      // Get detailed report
      const detailedEarnings = await Booking.aggregate([
        {
          $match: {
            type: 'booking',
            provider: req.user.id,
            status: 'completed',
            ...dateFilter
          }
        },
        {
          $lookup: {
            from: 'marketplaces',
            localField: 'service',
            foreignField: '_id',
            as: 'serviceData'
          }
        },
        {
          $unwind: '$serviceData'
        },
        {
          $project: {
            date: '$createdAt',
            serviceTitle: '$serviceData.title',
            category: '$serviceData.category',
            amount: '$pricing.total',
            client: '$client'
          }
        },
        {
          $sort: { date: -1 }
        }
      ]);

      // Get expenses for detailed report
      const expenses = finance.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.timestamp);
        if (startDate && transactionDate < new Date(startDate)) return false;
        if (endDate && transactionDate > new Date(endDate)) return false;
        return transaction.type === 'expense';
      });

      report = {
        earnings: detailedEarnings,
        expenses: expenses.map(expense => ({
          date: expense.timestamp,
          category: expense.category,
          description: expense.description,
          amount: Math.abs(expense.amount)
        }))
      };
      break;
    }

    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid report type'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Get financial reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update wallet settings
// @route   PUT /api/finance/wallet/settings
// @access  Private
const updateWalletSettings = async(req, res) => {
  try {
    const { autoWithdraw, minBalance, notificationSettings } = req.body;

    let finance = await Finance.findOne({ user: req.user.id });

    if (!finance) {
      finance = await Finance.create({ user: req.user.id });
    }

    // Update wallet settings
    if (autoWithdraw !== undefined) finance.wallet.autoWithdraw = autoWithdraw;
    if (minBalance !== undefined) finance.wallet.minBalance = minBalance;
    if (notificationSettings) finance.wallet.notificationSettings = notificationSettings;

    finance.wallet.lastUpdated = new Date();
    await finance.save();

    res.status(200).json({
      success: true,
      message: 'Wallet settings updated successfully',
      data: finance.wallet
    });
  } catch (error) {
    logger.error('Update wallet settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
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
};

const { Loan, SalaryAdvance, Transaction } = require('../models/Finance');
const User = require('../models/User');
const EmailService = require('../services/emailService');

// @desc    Apply for loan
// @route   POST /api/finance/loans/apply
// @access  Private
const applyForLoan = async (req, res) => {
  try {
    const {
      type,
      amount,
      purpose,
      term,
      documents
    } = req.body;

    const loanData = {
      borrower: req.user.id,
      type,
      amount: { requested: amount },
      purpose,
      term,
      application: {
        documents: documents || []
      }
    };

    const loan = await Loan.create(loanData);

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: loan
    });
  } catch (error) {
    console.error('Apply for loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user loans
// @route   GET /api/finance/loans
// @access  Private
const getUserLoans = async (req, res) => {
  try {
    const { status, type } = req.query;
    const userId = req.user.id;

    const filter = { borrower: userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const loans = await Loan.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (error) {
    console.error('Get user loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Apply for salary advance
// @route   POST /api/finance/salary-advance/apply
// @access  Private
const applyForSalaryAdvance = async (req, res) => {
  try {
    const {
      amount,
      employerId,
      salary,
      nextPayDate
    } = req.body;

    const salaryAdvanceData = {
      employee: req.user.id,
      employer: employerId,
      amount: { requested: amount },
      salary: {
        monthly: salary,
        nextPayDate: new Date(nextPayDate)
      }
    };

    const salaryAdvance = await SalaryAdvance.create(salaryAdvanceData);

    res.status(201).json({
      success: true,
      message: 'Salary advance application submitted successfully',
      data: salaryAdvance
    });
  } catch (error) {
    console.error('Apply for salary advance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user salary advances
// @route   GET /api/finance/salary-advances
// @access  Private
const getUserSalaryAdvances = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;

    const filter = { employee: userId };
    if (status) filter.status = status;

    const salaryAdvances = await SalaryAdvance.find(filter)
      .populate('employer', 'firstName lastName businessName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: salaryAdvances.length,
      data: salaryAdvances
    });
  } catch (error) {
    console.error('Get user salary advances error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user transactions
// @route   GET /api/finance/transactions
// @access  Private
const getUserTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const filter = { user: userId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve loan (Admin)
// @route   PUT /api/finance/loans/:id/approve
// @access  Private (Admin)
const approveLoan = async (req, res) => {
  try {
    const { approvedAmount, conditions, notes } = req.body;
    const loanId = req.params.id;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    loan.status = 'approved';
    loan.amount.approved = approvedAmount;
    loan.approval = {
      approvedBy: req.user.id,
      approvedAt: new Date(),
      conditions: conditions || [],
      notes
    };

    await loan.save();

    // Populate loan with borrower details for email
    await loan.populate('borrower', 'firstName lastName email');

    // Send loan approval email to borrower if email is available
    if (loan.borrower.email) {
      try {
        await EmailService.sendLoanApproval(loan.borrower.email, loan);
        console.log(`Loan approval email sent to: ${loan.borrower.email}`);
      } catch (emailError) {
        console.error('Failed to send loan approval email:', emailError);
        // Don't fail the approval if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Loan approved successfully',
      data: loan
    });
  } catch (error) {
    console.error('Approve loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Disburse loan (Admin)
// @route   PUT /api/finance/loans/:id/disburse
// @access  Private (Admin)
const disburseLoan = async (req, res) => {
  try {
    const { disbursementMethod, accountDetails, transactionId } = req.body;
    const loanId = req.params.id;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Loan must be approved before disbursement'
      });
    }

    loan.status = 'disbursed';
    loan.amount.disbursed = loan.amount.approved;
    loan.disbursement = {
      method: disbursementMethod,
      accountDetails,
      disbursedAt: new Date(),
      transactionId
    };

    // Create transaction record
    await Transaction.create({
      user: loan.borrower,
      type: 'loan_disbursement',
      amount: loan.amount.disbursed,
      direction: 'inbound',
      reference: `LOAN-${loanId}`,
      status: 'completed',
      paymentMethod: disbursementMethod,
      transactionId,
      metadata: { loanId }
    });

    await loan.save();

    res.status(200).json({
      success: true,
      message: 'Loan disbursed successfully',
      data: loan
    });
  } catch (error) {
    console.error('Disburse loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  applyForLoan,
  getUserLoans,
  applyForSalaryAdvance,
  getUserSalaryAdvances,
  getUserTransactions,
  approveLoan,
  disburseLoan
};

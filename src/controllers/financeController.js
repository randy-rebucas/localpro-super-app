const { Loan, SalaryAdvance, Transaction } = require('../models/Finance');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const PayPalService = require('../services/paypalService');

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

// @desc    Make loan repayment with PayPal
// @route   POST /api/finance/loans/:id/repay/paypal
// @access  Private
const repayLoanWithPayPal = async (req, res) => {
  try {
    const { amount, paymentDetails } = req.body;
    const loanId = req.params.id;
    const userId = req.user.id;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.borrower.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to make payments for this loan'
      });
    }

    // Get user details for PayPal
    const user = await User.findById(userId).select('firstName lastName email');
    
    // Create PayPal order for loan repayment
    const orderData = {
      amount: amount,
      currency: loan.amount.currency,
      description: `Loan repayment for loan #${loanId}`,
      referenceId: `LOAN-REPAY-${loanId}`,
      items: [{
        name: 'Loan Repayment',
        unit_amount: {
          currency_code: loan.amount.currency,
          value: amount.toFixed(2)
        },
        quantity: '1'
      }]
    };

    const paypalOrderResult = await PayPalService.createOrder(orderData);
    
    if (!paypalOrderResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create PayPal payment order'
      });
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user: userId,
      type: 'loan_repayment',
      amount: amount,
      currency: loan.amount.currency,
      direction: 'outbound',
      reference: `LOAN-REPAY-${loanId}`,
      status: 'pending',
      paymentMethod: 'paypal',
      paypalOrderId: paypalOrderResult.data.id,
      metadata: { loanId, paymentDetails }
    });

    res.status(201).json({
      success: true,
      message: 'PayPal payment order created for loan repayment',
      data: {
        transaction,
        paypalApprovalUrl: paypalOrderResult.data.links.find(link => link.rel === 'approve')?.href
      }
    });
  } catch (error) {
    console.error('Repay loan with PayPal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve PayPal loan repayment
// @route   POST /api/finance/loans/repay/paypal/approve
// @access  Private
const approvePayPalLoanRepayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Capture the PayPal order
    const captureResult = await PayPalService.captureOrder(orderId);
    
    if (!captureResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to capture PayPal payment'
      });
    }

    // Find the transaction
    const transaction = await Transaction.findOne({
      user: userId,
      paypalOrderId: orderId,
      type: 'loan_repayment'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update transaction status
    transaction.status = 'completed';
    transaction.paypalTransactionId = captureResult.data.purchase_units[0].payments.captures[0].id;
    await transaction.save();

    // Update loan repayment schedule
    const loanId = transaction.metadata.loanId;
    const loan = await Loan.findById(loanId);
    
    if (loan) {
      // Find the next pending payment
      const nextPayment = loan.repayment.schedule.find(payment => payment.status === 'pending');
      if (nextPayment) {
        nextPayment.status = 'paid';
        nextPayment.paidAt = new Date();
        nextPayment.transactionId = transaction.paypalTransactionId;
      }
      
      // Update total paid amount
      loan.repayment.totalPaid += transaction.amount;
      loan.repayment.remainingBalance = loan.amount.approved - loan.repayment.totalPaid;
      
      await loan.save();
    }

    res.status(200).json({
      success: true,
      message: 'PayPal loan repayment approved successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Approve PayPal loan repayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Make salary advance repayment with PayPal
// @route   POST /api/finance/salary-advances/:id/repay/paypal
// @access  Private
const repaySalaryAdvanceWithPayPal = async (req, res) => {
  try {
    const { amount } = req.body;
    const salaryAdvanceId = req.params.id;
    const userId = req.user.id;

    const salaryAdvance = await SalaryAdvance.findById(salaryAdvanceId);
    if (!salaryAdvance) {
      return res.status(404).json({
        success: false,
        message: 'Salary advance not found'
      });
    }

    if (salaryAdvance.employee.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to make payments for this salary advance'
      });
    }

    // Get user details for PayPal
    const user = await User.findById(userId).select('firstName lastName email');
    
    // Create PayPal order for salary advance repayment
    const orderData = {
      amount: amount,
      currency: salaryAdvance.amount.currency,
      description: `Salary advance repayment #${salaryAdvanceId}`,
      referenceId: `SALARY-REPAY-${salaryAdvanceId}`,
      items: [{
        name: 'Salary Advance Repayment',
        unit_amount: {
          currency_code: salaryAdvance.amount.currency,
          value: amount.toFixed(2)
        },
        quantity: '1'
      }]
    };

    const paypalOrderResult = await PayPalService.createOrder(orderData);
    
    if (!paypalOrderResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create PayPal payment order'
      });
    }

    // Create transaction record
    const transaction = await Transaction.create({
      user: userId,
      type: 'salary_advance',
      amount: amount,
      currency: salaryAdvance.amount.currency,
      direction: 'outbound',
      reference: `SALARY-REPAY-${salaryAdvanceId}`,
      status: 'pending',
      paymentMethod: 'paypal',
      paypalOrderId: paypalOrderResult.data.id,
      metadata: { salaryAdvanceId }
    });

    res.status(201).json({
      success: true,
      message: 'PayPal payment order created for salary advance repayment',
      data: {
        transaction,
        paypalApprovalUrl: paypalOrderResult.data.links.find(link => link.rel === 'approve')?.href
      }
    });
  } catch (error) {
    console.error('Repay salary advance with PayPal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve PayPal salary advance repayment
// @route   POST /api/finance/salary-advances/repay/paypal/approve
// @access  Private
const approvePayPalSalaryAdvanceRepayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Capture the PayPal order
    const captureResult = await PayPalService.captureOrder(orderId);
    
    if (!captureResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to capture PayPal payment'
      });
    }

    // Find the transaction
    const transaction = await Transaction.findOne({
      user: userId,
      paypalOrderId: orderId,
      type: 'salary_advance'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update transaction status
    transaction.status = 'completed';
    transaction.paypalTransactionId = captureResult.data.purchase_units[0].payments.captures[0].id;
    await transaction.save();

    // Update salary advance status
    const salaryAdvanceId = transaction.metadata.salaryAdvanceId;
    const salaryAdvance = await SalaryAdvance.findById(salaryAdvanceId);
    
    if (salaryAdvance) {
      salaryAdvance.status = 'repaid';
      salaryAdvance.repayment.repaidAt = new Date();
      await salaryAdvance.save();
    }

    res.status(200).json({
      success: true,
      message: 'PayPal salary advance repayment approved successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Approve PayPal salary advance repayment error:', error);
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
  disburseLoan,
  repayLoanWithPayPal,
  approvePayPalLoanRepayment,
  repaySalaryAdvanceWithPayPal,
  approvePayPalSalaryAdvanceRepayment
};

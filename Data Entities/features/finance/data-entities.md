# Finance Data Entities

## Loan
- borrower: UserId
- type: ['salary_advance','micro_loan','business_loan','equipment_loan']
- amount: { requested(required,>=0), approved?, disbursed?, currency('USD') }
- purpose: string
- term: { duration(months), interestRate(APR), repaymentFrequency['weekly','bi-weekly','monthly'] }
- status: ['pending','under_review','approved','rejected','disbursed','active','completed','defaulted']
- application: { submittedAt, documents[{ type['income_proof','bank_statement','id_document','business_license','other'], url, uploadedAt }], creditScore, riskAssessment{ score, factors[] } }
- approval: { approvedBy:UserId, approvedAt, conditions[], notes }
- disbursement: { method['bank_transfer','mobile_money','cash'], accountDetails{ bankName, accountNumber, routingNumber }, disbursedAt, transactionId }
- repayment: { schedule[{ dueDate, amount, principal, interest, status['pending','paid','overdue','waived'], paidAt, transactionId }], totalPaid, remainingBalance, nextPaymentDate }
- partner: { name, apiKey, loanId }
- timestamps

Indexes: borrower, status, type, application.submittedAt

## SalaryAdvance
- employee: UserId
- employer: UserId
- amount: { requested(>=0), approved?, currency('USD') }
- salary: { monthly, nextPayDate, frequency['weekly','bi-weekly','monthly'] }
- status: ['pending','approved','rejected','disbursed','repaid']
- repayment: { dueDate, amount, deductedFromSalary(boolean), repaidAt }
- fees: { processingFee, interestRate, totalFees }
- timestamps

Indexes: employee, employer, status

## Transaction
- user: UserId
- type: ['loan_disbursement','loan_repayment','salary_advance','payment','refund','fee']
- amount: number
- currency: 'USD'
- direction: ['inbound','outbound']
- description: string
- reference: string (required)
- status: ['pending','completed','failed','cancelled']
- paymentMethod: ['bank_transfer','mobile_money','card','cash','paypal','paymaya']
- transactionId, externalReference, paypalOrderId, paypalTransactionId,
  paymayaReferenceNumber, paymayaCheckoutId, paymayaPaymentId, paymayaInvoiceId, paymayaTransactionId
- metadata: Mixed
- timestamps

Indexes: user, type, createdAt, reference

## Finance (Wallet)
- user: UserId (unique per doc)
- wallet: { balance, pendingBalance, lastUpdated, autoWithdraw, minBalance,
  notificationSettings{ lowBalance, withdrawal, payment } }
- transactions: [ { type['income','expense','withdrawal','refund','bonus','referral'], amount, category, description, paymentMethod, status, timestamp, reference, accountDetails, adminNotes, processedAt, processedBy:UserId } ]
- timestamps

Indexes: transactions.timestamp, transactions.type

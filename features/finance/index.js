/**
 * Finance Feature Module
 *
 * Public API for the Finance domain: wallet, payments, escrow,
 * quotes/invoices, and referrals.
 * All external code must import from this index -- not from internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/models/User, Marketplace, LocalProPlus, Communication, Job
 * - src/services/emailService, notificationService, cloudinaryService
 * - src/services/paymongoService, paymayaService, paypalService (shared gateways)
 * - src/utils/responseHelper, controllerValidation
 * - src/config/logger
 */

// -- Routes -------------------------------------------------------------------
const routes               = require('./routes/finance');
const walletRoutes         = require('./routes/wallet');
const escrowRoutes         = require('./routes/escrows');
const escrowWebhookRoutes  = require('./routes/escrowWebhooks');
const quotesInvoicesRoutes = require('./routes/quotesInvoices');
const referralsRoutes      = require('./routes/referrals');
const paymongoRoutes       = require('./routes/paymongo');
const paymayaRoutes        = require('./routes/paymaya');
const paypalRoutes         = require('./routes/paypal');

// -- Models -------------------------------------------------------------------
const Finance            = require('./models/Finance');
const Payout             = require('./models/Payout');
const Invoice            = require('./models/Invoice');
const Quote              = require('./models/Quote');
const QuoteTemplate      = require('./models/QuoteTemplate');
const Escrow             = require('./models/Escrow');
const EscrowTransaction  = require('./models/EscrowTransaction');
const UserWallet         = require('./models/UserWallet');
const WalletTransaction  = require('./models/WalletTransaction');
const Referral           = require('./models/Referral');
const UserReferral       = require('./models/UserReferral');

// -- Services -----------------------------------------------------------------
const escrowService                           = require('./services/escrowService');
const referralService                         = require('./services/referralService');
const quoteInvoiceService                     = require('./services/quoteInvoiceService');
const automatedEscrowService                  = require('./services/automatedEscrowService');
const automatedEscrowDisputeEscalationService = require('./services/automatedEscrowDisputeEscalationService');
const automatedFinanceReminderService         = require('./services/automatedFinanceReminderService');
const automatedReferralTierMilestoneService   = require('./services/automatedReferralTierMilestoneService');
const automatedPaymentSyncService             = require('./services/automatedPaymentSyncService');
const automatedSubscriptionService            = require('./services/automatedSubscriptionService');

module.exports = {
  // Routes (mount in server.js)
  routes,
  walletRoutes,
  escrowRoutes,
  escrowWebhookRoutes,
  quotesInvoicesRoutes,
  referralsRoutes,
  paymongoRoutes,
  paymayaRoutes,
  paypalRoutes,

  // Models
  Finance,
  Payout,
  Invoice,
  Quote,
  QuoteTemplate,
  Escrow,
  EscrowTransaction,
  UserWallet,
  WalletTransaction,
  Referral,
  UserReferral,

  // Services
  escrowService,
  referralService,
  quoteInvoiceService,
  automatedEscrowService,
  automatedEscrowDisputeEscalationService,
  automatedFinanceReminderService,
  automatedReferralTierMilestoneService,
  automatedPaymentSyncService,
  automatedSubscriptionService,
};

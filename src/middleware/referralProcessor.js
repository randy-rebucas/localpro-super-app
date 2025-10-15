const ReferralService = require('../services/referralService');
const Referral = require('../models/Referral');
const User = require('../models/User');

/**
 * Middleware to process referral completion for service bookings
 */
const processServiceBookingReferral = async (req, res, next) => {
  try {
    const booking = req.booking || res.locals.booking;
    const user = req.user;

    if (booking && user && user.referral.referredBy) {
      // Find the active referral for this user
      const referral = await Referral.findOne({
        referee: user._id,
        referrer: user.referral.referredBy,
        status: 'pending',
        'timeline.expiresAt': { $gt: new Date() }
      });

      if (referral) {
        await ReferralService.processReferralCompletion(referral._id, {
          type: 'booking',
          referenceId: booking._id,
          referenceType: 'Booking',
          amount: booking.pricing?.totalAmount || 0,
          currency: booking.pricing?.currency || 'USD',
          completedAt: new Date()
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error processing service booking referral:', error);
    // Don't fail the main request if referral processing fails
    next();
  }
};

/**
 * Middleware to process referral completion for supplies orders
 */
const processSuppliesOrderReferral = async (req, res, next) => {
  try {
    const order = req.order || res.locals.order;
    const user = req.user;

    if (order && user && user.referral.referredBy) {
      // Find the active referral for this user
      const referral = await Referral.findOne({
        referee: user._id,
        referrer: user.referral.referredBy,
        status: 'pending',
        'timeline.expiresAt': { $gt: new Date() }
      });

      if (referral) {
        await ReferralService.processReferralCompletion(referral._id, {
          type: 'purchase',
          referenceId: order._id,
          referenceType: 'Order',
          amount: order.totalAmount || 0,
          currency: order.currency || 'USD',
          completedAt: new Date()
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error processing supplies order referral:', error);
    // Don't fail the main request if referral processing fails
    next();
  }
};

/**
 * Middleware to process referral completion for course enrollments
 */
const processCourseEnrollmentReferral = async (req, res, next) => {
  try {
    const enrollment = req.enrollment || res.locals.enrollment;
    const user = req.user;

    if (enrollment && user && user.referral.referredBy) {
      // Find the active referral for this user
      const referral = await Referral.findOne({
        referee: user._id,
        referrer: user.referral.referredBy,
        status: 'pending',
        'timeline.expiresAt': { $gt: new Date() }
      });

      if (referral) {
        await ReferralService.processReferralCompletion(referral._id, {
          type: 'enrollment',
          referenceId: enrollment._id,
          referenceType: 'Enrollment',
          amount: enrollment.course?.price || 0,
          currency: enrollment.course?.currency || 'USD',
          completedAt: new Date()
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error processing course enrollment referral:', error);
    // Don't fail the main request if referral processing fails
    next();
  }
};

/**
 * Middleware to process referral completion for loan applications
 */
const processLoanApplicationReferral = async (req, res, next) => {
  try {
    const loan = req.loan || res.locals.loan;
    const user = req.user;

    if (loan && user && user.referral.referredBy) {
      // Find the active referral for this user
      const referral = await Referral.findOne({
        referee: user._id,
        referrer: user.referral.referredBy,
        status: 'pending',
        'timeline.expiresAt': { $gt: new Date() }
      });

      if (referral) {
        await ReferralService.processReferralCompletion(referral._id, {
          type: 'loan',
          referenceId: loan._id,
          referenceType: 'Loan',
          amount: loan.amount || 0,
          currency: loan.currency || 'USD',
          completedAt: new Date()
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error processing loan application referral:', error);
    // Don't fail the main request if referral processing fails
    next();
  }
};

/**
 * Middleware to process referral completion for rental bookings
 */
const processRentalBookingReferral = async (req, res, next) => {
  try {
    const rental = req.rental || res.locals.rental;
    const user = req.user;

    if (rental && user && user.referral.referredBy) {
      // Find the active referral for this user
      const referral = await Referral.findOne({
        referee: user._id,
        referrer: user.referral.referredBy,
        status: 'pending',
        'timeline.expiresAt': { $gt: new Date() }
      });

      if (referral) {
        await ReferralService.processReferralCompletion(referral._id, {
          type: 'rental',
          referenceId: rental._id,
          referenceType: 'Rental',
          amount: rental.totalAmount || 0,
          currency: rental.currency || 'USD',
          completedAt: new Date()
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error processing rental booking referral:', error);
    // Don't fail the main request if referral processing fails
    next();
  }
};

/**
 * Middleware to process referral completion for subscription upgrades
 */
const processSubscriptionUpgradeReferral = async (req, res, next) => {
  try {
    const subscription = req.subscription || res.locals.subscription;
    const user = req.user;

    if (subscription && user && user.referral.referredBy) {
      // Find the active referral for this user
      const referral = await Referral.findOne({
        referee: user._id,
        referrer: user.referral.referredBy,
        status: 'pending',
        'timeline.expiresAt': { $gt: new Date() }
      });

      if (referral) {
        await ReferralService.processReferralCompletion(referral._id, {
          type: 'subscription',
          referenceId: subscription._id,
          referenceType: 'Subscription',
          amount: subscription.plan?.price || 0,
          currency: subscription.plan?.currency || 'USD',
          completedAt: new Date()
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error processing subscription upgrade referral:', error);
    // Don't fail the main request if referral processing fails
    next();
  }
};

/**
 * Middleware to handle user signup with referral code
 */
const processSignupReferral = async (req, res, next) => {
  try {
    const { referralCode } = req.body;
    const user = req.user;

    if (referralCode && user) {
      // Validate referral code
      const validation = await ReferralService.validateReferralCode(referralCode);
      
      if (validation.valid) {
        // Create referral record
        await ReferralService.createReferral({
          referrerId: validation.referrer.id,
          refereeId: user._id,
          referralType: 'signup',
          tracking: {
            source: 'direct_link',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            referrerUrl: req.get('Referer')
          }
        });

        // Update user's referral information
        user.referral.referredBy = validation.referrer.id;
        user.referral.referralSource = 'direct_link';
        await user.save();
      }
    }

    next();
  } catch (error) {
    console.error('Error processing signup referral:', error);
    // Don't fail the main request if referral processing fails
    next();
  }
};

/**
 * Utility function to get referral statistics for a user
 */
const getReferralStats = async (userId) => {
  try {
    return await ReferralService.getReferralStats(userId);
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return null;
  }
};

/**
 * Utility function to check if user has pending referrals
 */
const hasPendingReferrals = async (userId) => {
  try {
    const count = await Referral.countDocuments({
      referrer: userId,
      status: 'pending',
      'timeline.expiresAt': { $gt: new Date() }
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking pending referrals:', error);
    return false;
  }
};

module.exports = {
  processServiceBookingReferral,
  processSuppliesOrderReferral,
  processCourseEnrollmentReferral,
  processLoanApplicationReferral,
  processRentalBookingReferral,
  processSubscriptionUpgradeReferral,
  processSignupReferral,
  getReferralStats,
  hasPendingReferrals
};

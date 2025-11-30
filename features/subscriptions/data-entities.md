# Subscriptions Data Entities

## SubscriptionPlan
- name(unique, required), description(required)
- price: { monthly(required), yearly(required), currency('USD') }
- features: [{ name, description, included(bool), limit(Number|null), unit('per_month'|'per_booking'|...) }]
- limits: { maxServices, maxBookings, maxProviders, maxStorage(MB), maxApiCalls }
- benefits: [string]
- isActive, isPopular, sortOrder
- timestamps

## UserSubscription
- user: UserId
- plan: SubscriptionPlanId
- status: ['active','cancelled','expired','suspended','pending']
- billingCycle: ['monthly','yearly']
- startDate, endDate, nextBillingDate, cancelledAt, cancellationReason
- paymentMethod: ['paypal','paymaya','stripe','bank_transfer','paymongo']
- paymentDetails: { paypalSubscriptionId?, paymayaSubscriptionId?, stripeSubscriptionId?, paymongoCustomerId?, paymongoIntentId?, lastPaymentId?, lastPaymentDate?, nextPaymentAmount? }
- usage: { services{ current, limit }, bookings{ current, limit }, storage{ current, limit }, apiCalls{ current, limit } }
- features: flags { prioritySupport, advancedAnalytics, customBranding, apiAccess, whiteLabel }
- trial: { isTrial, trialEndDate, trialUsed }
- history: [{ action['subscribed','upgraded','downgraded','cancelled','renewed','suspended','reactivated'], fromPlan, toPlan, timestamp, reason, amount }]
- timestamps

Indexes: user, status, nextBillingDate, paymentDetails.*

Virtuals:
- duration (days)
- daysUntilRenewal

Methods:
- isActive(), hasFeatureAccess(name), checkUsageLimit(name), incrementUsage(name, amount)
- cancel(reason), renew()

Statics:
- getActiveSubscriptions(), getSubscriptionsDueForRenewal()

## Payment
- user: UserId
- subscription: UserSubscriptionId
- amount, currency('USD')
- status: ['pending','completed','failed','refunded','cancelled']
- paymentMethod: ['paypal','paymaya','stripe','bank_transfer','paymongo']
- paymentDetails: provider transaction IDs
- billingPeriod: { startDate, endDate }
- description, metadata, processedAt, failedAt(failureReason), refundedAt(refundAmount, refundReason)
- timestamps

Indexes: user, subscription, status, createdAt

## FeatureUsage
- user: UserId
- subscription: UserSubscriptionId
- feature (enum: service_creation, booking_management, analytics_view, api_call, file_upload, email_notification, sms_notification, custom_branding, priority_support, advanced_search)
- usage: { count, amount?, metadata }
- timestamp, timestamps

Indexes: { user, feature }, subscription, timestamp

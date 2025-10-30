## Data Entities: Referral

Backed by `src/models/Referral.js`.

Entity: Referral

- referrer: ObjectId ref `User` (required)
- referee: ObjectId ref `User` (required)
- referralCode: string (required, unique)
- status: enum ['pending','completed','expired','cancelled'] (default: 'pending')
- referralType: enum ['signup','service_booking','supplies_purchase','course_enrollment','loan_application','rental_booking','subscription_upgrade'] (required)
- triggerAction:
  - type: enum ['booking','purchase','enrollment','loan','rental','subscription'] (required)
  - referenceId: ObjectId (required)
  - referenceType: string (required)
  - amount: number (default 0)
  - currency: string (default 'USD')
  - completedAt: Date|null
- reward:
  - type: enum ['credit','discount','cash','points','subscription_days'] (required)
  - amount: number (required)
  - currency: string (default 'USD')
  - description: string
  - isPercentage: boolean (default false)
  - maxAmount: number
  - subscriptionDays: number
  - discountCode: string
  - discountType: enum ['percentage','fixed_amount']
- tracking:
  - source: enum ['email','sms','social_media','direct_link','qr_code','app_share'] (default 'direct_link')
  - campaign, medium, utmSource, utmMedium, utmCampaign: string
  - ipAddress, userAgent, referrerUrl: string
- timeline:
  - referredAt: Date (default now)
  - signupAt, firstActionAt, completedAt, rewardedAt: Date
  - expiresAt: Date (default +90 days)
- rewardDistribution:
  - referrerReward: { amount, currency, type, status: enum ['pending','processed','paid','failed'], processedAt, paymentMethod, transactionId }
  - refereeReward: { amount, currency, type, status: enum ['pending','processed','paid','failed'], processedAt, paymentMethod, transactionId }
- metadata: { notes: string, tags: string[], customFields: Mixed }
- verification: { isVerified: boolean, verifiedAt: Date, verificationMethod: enum ['automatic','manual','admin'], verifiedBy: ObjectId ref `User` }
- analytics: { clickCount: number, conversionRate: number, totalValue: number, lifetimeValue: number }

Virtuals and Methods

- virtual ageInDays: days since `timeline.referredAt`
- virtual daysUntilExpiration: days until `timeline.expiresAt`
- virtual totalRewardValue: sum of referrer+referee reward amounts
- statics:
  - generateReferralCode(): 8-char alphanumeric
  - getReferralStats(userId, timeRange)
  - findActiveByCode(referralCode)
- methods:
  - isValid(): status pending and not expired
  - markCompleted(triggerAction)
  - processRewards(): mark distribution statuses processed and set rewardedAt
  - calculateReward(triggerAmount, rewardConfig)

Indexes (selected)

- referrer/status, referee/status
- referralType/status
- timeline.referredAt, timeline.expiresAt
- triggerAction.referenceId/referenceType
- rewardDistribution status fields



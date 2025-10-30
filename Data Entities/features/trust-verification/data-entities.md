## Data Entities: Trust & Verification

Backed by `src/models/TrustVerification.js`.

Entity: VerificationRequest

- user: ObjectId ref `User` (required)
- type: enum ['identity','identity_verification','business','address','bank_account','insurance','certification'] (required)
- status: enum ['pending','under_review','approved','rejected','expired'] (default 'pending')
- documents[]: { type: enum ['government_id','passport','driver_license','drivers_license','business_license','tax_certificate','insurance_certificate','bank_statement','utility_bill','certification_document','other'], url (required), publicId, filename, mimeType, size, uploadedAt, isVerified }
- personalInfo: { firstName, lastName, dateOfBirth, ssn, phoneNumber, email }
- businessInfo: { businessName, businessType, registrationNumber, taxId, address { street, city, state, zipCode, country } }
- addressInfo: { street, city, state, zipCode, country, coordinates { lat, lng } }
- bankInfo: { accountNumber, routingNumber, bankName, accountType }
- review: { reviewedBy ref `User`, reviewedAt, notes, rejectionReason, score (0-100) }
- submittedAt (default now), expiresAt (default +30d), isActive

Entity: Dispute

- user: ObjectId ref `User` (required)
- type: enum ['service_dispute','payment_dispute','verification_dispute','other'] (required)
- title, description (required)
- context: { bookingId ref `Booking`, jobId ref `Job`, orderId ref `Order`, verificationId ref `VerificationRequest` }
- status: enum ['open','under_review','resolved','closed'] (default 'open')
- priority: enum ['low','medium','high','urgent'] (default 'medium')
- evidence[]: { type: enum ['document','image','video','audio','other'], url, publicId, filename, description, uploadedAt }
- resolution: { resolvedBy ref `User`, resolvedAt, resolution, outcome: enum ['resolved_in_favor_of_user','resolved_in_favor_of_other_party','no_fault','dismissed'], compensation { amount, currency, type: enum ['refund','credit','service_credit','none'] } }
- communication[]: { sender ref `User`, message, timestamp, isInternal }
- assignedTo ref `User`, tags[], isActive

Entity: TrustScore

- user: ObjectId ref `User` (required, unique)
- overallScore: number (0-100)
- components: identity, business, address, bank, behavior → each { score (0-100), weight, lastUpdated }
- factors:
  - verificationStatus: { identityVerified, businessVerified, addressVerified, bankVerified }
  - activityMetrics: { totalBookings, completedBookings, cancelledBookings, averageRating, totalReviews }
  - financialMetrics: { totalTransactions, totalAmount, paymentSuccessRate, chargebackRate }
  - complianceMetrics: { disputesFiled, disputesResolved, policyViolations, accountAge }
- badges[]: { type: enum ['verified_identity','verified_business','verified_address','verified_bank','top_rated','reliable','fast_response','excellent_service','trusted_provider'], earnedAt, description }
- lastCalculated, history[]: { score, reason, timestamp }

Key Methods

- TrustScore methods: calculateScore(), updateComponentScore(component, score, reason), addBadge(type, description), removeBadge(type)
- TrustScore statics: getUserTrustScore(userId), updateFromActivity(userId, activityType, data), calculateBehaviorScore(factors)

Indexes (selected)

- VerificationRequest: user/type, status, submittedAt, expiresAt
- Dispute: user, status, type, priority, createdAt
- TrustScore: overallScore, lastCalculated



## Data Entities: Provider

Backed by `src/models/Provider.js`.

Entity: Provider

- userId: ObjectId ref `User` (required, unique)
- status: enum ['pending','active','suspended','inactive','rejected'] (default: 'pending')
- providerType: enum ['individual','business','agency'] (required)
- businessInfo:
  - businessName, businessType, businessRegistration, taxId
  - businessAddress: street, city, state, zipCode, country, coordinates { lat, lng }
  - businessPhone, businessEmail, website, businessDescription, yearEstablished, numberOfEmployees
- professionalInfo:
  - specialties[]:
    - category: enum ['cleaning','plumbing','electrical','moving','landscaping','pest_control','handyman','painting','carpentry','other']
    - subcategories[]: string
    - experience: number (years)
    - certifications[]: { name, issuer, dateIssued, expiryDate, certificateNumber }
    - skills[]: string
    - hourlyRate: number
    - serviceAreas[]: { city, state, radius }
  - languages[]: string
  - availability: per-day { start, end, available }
  - emergencyServices: boolean
  - travelDistance, minimumJobValue, maximumJobValue: number
- verification:
  - identityVerified: boolean
  - businessVerified: boolean
  - backgroundCheck: { status: enum ['pending','passed','failed','not_required'], dateCompleted, reportId }
  - insurance: { hasInsurance, insuranceProvider, policyNumber, coverageAmount, expiryDate, documents[] }
  - licenses[]: { type, number, issuingAuthority, issueDate, expiryDate, documents[] }
  - references[]: { name, relationship, phone, email, company, verified }
  - portfolio: { images[], videos[], descriptions[], beforeAfter[]: { before, after, description } }
- financialInfo:
  - bankAccount: { accountHolder, accountNumber, routingNumber, bankName, accountType: enum ['checking','savings'] }
  - taxInfo: { ssn, ein, taxClassification, w9Submitted }
  - paymentMethods[]: { type: enum ['bank_transfer','paypal','paymaya','check'], details: Mixed, isDefault }
  - commissionRate: number (default 0.1)
  - minimumPayout: number (default 50)
- performance:
  - rating (0-5), totalReviews, totalJobs, completedJobs, cancelledJobs
  - responseTime (mins), completionRate, repeatCustomerRate
  - earnings: { total, thisMonth, lastMonth, pending }
  - badges[]: { name, description, earnedDate, category }
- preferences:
  - notificationSettings: { newJobAlerts, messageNotifications, paymentNotifications, reviewNotifications, marketingEmails }
  - jobPreferences: { preferredJobTypes[], avoidJobTypes[], preferredTimeSlots[], maxJobsPerDay, advanceBookingDays }
  - communicationPreferences: { preferredContactMethod: enum ['phone','email','sms','app'], responseTimeExpectation, autoAcceptJobs }
- subscription:
  - plan: enum ['basic','professional','premium','enterprise']
  - features[], limits { maxServices, maxBookingsPerMonth, prioritySupport, advancedAnalytics }
  - billingCycle: enum ['monthly','yearly'], nextBillingDate, autoRenew
- onboarding:
  - completed: boolean
  - steps[]: { step, completed, completedAt, data: Mixed }
  - currentStep: string, progress: number
- settings:
  - profileVisibility: enum ['public','private','verified_only']
  - showContactInfo, showPricing, showReviews, allowDirectBooking, requireApproval
- metadata:
  - lastActive: Date, profileViews, searchRanking, featured, promoted, tags[], notes

Virtuals and Methods

- virtual fullName: businessName if present, else user's full name
- virtual completionRate: computed from completedJobs/totalJobs
- pre-save: updates completionRate, metadata.lastActive
- methods: updateRating(newRating), addJob(status), updateEarnings(amount), isVerified(), canAcceptJobs(), getServiceAreas()
- statics: findByLocation(city, state, category), findTopRated(limit), findFeatured()

Indexes (selected)

- status, providerType
- professionalInfo.specialties.category
- professionalInfo.serviceAreas.city/state
- performance.rating/totalReviews/totalJobs
- metadata.featured/promoted
- createdAt



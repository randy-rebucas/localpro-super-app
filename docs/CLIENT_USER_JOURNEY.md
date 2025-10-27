# 🎯 **LocalPro Super App - Client User Journey**

## **Overview**
This document outlines the complete user journey for **CLIENT** role users in the LocalPro Super App platform. Clients are users who primarily consume services, apply for jobs, enroll in courses, and engage with various marketplace offerings.

---

## **🔐 Phase 1: Registration & Onboarding**

### **Step 1: Initial Registration**
**Goal:** Create account and verify phone number  
**Duration:** 2-3 minutes  
**API Endpoints:** 
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-code` - Verify code and register

**User Actions:**
1. Enter phone number
2. Receive SMS verification code
3. Enter verification code
4. System creates minimal user record with `role: "client"`

**System Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please complete your profile.",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "phoneNumber": "+1234567890",
    "role": "client",
    "isVerified": true,
    "status": "pending_verification"
  },
  "redirect": {
    "destination": "onboarding",
    "reason": "New user needs to provide personal information"
  }
}
```

### **Step 2: Profile Completion**
**Goal:** Complete basic profile information  
**Duration:** 3-5 minutes  
**API Endpoint:** `POST /api/auth/complete-onboarding`

**User Actions:**
1. Enter first name, last name, email
2. System validates email uniqueness
3. Profile completion triggers welcome email
4. User gains access to dashboard

**System Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "user": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "client",
    "subscription": { "type": "free", "isActive": false },
    "trustScore": 0,
    "referral": { "referralCode": "JD123456" }
  },
  "redirect": {
    "destination": "dashboard",
    "reason": "User onboarding completed successfully"
  }
}
```

---

## **🏠 Phase 2: Dashboard & Discovery**

### **Step 3: Dashboard Access**
**Goal:** Access main dashboard and explore platform  
**Duration:** Ongoing  
**API Endpoints:**
- `GET /api/auth/me` - Get user profile
- `GET /api/analytics/overview` - Get user analytics
- `GET /api/activities/feed` - Get activity feed

**Dashboard Features:**
- **Profile Overview:** Trust score, subscription status, referral code
- **Quick Actions:** Search services, browse jobs, view courses
- **Recent Activity:** Bookings, applications, enrollments
- **Notifications:** System updates, booking confirmations
- **Financial Summary:** Wallet balance, transaction history

### **Step 4: Service Discovery**
**Goal:** Find and explore available services  
**Duration:** 5-15 minutes  
**API Endpoints:**
- `GET /api/marketplace/services` - Browse all services
- `GET /api/marketplace/services/nearby` - Find nearby services
- `GET /api/marketplace/services/:id` - Get service details
- `GET /api/search/global` - Global search functionality

**User Actions:**
1. Browse service categories
2. Use location-based search
3. Filter by price, rating, availability
4. View service details and provider profiles
5. Read reviews and ratings

---

## **🛍️ Phase 3: Service Booking Journey**

### **Step 5: Service Selection & Booking**
**Goal:** Book a service from a provider  
**Duration:** 10-15 minutes  
**API Endpoints:**
- `POST /api/marketplace/bookings` - Create booking
- `POST /api/marketplace/bookings/paypal/approve` - Process PayPal payment
- `POST /api/paymaya/create-checkout` - Process PayMaya payment

**User Actions:**
1. Select desired service
2. Choose date and time
3. Enter service address
4. Review booking summary
5. Select payment method (PayPal/PayMaya)
6. Complete payment
7. Receive booking confirmation

**System Process:**
1. Validate service availability
2. Check service area coverage
3. Calculate total cost
4. Process payment
5. Send confirmation to client and provider
6. Create booking record

### **Step 6: Booking Management**
**Goal:** Manage active bookings  
**Duration:** Ongoing  
**API Endpoints:**
- `GET /api/marketplace/bookings` - Get user bookings
- `PUT /api/marketplace/bookings/:id/status` - Update booking status
- `POST /api/marketplace/bookings/:id/photos` - Upload completion photos
- `POST /api/marketplace/bookings/:id/review` - Add review

**Booking States:**
- **Pending:** Awaiting provider confirmation
- **Confirmed:** Provider accepted booking
- **In Progress:** Service being performed
- **Completed:** Service finished
- **Cancelled:** Booking cancelled

---

## **💼 Phase 4: Job Board Experience**

### **Step 7: Job Discovery & Application**
**Goal:** Find and apply for jobs  
**Duration:** 15-30 minutes  
**API Endpoints:**
- `GET /api/jobs` - Browse all jobs
- `GET /api/jobs/search` - Search jobs with filters
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/apply` - Apply for job

**User Actions:**
1. Browse job categories
2. Filter by location, salary, type
3. View job details and requirements
4. Submit application with resume
5. Track application status

### **Step 8: Application Management**
**Goal:** Track and manage job applications  
**Duration:** Ongoing  
**API Endpoints:**
- `GET /api/jobs/my-applications` - Get user applications
- `PUT /api/jobs/applications/:id/status` - Update application status

**Application States:**
- **Applied:** Application submitted
- **Under Review:** Employer reviewing
- **Interview Scheduled:** Interview arranged
- **Offered:** Job offer received
- **Rejected:** Application declined

---

## **🎓 Phase 5: Academy & Learning**

### **Step 9: Course Discovery & Enrollment**
**Goal:** Find and enroll in courses  
**Duration:** 10-20 minutes  
**API Endpoints:**
- `GET /api/academy/courses` - Browse courses
- `GET /api/academy/courses/:id` - Get course details
- `POST /api/academy/courses/:id/enroll` - Enroll in course

**User Actions:**
1. Browse course categories
2. View course details and curriculum
3. Check instructor profiles
4. Enroll in course
5. Access course materials

### **Step 10: Course Progress & Completion**
**Goal:** Complete courses and track progress  
**Duration:** Ongoing  
**API Endpoints:**
- `GET /api/academy/my-courses` - Get enrolled courses
- `PUT /api/academy/courses/:id/progress` - Update progress
- `POST /api/academy/courses/:id/review` - Add course review

---

## **🛒 Phase 6: Marketplace Shopping**

### **Step 11: Supply & Equipment Shopping**
**Goal:** Purchase supplies and rent equipment  
**Duration:** 10-20 minutes  
**API Endpoints:**
- `GET /api/supplies` - Browse supplies
- `GET /api/rentals` - Browse rental items
- `POST /api/supplies/:id/order` - Order supply
- `POST /api/rentals/:id/book` - Book rental

**User Actions:**
1. Browse supply categories
2. Compare prices and reviews
3. Add items to cart
4. Complete purchase/rental
5. Track order status

---

## **💰 Phase 7: Financial Management**

### **Step 12: Wallet & Payment Management**
**Goal:** Manage finances and payments  
**Duration:** Ongoing  
**API Endpoints:**
- `GET /api/finance/overview` - Get financial overview
- `GET /api/finance/transactions` - Get transaction history
- `GET /api/finance/earnings` - Get earnings summary
- `POST /api/finance/request-withdrawal` - Request withdrawal

**Financial Features:**
- **Wallet Balance:** Available funds
- **Transaction History:** All payments and receipts
- **Earnings Tracking:** Income from completed services
- **Withdrawal Requests:** Cash out earnings

---

## **⭐ Phase 8: Subscription & Premium Features**

### **Step 13: LocalPro Plus Subscription**
**Goal:** Upgrade to premium features  
**Duration:** 5-10 minutes  
**API Endpoints:**
- `GET /api/subscriptions/plans` - Get subscription plans
- `POST /api/subscriptions/subscribe` - Subscribe to plan
- `POST /api/subscriptions/confirm-payment` - Confirm payment
- `GET /api/subscriptions/my-subscriptions` - Get user subscriptions

**Premium Benefits:**
- **Priority Support:** Faster customer service
- **Advanced Analytics:** Detailed performance metrics
- **Premium Features:** Access to exclusive tools
- **Discounts:** Reduced fees on transactions

---

## **🤝 Phase 9: Social & Communication**

### **Step 14: Provider Communication**
**Goal:** Communicate with service providers  
**Duration:** Ongoing  
**API Endpoints:**
- `GET /api/communication/conversations` - Get conversations
- `POST /api/communication/conversations` - Create conversation
- `POST /api/communication/messages` - Send message
- `GET /api/communication/notifications` - Get notifications

**Communication Features:**
- **Direct Messaging:** Chat with providers
- **Booking Communication:** Discuss service details
- **File Sharing:** Share photos and documents
- **Notification Center:** Stay updated on messages

---

## **📊 Phase 10: Analytics & Insights**

### **Step 15: Personal Analytics**
**Goal:** Track usage and performance  
**Duration:** Ongoing  
**API Endpoints:**
- `GET /api/analytics/user` - Get user analytics
- `GET /api/analytics/marketplace` - Get marketplace analytics
- `GET /api/analytics/referral` - Get referral analytics

**Analytics Features:**
- **Usage Statistics:** Services used, courses completed
- **Spending Analysis:** Money spent on services
- **Learning Progress:** Course completion rates
- **Referral Performance:** Referral success metrics

---

## **🔒 Phase 11: Trust & Verification**

### **Step 16: Trust Verification**
**Goal:** Build trust and credibility  
**Duration:** 15-30 minutes  
**API Endpoints:**
- `POST /api/trust-verification/requests` - Create verification request
- `POST /api/trust-verification/upload-documents` - Upload documents
- `GET /api/trust-verification/my-requests` - Get verification status

**Verification Process:**
1. Submit identity documents
2. Provide business information
3. Complete background check
4. Receive verification badge
5. Increase trust score

---

## **🎯 Phase 12: Referral & Growth**

### **Step 17: Referral System**
**Goal:** Invite others and earn rewards  
**Duration:** Ongoing  
**API Endpoints:**
- `GET /api/referrals/my-referrals` - Get referral stats
- `GET /api/referrals/links` - Get referral links
- `POST /api/referrals/invite` - Invite user
- `GET /api/referrals/rewards` - Get referral rewards

**Referral Benefits:**
- **Earn Credits:** Get rewards for successful referrals
- **Leaderboard:** Compete with other users
- **Social Sharing:** Share referral links
- **Bonus Features:** Unlock premium features

---

## **⚙️ Phase 13: Settings & Preferences**

### **Step 18: Account Management**
**Goal:** Manage account settings and preferences  
**Duration:** Ongoing  
**API Endpoints:**
- `GET /api/settings/user` - Get user settings
- `PUT /api/settings/user` - Update settings
- `POST /api/auth/upload-avatar` - Upload profile picture
- `PUT /api/auth/profile` - Update profile

**Settings Categories:**
- **Profile Settings:** Personal information
- **Notification Preferences:** Communication settings
- **Privacy Settings:** Data sharing preferences
- **Payment Methods:** Saved payment options

---

## **📱 Client Journey Summary**

### **Key Client Capabilities:**
✅ **Service Booking:** Find, book, and manage services  
✅ **Job Applications:** Apply for jobs and track applications  
✅ **Course Enrollment:** Enroll in courses and track progress  
✅ **Marketplace Shopping:** Purchase supplies and rent equipment  
✅ **Financial Management:** Manage wallet and transactions  
✅ **Communication:** Chat with providers and receive notifications  
✅ **Reviews & Ratings:** Rate services and providers  
✅ **Referral System:** Invite others and earn rewards  
✅ **Trust Building:** Complete verification for credibility  
✅ **Analytics:** Track usage and performance metrics  

### **Client Journey Touchpoints:**
1. **Registration & Onboarding** (5-8 minutes)
2. **Service Discovery & Booking** (15-30 minutes)
3. **Job Search & Applications** (20-45 minutes)
4. **Course Learning** (Ongoing)
5. **Financial Management** (Ongoing)
6. **Communication & Support** (Ongoing)
7. **Trust Building** (30-60 minutes)
8. **Referral & Growth** (Ongoing)

### **Success Metrics for Clients:**
- **Service Completion Rate:** % of booked services completed
- **Job Application Success:** % of applications resulting in interviews
- **Course Completion Rate:** % of enrolled courses completed
- **Trust Score:** Verification and rating-based score
- **Referral Success:** Number of successful referrals
- **Platform Engagement:** Time spent and features used

---

## **🔄 Next Steps**

This client journey provides a comprehensive roadmap for:
- **UI/UX Design:** Screen flows and user interface
- **API Development:** Endpoint prioritization
- **Feature Planning:** Development roadmap
- **Testing Scenarios:** User acceptance testing
- **Support Documentation:** Help guides and FAQs

The journey can be extended to include other user roles (Provider, Supplier, Instructor, etc.) following similar comprehensive mapping.

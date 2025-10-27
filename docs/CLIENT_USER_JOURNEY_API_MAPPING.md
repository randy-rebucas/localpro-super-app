# 🎯 **Client User Journey - API Endpoint Mapping**

## **Complete API Endpoint Reference for Client Journey**

This document provides a comprehensive mapping of all API endpoints used throughout the client user journey, organized by journey phase and functionality.

---

## **📋 API Endpoint Summary by Journey Phase**

### **Phase 1: Registration & Onboarding**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Phone Registration | `/api/auth/send-code` | POST | Send SMS verification code | PUBLIC |
| Phone Verification | `/api/auth/verify-code` | POST | Verify SMS code and register/login | PUBLIC |
| Profile Completion | `/api/auth/complete-onboarding` | POST | Complete user profile setup | AUTHENTICATED |
| Profile Completeness Check | `/api/auth/profile-completeness` | GET | Check onboarding status | AUTHENTICATED |

### **Phase 2: Dashboard & Discovery**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| User Profile | `/api/auth/me` | GET | Get current user profile | AUTHENTICATED |
| Analytics Overview | `/api/analytics/overview` | GET | Get user analytics summary | AUTHENTICATED |
| Activity Feed | `/api/activities/feed` | GET | Get user activity feed | AUTHENTICATED |
| User Analytics | `/api/analytics/user` | GET | Get detailed user analytics | AUTHENTICATED |

### **Phase 3: Service Discovery & Booking**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Service Search | `/api/marketplace/services` | GET | Browse all services | PUBLIC |
| Nearby Services | `/api/marketplace/services/nearby` | GET | Find nearby services | PUBLIC |
| Service Details | `/api/marketplace/services/:id` | GET | Get service details | PUBLIC |
| Global Search | `/api/search/global` | GET | Search across platform | PUBLIC |
| Create Booking | `/api/marketplace/bookings` | POST | Create service booking | AUTHENTICATED |
| Get Bookings | `/api/marketplace/bookings` | GET | Get user bookings | AUTHENTICATED |
| Update Booking Status | `/api/marketplace/bookings/:id/status` | PUT | Update booking status | AUTHENTICATED |
| Upload Booking Photos | `/api/marketplace/bookings/:id/photos` | POST | Upload completion photos | AUTHENTICATED |
| Add Review | `/api/marketplace/bookings/:id/review` | POST | Add service review | AUTHENTICATED |

### **Phase 4: Payment Processing**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| PayPal Payment | `/api/marketplace/bookings/paypal/approve` | POST | Approve PayPal payment | AUTHENTICATED |
| PayPal Order Details | `/api/marketplace/bookings/paypal/order/:id` | GET | Get PayPal order details | AUTHENTICATED |
| PayMaya Checkout | `/api/paymaya/create-checkout` | POST | Create PayMaya checkout | AUTHENTICATED |
| PayMaya Payment | `/api/paymaya/create-payment` | POST | Create PayMaya payment | AUTHENTICATED |
| PayMaya Invoice | `/api/paymaya/create-invoice` | POST | Create PayMaya invoice | AUTHENTICATED |

### **Phase 5: Job Board Experience**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Job Search | `/api/jobs` | GET | Browse all jobs | PUBLIC |
| Job Search with Filters | `/api/jobs/search` | GET | Search jobs with filters | PUBLIC |
| Job Details | `/api/jobs/:id` | GET | Get job details | PUBLIC |
| Apply for Job | `/api/jobs/:id/apply` | POST | Apply for job | AUTHENTICATED |
| My Applications | `/api/jobs/my-applications` | GET | Get user applications | AUTHENTICATED |
| Update Application Status | `/api/jobs/applications/:id/status` | PUT | Update application status | AUTHENTICATED |

### **Phase 6: Academy & Learning**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Course Discovery | `/api/academy/courses` | GET | Browse all courses | PUBLIC |
| Course Details | `/api/academy/courses/:id` | GET | Get course details | PUBLIC |
| Course Categories | `/api/academy/courses/categories` | GET | Get course categories | PUBLIC |
| Featured Courses | `/api/academy/courses/featured` | GET | Get featured courses | PUBLIC |
| Enroll in Course | `/api/academy/courses/:id/enroll` | POST | Enroll in course | AUTHENTICATED |
| Update Course Progress | `/api/academy/courses/:id/progress` | PUT | Update course progress | AUTHENTICATED |
| Add Course Review | `/api/academy/courses/:id/review` | POST | Add course review | AUTHENTICATED |
| My Courses | `/api/academy/my-courses` | GET | Get enrolled courses | AUTHENTICATED |

### **Phase 7: Marketplace Shopping**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Supply Discovery | `/api/supplies` | GET | Browse supplies | PUBLIC |
| Supply Details | `/api/supplies/:id` | GET | Get supply details | PUBLIC |
| Supply Categories | `/api/supplies/categories` | GET | Get supply categories | PUBLIC |
| Featured Supplies | `/api/supplies/featured` | GET | Get featured supplies | PUBLIC |
| Nearby Supplies | `/api/supplies/nearby` | GET | Get nearby supplies | PUBLIC |
| Order Supply | `/api/supplies/:id/order` | POST | Order supply | AUTHENTICATED |
| Add Supply Review | `/api/supplies/:id/review` | POST | Add supply review | AUTHENTICATED |
| My Orders | `/api/supplies/my-orders` | GET | Get user orders | AUTHENTICATED |

### **Phase 8: Equipment Rental**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Rental Discovery | `/api/rentals` | GET | Browse rental items | PUBLIC |
| Rental Details | `/api/rentals/:id` | GET | Get rental details | PUBLIC |
| Rental Categories | `/api/rentals/categories` | GET | Get rental categories | PUBLIC |
| Featured Rentals | `/api/rentals/featured` | GET | Get featured rentals | PUBLIC |
| Nearby Rentals | `/api/rentals/nearby` | GET | Get nearby rentals | PUBLIC |
| Book Rental | `/api/rentals/:id/book` | POST | Book rental | AUTHENTICATED |
| Add Rental Review | `/api/rentals/:id/review` | POST | Add rental review | AUTHENTICATED |
| My Bookings | `/api/rentals/my-bookings` | GET | Get rental bookings | AUTHENTICATED |

### **Phase 9: Financial Management**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Financial Overview | `/api/finance/overview` | GET | Get financial overview | AUTHENTICATED |
| Transaction History | `/api/finance/transactions` | GET | Get transaction history | AUTHENTICATED |
| Earnings Summary | `/api/finance/earnings` | GET | Get earnings summary | AUTHENTICATED |
| Expenses Summary | `/api/finance/expenses` | GET | Get expenses summary | AUTHENTICATED |
| Request Withdrawal | `/api/finance/request-withdrawal` | POST | Request withdrawal | AUTHENTICATED |
| Tax Documents | `/api/finance/tax-documents` | GET | Get tax documents | AUTHENTICATED |
| Generate Financial Report | `/api/finance/generate-report` | POST | Generate financial report | AUTHENTICATED |
| Update Wallet Settings | `/api/finance/wallet-settings` | PUT | Update wallet settings | AUTHENTICATED |

### **Phase 10: Subscription Management**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Subscription Plans | `/api/subscriptions/plans` | GET | Get subscription plans | PUBLIC |
| Subscribe to Plan | `/api/subscriptions/subscribe` | POST | Subscribe to plan | AUTHENTICATED |
| Confirm Payment | `/api/subscriptions/confirm-payment` | POST | Confirm subscription payment | AUTHENTICATED |
| Cancel Subscription | `/api/subscriptions/cancel` | PUT | Cancel subscription | AUTHENTICATED |
| Renew Subscription | `/api/subscriptions/renew` | POST | Renew subscription | AUTHENTICATED |
| My Subscriptions | `/api/subscriptions/my-subscriptions` | GET | Get user subscriptions | AUTHENTICATED |
| Update Settings | `/api/subscriptions/settings` | PUT | Update subscription settings | AUTHENTICATED |

### **Phase 11: Communication & Social**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Get Conversations | `/api/communication/conversations` | GET | Get user conversations | AUTHENTICATED |
| Create Conversation | `/api/communication/conversations` | POST | Create new conversation | AUTHENTICATED |
| Delete Conversation | `/api/communication/conversations/:id` | DELETE | Delete conversation | AUTHENTICATED |
| Send Message | `/api/communication/messages` | POST | Send message | AUTHENTICATED |
| Update Message | `/api/communication/messages/:id` | PUT | Update message | AUTHENTICATED |
| Delete Message | `/api/communication/messages/:id` | DELETE | Delete message | AUTHENTICATED |
| Mark as Read | `/api/communication/messages/:id/read` | PUT | Mark message as read | AUTHENTICATED |
| Get Notifications | `/api/communication/notifications` | GET | Get notifications | AUTHENTICATED |
| Get Notification Count | `/api/communication/notifications/count` | GET | Get unread notification count | AUTHENTICATED |
| Mark Notification as Read | `/api/communication/notifications/:id/read` | PUT | Mark notification as read | AUTHENTICATED |
| Delete Notification | `/api/communication/notifications/:id` | DELETE | Delete notification | AUTHENTICATED |
| Search Conversations | `/api/communication/conversations/search` | GET | Search conversations | AUTHENTICATED |

### **Phase 12: Trust & Verification**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Verified Users | `/api/trust-verification/verified-users` | GET | Get verified users list | PUBLIC |
| Create Verification Request | `/api/trust-verification/requests` | POST | Create verification request | AUTHENTICATED |
| Update Verification Request | `/api/trust-verification/requests/:id` | PUT | Update verification request | AUTHENTICATED |
| Delete Verification Request | `/api/trust-verification/requests/:id` | DELETE | Delete verification request | AUTHENTICATED |
| Upload Documents | `/api/trust-verification/upload-documents` | POST | Upload verification documents | AUTHENTICATED |
| Delete Document | `/api/trust-verification/documents/:id` | DELETE | Delete verification document | AUTHENTICATED |
| My Requests | `/api/trust-verification/my-requests` | GET | Get user verification requests | AUTHENTICATED |

### **Phase 13: Referral System**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Validate Referral Code | `/api/referrals/validate/:code` | GET | Validate referral code | PUBLIC |
| Track Referral Click | `/api/referrals/track-click` | POST | Track referral link click | PUBLIC |
| Leaderboard | `/api/referrals/leaderboard` | GET | Get referral leaderboard | PUBLIC |
| My Referrals | `/api/referrals/my-referrals` | GET | Get user referrals | AUTHENTICATED |
| Referral Stats | `/api/referrals/stats` | GET | Get referral statistics | AUTHENTICATED |
| Referral Links | `/api/referrals/links` | GET | Get referral links | AUTHENTICATED |
| Referral Rewards | `/api/referrals/rewards` | GET | Get referral rewards | AUTHENTICATED |
| Invite User | `/api/referrals/invite` | POST | Invite user via referral | AUTHENTICATED |
| Update Referral Preferences | `/api/referrals/preferences` | PUT | Update referral preferences | AUTHENTICATED |

### **Phase 14: Analytics & Insights**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Analytics Overview | `/api/analytics/overview` | GET | Get analytics overview | AUTHENTICATED |
| User Analytics | `/api/analytics/user` | GET | Get user analytics | AUTHENTICATED |
| Marketplace Analytics | `/api/analytics/marketplace` | GET | Get marketplace analytics | AUTHENTICATED |
| Job Analytics | `/api/analytics/jobs` | GET | Get job analytics | AUTHENTICATED |
| Referral Analytics | `/api/analytics/referrals` | GET | Get referral analytics | AUTHENTICATED |
| Track Event | `/api/analytics/track-event` | POST | Track custom event | AUTHENTICATED |

### **Phase 15: Activity & Social Features**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Activity Feed | `/api/activities/feed` | GET | Get activity feed | AUTHENTICATED |
| My Activities | `/api/activities/my-activities` | GET | Get user activities | AUTHENTICATED |
| User Activities | `/api/activities/user/:id` | GET | Get specific user activities | AUTHENTICATED |
| Activity Details | `/api/activities/:id` | GET | Get activity details | AUTHENTICATED |
| Create Activity | `/api/activities` | POST | Create activity | AUTHENTICATED |
| Update Activity | `/api/activities/:id` | PUT | Update activity | AUTHENTICATED |
| Delete Activity | `/api/activities/:id` | DELETE | Delete activity | AUTHENTICATED |
| Add Interaction | `/api/activities/:id/interactions` | POST | Add interaction to activity | AUTHENTICATED |
| Remove Interaction | `/api/activities/:id/interactions/:interactionId` | DELETE | Remove interaction | AUTHENTICATED |
| User Activity Stats | `/api/activities/user/:id/stats` | GET | Get user activity statistics | AUTHENTICATED |

### **Phase 16: Settings & Preferences**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| User Settings | `/api/settings/user` | GET | Get user settings | AUTHENTICATED |
| Update User Settings | `/api/settings/user` | PUT | Update user settings | AUTHENTICATED |
| Reset User Settings | `/api/settings/user/reset` | POST | Reset user settings | AUTHENTICATED |
| Delete User Settings | `/api/settings/user` | DELETE | Delete user settings | AUTHENTICATED |
| Public App Settings | `/api/settings/public` | GET | Get public app settings | PUBLIC |
| App Health | `/api/settings/health` | GET | Get app health status | PUBLIC |

### **Phase 17: Profile Management**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Get Profile | `/api/auth/me` | GET | Get current user profile | AUTHENTICATED |
| Update Profile | `/api/auth/profile` | PUT | Update user profile | AUTHENTICATED |
| Upload Avatar | `/api/auth/upload-avatar` | POST | Upload profile avatar | AUTHENTICATED |
| Upload Portfolio Images | `/api/auth/upload-portfolio` | POST | Upload portfolio images | AUTHENTICATED |
| Logout | `/api/auth/logout` | POST | Logout user | AUTHENTICATED |

### **Phase 18: Maps & Location Services**
| Journey Step | API Endpoint | Method | Purpose | Access Level |
|--------------|--------------|--------|---------|--------------|
| Geocode Address | `/api/maps/geocode` | GET | Convert address to coordinates | PUBLIC |
| Reverse Geocode | `/api/maps/reverse-geocode` | GET | Convert coordinates to address | PUBLIC |
| Search Places | `/api/maps/search-places` | GET | Search for places | PUBLIC |
| Place Details | `/api/maps/place-details/:id` | GET | Get place details | PUBLIC |
| Calculate Distance | `/api/maps/calculate-distance` | GET | Calculate distance between points | PUBLIC |
| Nearby Places | `/api/maps/nearby-places` | GET | Get nearby places | PUBLIC |
| Validate Service Area | `/api/maps/validate-service-area` | GET | Validate service coverage area | PUBLIC |
| Analyze Service Coverage | `/api/maps/analyze-coverage` | GET | Analyze service coverage | AUTHENTICATED |

---

## **🔍 API Endpoint Categories by Functionality**

### **Authentication & Security**
- Phone verification and registration
- Profile management
- Session management
- Logout functionality

### **Discovery & Search**
- Service discovery
- Job search
- Course browsing
- Supply and rental search
- Global search functionality

### **Transaction Management**
- Service booking
- Job applications
- Course enrollment
- Supply ordering
- Equipment rental
- Payment processing

### **Communication**
- Direct messaging
- Notifications
- Activity feeds
- Social interactions

### **Financial Services**
- Wallet management
- Transaction history
- Earnings tracking
- Withdrawal requests
- Financial reporting

### **Learning & Development**
- Course enrollment
- Progress tracking
- Certificate management
- Skill development

### **Trust & Verification**
- Identity verification
- Document upload
- Trust score building
- Credibility enhancement

### **Analytics & Insights**
- Personal analytics
- Usage statistics
- Performance metrics
- Goal tracking

### **Social Features**
- Referral system
- Social sharing
- Community engagement
- Leaderboards

---

## **📊 API Usage Statistics**

### **Most Frequently Used Endpoints (Client Journey)**
1. **Service Discovery:** `/api/marketplace/services` - High frequency
2. **Booking Management:** `/api/marketplace/bookings` - High frequency
3. **Job Search:** `/api/jobs/search` - Medium frequency
4. **Course Enrollment:** `/api/academy/courses/:id/enroll` - Medium frequency
5. **Communication:** `/api/communication/messages` - High frequency
6. **Financial Overview:** `/api/finance/overview` - Medium frequency
7. **Activity Feed:** `/api/activities/feed` - High frequency
8. **Profile Management:** `/api/auth/profile` - Medium frequency

### **Critical Path Endpoints**
- **Registration Flow:** Must work flawlessly for user acquisition
- **Payment Processing:** Critical for revenue generation
- **Service Booking:** Core platform functionality
- **Communication:** Essential for user satisfaction

### **Performance Requirements**
- **Authentication endpoints:** < 200ms response time
- **Search endpoints:** < 500ms response time
- **Payment endpoints:** < 1000ms response time
- **Communication endpoints:** < 300ms response time

This comprehensive API mapping provides developers and product managers with a complete reference for implementing and optimizing the client user journey across all platform features.

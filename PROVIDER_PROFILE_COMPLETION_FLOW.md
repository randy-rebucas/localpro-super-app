# Provider Profile Completion Flow

## Overview
This document outlines the complete flow for completing a provider profile in the LocalPro Super App, including all related collections, relationships, and API endpoints.

---

## Table of Contents
1. [User and Provider Relationship](#user-and-provider-relationship)
2. [Provider Profile Structure](#provider-profile-structure)
3. [Onboarding Steps Flow](#onboarding-steps-flow)
4. [Reference Collections](#reference-collections)
5. [API Endpoints](#api-endpoints)
6. [Complete Flow Diagram](#complete-flow-diagram)

---

## User and Provider Relationship

### User Model (`User`)
The User model is the base entity that can have multiple roles including `provider`. Key fields:
- `roles`: Array of roles (e.g., `['client', 'provider']`)
- `phoneNumber`: Required, unique
- `email`: Optional, unique
- `firstName`, `lastName`: Profile information
- `profile`: Contains avatar, bio, address
- `localProPlusSubscription`: Reference to subscription
- `wallet`: Reference to UserWallet
- `trust`: Reference to UserTrust
- `referral`: Reference to UserReferral
- `settings`: Reference to UserSettings
- `management`: Reference to UserManagement
- `activity`: Reference to UserActivity
- `agency`: Reference to UserAgency

### Provider Model (`Provider`)
The Provider model is linked to User via `userId` (one-to-one relationship):
- `userId`: Reference to User (required, unique)
- `providerType`: `'individual' | 'business' | 'agency'`
- `status`: `'pending' | 'active' | 'suspended' | 'inactive' | 'rejected'`
- `onboarding`: Progress tracking object
- `settings`: Provider-specific settings

### Automatic Provider Creation
When a User's role includes `'provider'`, the system automatically:
1. Creates a basic Provider profile with default values
2. Sets status to `'pending'`
3. Initializes onboarding with `profile_setup` step completed (10% progress)
4. If provider profile was soft-deleted, it's restored

---

## Provider Profile Structure

### Core Provider Document
Located in: `src/models/Provider.js`

**Direct Fields:**
- `userId`: Reference to User
- `providerType`: Type of provider
- `status`: Current status
- `onboarding`: Progress tracking
- `settings`: Profile visibility, booking settings
- `metadata`: Profile views, featured status, etc.

**Referenced Collections (via ObjectId):**
1. `businessInfo` → `ProviderBusinessInfo`
2. `professionalInfo` → `ProviderProfessionalInfo`
3. `verification` → `ProviderVerification`
4. `financialInfo` → `ProviderFinancialInfo`
5. `preferences` → `ProviderPreferences`
6. `performance` → `ProviderPerformance`

---

## Reference Collections

### 1. ProviderBusinessInfo
**Model:** `src/models/ProviderBusinessInfo.js`  
**Required for:** `business` and `agency` provider types  
**Key Fields:**
- `businessName`: Required
- `businessType`: Type of business
- `businessRegistration`: Registration number
- `taxId`: Tax identification
- `businessAddress`: Full address with coordinates
- `businessPhone`, `businessEmail`: Contact info
- `website`: Business website
- `businessDescription`: Description
- `yearEstablished`: Year business started
- `numberOfEmployees`: Employee count

**Auto-created:** Yes, when provider type is `business` or `agency`

### 2. ProviderProfessionalInfo
**Model:** `src/models/ProviderProfessionalInfo.js`  
**Required for:** All provider types  
**Key Fields:**
- `specialties`: Array of specialty objects
  - `category`: Reference to ServiceCategory
  - `experience`: Years of experience
  - `certifications`: Array of certifications
  - `skills`: Array of ProviderSkill references
  - `hourlyRate`: Rate for this specialty
  - `serviceAreas`: Array of service areas (city, state, radius)
- `languages`: Array of languages spoken
- `availability`: Weekly schedule (Monday-Sunday)
- `emergencyServices`: Boolean
- `travelDistance`: Maximum travel distance
- `minimumJobValue`, `maximumJobValue`: Job value range

**Auto-created:** Yes, for all providers

### 3. ProviderVerification
**Model:** `src/models/ProviderVerification.js`  
**Required for:** All provider types  
**Key Fields:**
- `identityVerified`: Boolean (admin-controlled)
- `businessVerified`: Boolean (admin-controlled, for business/agency)
- `backgroundCheck`: Status, date, report ID
- `insurance`: Insurance details and documents
- `licenses`: Array of professional licenses
- `references`: Array of professional references
- `portfolio`: Images, videos, before/after photos

**Auto-created:** Yes, for all providers

### 4. ProviderFinancialInfo
**Model:** `src/models/ProviderFinancialInfo.js`  
**Required for:** Payment processing  
**Key Fields:**
- `bankAccount`: Bank account details
- `taxInfo`: Tax information
- `paymentMethods`: Available payment methods
- `commissionRate`: Platform commission rate
- `minimumPayout`: Minimum payout amount

**Auto-created:** Yes, for all providers

### 5. ProviderPreferences
**Model:** `src/models/ProviderPreferences.js`  
**Required for:** Provider settings  
**Key Fields:**
- `notificationSettings`: Email, SMS, push preferences
- `jobPreferences`: Job type preferences, auto-accept settings
- `communicationPreferences`: Preferred communication methods

**Auto-created:** Yes, for all providers

### 6. ProviderPerformance
**Model:** `src/models/ProviderPerformance.js`  
**Auto-calculated metrics**  
**Key Fields:**
- `rating`: Average rating
- `totalReviews`: Review count
- `totalJobs`: Total jobs count
- `completedJobs`: Completed jobs
- `cancelledJobs`: Cancelled jobs
- `responseTime`: Average response time
- `completionRate`: Job completion percentage
- `repeatCustomerRate`: Repeat customer percentage
- `earnings`: Earnings breakdown (total, thisMonth, lastMonth)
- `badges`: Achievement badges

**Auto-created:** Yes, for all providers

---

## Onboarding Steps Flow

### Step 1: Profile Setup (`profile_setup`)
**Status:** Completed automatically when provider profile is created  
**Progress:** 10%  
**Requirements:**
- Provider type selection (`individual`, `business`, `agency`)
- Basic provider settings

**API Endpoint:**
- `POST /api/providers/profile` - Creates provider profile

### Step 2: Business Info (`business_info`)
**Status:** Required for `business` and `agency` types only  
**Progress:** 25% (when completed)  
**Requirements:**
- Business name (required)
- Business type
- Business address (city, state required)
- Business phone
- Optional: Registration, tax ID, website, description

**API Endpoint:**
- `PUT /api/providers/profile` - Update with `businessInfo` object
- `PUT /api/providers/onboarding/step` - Mark step as complete

**Validation:**
- Business name must be provided
- Business address (city, state) must be provided

### Step 3: Professional Info (`professional_info`)
**Status:** Required for all provider types  
**Progress:** 40% (when completed)  
**Requirements:**
- At least one specialty with:
  - Category (ServiceCategory reference)
  - Service areas (at least one: city, state, radius)
  - Optional: Experience, certifications, skills, hourly rate
- Languages spoken
- Availability schedule
- Optional: Emergency services, travel distance, job value range

**API Endpoint:**
- `PUT /api/providers/profile` - Update with `professionalInfo` object
- `PUT /api/providers/onboarding/step` - Mark step as complete

**Validation:**
- At least one specialty required
- Each specialty must have category and at least one service area

### Step 4: Verification (`verification`)
**Status:** Required for all provider types  
**Progress:** 55% (when completed)  
**Requirements:**
- Identity verification (admin-controlled)
- Business verification (for business/agency types)
- Background check status
- Insurance information
- Optional: Licenses, references

**API Endpoint:**
- `PUT /api/providers/profile` - Update with `verification` object
- `PUT /api/providers/onboarding/step` - Mark step as complete

**Validation:**
- Identity verification must be true
- Business verification must be true (for business/agency)
- Insurance must be provided

### Step 5: Documents (`documents`)
**Status:** Required for all provider types  
**Progress:** 70% (when completed)  
**Requirements:**
- Identity documents
- Business documents (for business/agency)
- Insurance documents
- Background check documents
- Optional: License documents, tax documents

**API Endpoint:**
- `POST /api/providers/documents/upload` - Upload documents
  - `documentType`: `'insurance' | 'license' | 'portfolio'`
  - `category`: License category (for license type)
  - Files: Multipart form data (max 5 files, 10MB each)
- `PUT /api/providers/onboarding/step` - Mark step as complete

**Validation:**
- Required documents must be uploaded based on provider type

### Step 6: Portfolio (`portfolio`)
**Status:** Optional but recommended  
**Progress:** 85% (when completed)  
**Requirements:**
- Portfolio images
- Optional: Videos, descriptions, before/after photos

**API Endpoint:**
- `POST /api/providers/documents/upload` - Upload portfolio images
  - `documentType`: `'portfolio'`
- `PUT /api/providers/onboarding/step` - Mark step as complete

### Step 7: Preferences (`preferences`)
**Status:** Required for all provider types  
**Progress:** 95% (when completed)  
**Requirements:**
- Notification settings
- Job preferences
- Communication preferences

**API Endpoint:**
- `PUT /api/providers/profile` - Update with `preferences` object
- `PUT /api/providers/onboarding/step` - Mark step as complete

**Validation:**
- All preference categories must be configured

### Step 8: Review (`review`)
**Status:** Final step before submission  
**Progress:** 100% (when completed)  
**Requirements:**
- All previous steps completed
- Profile validation passes
- Ready for admin review

**API Endpoint:**
- `PUT /api/providers/onboarding/step` - Mark step as complete
- Provider status automatically set to `'pending'` for admin review

**Validation:**
- All required steps must be completed
- Provider-specific requirements must be met
- Professional info must have at least one specialty
- Business info required for business/agency types
- Identity verification must be true

---

## API Endpoints

### Provider Profile Management

#### 1. Get My Provider Profile
```
GET /api/providers/profile/me
```
**Authentication:** Required  
**Description:** Get current user's provider profile with all populated data  
**Response:** Full provider object with all referenced collections

#### 2. Create Provider Profile
```
POST /api/providers/profile
```
**Authentication:** Required  
**Description:** Create provider profile (upgrade from client)  
**Requirements:**
- User must have `client` role
- Provider profile must not already exist

**Request Body:**
```json
{
  "providerType": "individual" | "business" | "agency",
  "businessInfo": { /* optional, required for business/agency */ },
  "professionalInfo": { /* optional */ },
  "verification": { /* optional */ },
  "preferences": { /* optional */ },
  "settings": { /* optional */ }
}
```

**Response:** Created provider object

#### 3. Update Provider Profile
```
PUT /api/providers/profile
```
**Authentication:** Required  
**Description:** Update provider profile (supports partial updates)  
**Request Body:** Any provider fields (all optional)

**Example:**
```json
{
  "providerType": "business",
  "settings": {
    "profileVisibility": "public",
    "showPricing": true
  },
  "businessInfo": {
    "businessName": "My Business",
    "businessType": "small_business",
    "businessAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    }
  },
  "professionalInfo": {
    "specialties": [{
      "category": "plumbing",
      "hourlyRate": 90,
      "serviceAreas": [{
        "city": "New York",
        "state": "NY",
        "radius": 35
      }]
    }]
  }
}
```

### Onboarding

#### 4. Update Onboarding Step
```
PUT /api/providers/onboarding/step
```
**Authentication:** Required  
**Description:** Mark an onboarding step as complete  
**Request Body:**
```json
{
  "step": "profile_setup" | "business_info" | "professional_info" | "verification" | "documents" | "portfolio" | "preferences" | "review",
  "data": { /* optional step data */ }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "step": "professional_info",
    "progress": 40,
    "completed": false
  }
}
```

### Document Upload

#### 5. Upload Documents
```
POST /api/providers/documents/upload
```
**Authentication:** Required  
**Content-Type:** `multipart/form-data`  
**Description:** Upload provider documents  
**Request:**
- `documentType`: `'insurance' | 'license' | 'portfolio'`
- `category`: License category (required for license type)
- `documents`: Files (max 5 files, 10MB each, images or PDFs)

**Response:**
```json
{
  "success": true,
  "data": {
    "documentType": "insurance",
    "fileUrls": ["url1", "url2"],
    "fileCount": 2
  }
}
```

### Dashboard & Analytics

#### 6. Get Provider Dashboard
```
GET /api/providers/dashboard/overview
```
**Authentication:** Required  
**Description:** Get provider dashboard data

#### 7. Get Provider Analytics
```
GET /api/providers/analytics/performance?timeframe=30d
```
**Authentication:** Required  
**Description:** Get provider performance analytics

### Public Endpoints

#### 8. Get Providers
```
GET /api/providers?status=active&providerType=individual&category=plumbing&city=New York&state=NY&minRating=4.5
```
**Authentication:** Optional  
**Description:** Get list of providers with filtering

#### 9. Get Provider by ID
```
GET /api/providers/:id
```
**Authentication:** Optional  
**Description:** Get single provider (accepts User ID or Provider ID)

#### 10. Get Provider Skills
```
GET /api/providers/skills?category=plumbing
```
**Authentication:** Not required  
**Description:** Get available provider skills

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROVIDER PROFILE COMPLETION FLOW             │
└─────────────────────────────────────────────────────────────────┘

1. USER REGISTRATION/LOGIN
   └─> User has 'client' role
   └─> User decides to become provider

2. CREATE PROVIDER PROFILE
   POST /api/providers/profile
   ├─> Validates user has 'client' role
   ├─> Creates Provider document
   ├─> Sets status: 'pending'
   ├─> Initializes onboarding:
   │   ├─> completed: false
   │   ├─> currentStep: 'profile_setup'
   │   ├─> progress: 10%
   │   └─> steps: [{ step: 'profile_setup', completed: true }]
   ├─> Auto-creates related documents:
   │   ├─> ProviderVerification
   │   ├─> ProviderProfessionalInfo
   │   ├─> ProviderPreferences
   │   ├─> ProviderFinancialInfo
   │   ├─> ProviderPerformance
   │   └─> ProviderBusinessInfo (if business/agency)
   └─> Adds 'provider' role to User

3. STEP 1: PROFILE SETUP (Auto-completed)
   └─> Provider type selected
   └─> Basic settings configured

4. STEP 2: BUSINESS INFO (Required for business/agency)
   PUT /api/providers/profile
   ├─> Update businessInfo object
   ├─> Required fields:
   │   ├─> businessName
   │   ├─> businessType
   │   ├─> businessAddress (city, state)
   │   └─> businessPhone
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'business_info' as complete
       └─> Progress: 25%

5. STEP 3: PROFESSIONAL INFO (Required)
   PUT /api/providers/profile
   ├─> Update professionalInfo object
   ├─> Required:
   │   ├─> specialties (at least one)
   │   │   ├─> category (ServiceCategory)
   │   │   └─> serviceAreas (at least one)
   │   └─> languages
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'professional_info' as complete
       └─> Progress: 40%

6. STEP 4: VERIFICATION (Required)
   PUT /api/providers/profile
   ├─> Update verification object
   ├─> Required:
   │   ├─> identityVerified (admin-controlled)
   │   ├─> businessVerified (for business/agency)
   │   ├─> insurance.hasInsurance
   │   └─> backgroundCheck.status
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'verification' as complete
       └─> Progress: 55%

7. STEP 5: DOCUMENTS (Required)
   POST /api/providers/documents/upload
   ├─> Upload identity documents
   ├─> Upload business documents (if business/agency)
   ├─> Upload insurance documents
   ├─> Upload background check documents
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'documents' as complete
       └─> Progress: 70%

8. STEP 6: PORTFOLIO (Optional)
   POST /api/providers/documents/upload
   ├─> Upload portfolio images
   ├─> Optional: Videos, before/after photos
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'portfolio' as complete
       └─> Progress: 85%

9. STEP 7: PREFERENCES (Required)
   PUT /api/providers/profile
   ├─> Update preferences object
   ├─> Required:
   │   ├─> notificationSettings
   │   ├─> jobPreferences
   │   └─> communicationPreferences
   └─> PUT /api/providers/onboarding/step
       └─> Mark 'preferences' as complete
       └─> Progress: 95%

10. STEP 8: REVIEW (Final)
    PUT /api/providers/onboarding/step
    ├─> Validate complete profile
    ├─> Check all requirements met
    ├─> Mark 'review' as complete
    ├─> Progress: 100%
    ├─> onboarding.completed: true
    └─> status: 'pending' (ready for admin review)

11. ADMIN REVIEW
    └─> Admin reviews provider application
    └─> Admin can:
        ├─> Approve → status: 'active'
        ├─> Reject → status: 'rejected'
        └─> Request info → status: 'pending'

12. PROVIDER ACTIVE
    └─> Provider can now accept jobs
    └─> Profile visible in marketplace
    └─> Can receive bookings
```

---

## Validation Requirements by Provider Type

### Individual Provider
**Required:**
- ✅ Profile setup
- ✅ Professional info (specialties, service areas)
- ✅ Verification (identity, insurance, background check)
- ✅ Documents (identity, insurance, background check)
- ✅ Preferences

**Optional:**
- Portfolio
- Business info (not required)

### Business Provider
**Required:**
- ✅ Profile setup
- ✅ Business info (businessName, businessType, address, phone)
- ✅ Professional info (specialties, service areas)
- ✅ Verification (identity, business, insurance, background check)
- ✅ Documents (identity, business, insurance, background check)
- ✅ Preferences

**Optional:**
- Portfolio
- Licenses
- References

### Agency Provider
**Required:**
- ✅ Profile setup
- ✅ Business info (businessName, businessType, address, phone)
- ✅ Professional info (specialties, service areas)
- ✅ Verification (identity, business, insurance, background check, agency license)
- ✅ Documents (identity, business, insurance, background check, agency license)
- ✅ Preferences

**Optional:**
- Portfolio
- Additional licenses
- References
- Bonding documents

---

## Related Collections Reference

### Collections that Reference User:
1. **Provider** - `userId` (one-to-one)
2. **UserReferral** - `user` (one-to-one)
3. **UserActivity** - `user` (one-to-one)
4. **UserWallet** - `user` (one-to-one)
5. **UserTrust** - `user` (one-to-one)
6. **UserSettings** - `user` (one-to-one)
7. **UserManagement** - `user` (one-to-one)
8. **UserAgency** - `user` (one-to-one)
9. **UserSubscription** - `user` (one-to-many)
10. **AccessToken** - `user` (one-to-many)
11. **ApiKey** - `user` (one-to-many)
12. **Job** - `client`, `provider` (many-to-one)
13. **Marketplace** - `provider` (many-to-one)
14. **Escrow** - `client`, `provider` (many-to-one)
15. **Payout** - `user` (many-to-one)
16. **Communication** - `sender`, `recipient` (many-to-one)
17. **Activity** - `user` (many-to-one)
18. **Favorite** - `user` (many-to-one)
19. **Academy** - `instructor`, `student` (many-to-one)
20. **Agency** - `owner`, `admins`, `providers.user` (many-to-one)
21. **LiveChat** - `user`, `agent` (many-to-one)
22. **TrustVerification** - `user` (many-to-one)
23. **Finance** - `user` (many-to-one)
24. **EmailSubscriber** - `user` (one-to-one)
25. **EmailCampaign** - `createdBy`, `sentTo` (many-to-one)
26. **Broadcaster** - `user` (many-to-one)
27. **Partner** - `user` (many-to-one)
28. **Referral** - `referrer`, `referee` (many-to-one)

### Collections that Reference Provider:
1. **ProviderBusinessInfo** - `provider` (one-to-one)
2. **ProviderProfessionalInfo** - `provider` (one-to-one)
3. **ProviderVerification** - `provider` (one-to-one)
4. **ProviderFinancialInfo** - `provider` (one-to-one)
5. **ProviderPreferences** - `provider` (one-to-one)
6. **ProviderPerformance** - `provider` (one-to-one)
7. **Job** - `provider` (many-to-one)
8. **Marketplace** - `provider` (many-to-one)
9. **Escrow** - `provider` (many-to-one)

---

## Key Methods and Helpers

### Provider Model Methods:
- `ensureBusinessInfo()` - Get or create business info
- `ensureProfessionalInfo()` - Get or create professional info
- `ensureVerification()` - Get or create verification
- `ensurePreferences()` - Get or create preferences
- `ensureFinancialInfo()` - Get or create financial info
- `ensurePerformance()` - Get or create performance
- `isVerified()` - Check if provider is verified
- `canAcceptJobs()` - Check if provider can accept jobs
- `getServiceAreas()` - Get all service areas

### ProviderVerificationService Methods:
- `getOnboardingProgress(userId)` - Get onboarding status
- `validateOnboardingStep(userId, step, data)` - Validate step data
- `validateCompleteProfile(provider)` - Validate full profile
- `submitForReview(userId)` - Submit for admin review
- `getVerificationStatus(userId)` - Get verification status
- `canAcceptJobs(userId)` - Check job acceptance capability

---

## Notes

1. **Automatic Creation**: When a Provider is created, all related documents (verification, professionalInfo, etc.) are automatically created via post-save hooks.

2. **Soft Delete**: Provider profiles are soft-deleted (not hard-deleted) when user loses provider role. They can be restored if user regains provider role.

3. **Progress Calculation**: Onboarding progress is calculated as: `(completedSteps / 8) * 100`

4. **Status Flow**: 
   - `pending` → Initial state, after onboarding complete
   - `active` → Approved by admin, can accept jobs
   - `suspended` → Temporarily suspended
   - `inactive` → Inactive provider
   - `rejected` → Application rejected

5. **Subscription**: Provider subscription is managed through User model (`localProPlusSubscription`), not Provider model.

6. **Multi-Role Support**: Users can have multiple roles simultaneously (e.g., `['client', 'provider']`).

---

## Testing the Flow

### 1. Create Provider Profile
```bash
POST /api/providers/profile
Authorization: Bearer <token>
{
  "providerType": "individual"
}
```

### 2. Update Business Info (if business/agency)
```bash
PUT /api/providers/profile
Authorization: Bearer <token>
{
  "businessInfo": {
    "businessName": "My Business",
    "businessType": "small_business",
    "businessAddress": {
      "city": "New York",
      "state": "NY"
    },
    "businessPhone": "+1234567890"
  }
}
```

### 3. Update Professional Info
```bash
PUT /api/providers/profile
Authorization: Bearer <token>
{
  "professionalInfo": {
    "specialties": [{
      "category": "plumbing",
      "hourlyRate": 90,
      "serviceAreas": [{
        "city": "New York",
        "state": "NY",
        "radius": 35
      }]
    }],
    "languages": ["English", "Spanish"]
  }
}
```

### 4. Mark Steps Complete
```bash
PUT /api/providers/onboarding/step
Authorization: Bearer <token>
{
  "step": "professional_info",
  "data": {}
}
```

### 5. Upload Documents
```bash
POST /api/providers/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
documentType: insurance
documents: <file1>, <file2>
```

### 6. Check Progress
```bash
GET /api/providers/profile/me
Authorization: Bearer <token>
```

---

## Summary

The provider profile completion flow is a structured 8-step onboarding process that:
1. Creates a Provider document linked to User
2. Auto-creates all related reference collections
3. Guides provider through required information
4. Validates completion at each step
5. Submits for admin review when complete
6. Enables job acceptance when approved

All related collections are automatically created and managed through helper methods, ensuring data consistency and completeness.


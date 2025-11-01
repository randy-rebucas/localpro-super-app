# UpdateProfilePayload - Role-Based Field Analysis

## Overview
This document analyzes the `UpdateProfilePayload` interface and maps each entity/field to the roles that are capable or suitable for using them.

## System Roles
Based on the codebase, the following roles exist:
- **CLIENT** - Service consumers who book services and apply for jobs
- **PROVIDER** - Service providers who offer services and create jobs
- **SUPPLIER** - Manage supplies, products, and equipment
- **INSTRUCTOR** - Create and manage courses
- **ADMIN** - System administrators with full access
- **AGENCY_OWNER** - Own and manage agencies
- **AGENCY_ADMIN** - Manage agency operations
- **ADVERTISER** - Create and manage advertisements

---

## Field-by-Field Role Mapping

### 1. Basic Information Fields

#### `firstName`, `lastName`, `email`
**Suitable for:** ✅ ALL ROLES
- **Rationale:** Universal identification fields required for all users
- **Priority:** Essential for all roles

---

### 2. Profile Fields

#### `profile.bio`
**Suitable for:**
- ✅ **PROVIDER** - Showcase professional background and expertise
- ✅ **INSTRUCTOR** - Describe teaching philosophy and credentials
- ✅ **AGENCY_OWNER** - Present agency mission and values
- ✅ **AGENCY_ADMIN** - Provide operational context
- ✅ **SUPPLIER** - Describe business and product offerings
- ✅ **ADVERTISER** - Brand/personal description
- ⚠️ **CLIENT** - Optional, minimal use case
- ❌ **ADMIN** - Typically not needed

**Priority:**
- High: PROVIDER, INSTRUCTOR, AGENCY_OWNER, SUPPLIER
- Medium: AGENCY_ADMIN, ADVERTISER
- Low: CLIENT

---

#### `profile.address` (street, city, state, zipCode, country, coordinates)
**Suitable for:**
- ✅ **PROVIDER** - Service area identification, location-based matching
- ✅ **SUPPLIER** - Delivery zones, service areas
- ✅ **AGENCY_OWNER** - Business location, headquarters
- ✅ **AGENCY_ADMIN** - Agency location
- ✅ **INSTRUCTOR** - Training location, in-person sessions
- ⚠️ **CLIENT** - Optional for profile completeness
- ⚠️ **ADMIN** - Optional for system records
- ❌ **ADVERTISER** - Typically not needed

**Priority:**
- High: PROVIDER, SUPPLIER (critical for service area matching)
- Medium: AGENCY_OWNER, AGENCY_ADMIN, INSTRUCTOR
- Low: CLIENT, ADMIN

**Special Notes:**
- Coordinates (lat/lng) are critical for PROVIDER and SUPPLIER for geolocation-based searches
- Service area matching relies heavily on address data

---

#### `profile.skills`
**Suitable for:**
- ✅ **PROVIDER** - Core competency areas, service capabilities
- ✅ **INSTRUCTOR** - Subject expertise, teaching specializations
- ✅ **AGENCY_ADMIN** - Operational skills, management capabilities
- ⚠️ **AGENCY_OWNER** - Leadership and business skills (optional)
- ⚠️ **CLIENT** - Job application requirements (optional)
- ❌ **SUPPLIER** - Not applicable (use specialties instead)
- ❌ **ADMIN** - Not applicable
- ❌ **ADVERTISER** - Not applicable

**Priority:**
- High: PROVIDER, INSTRUCTOR
- Medium: AGENCY_ADMIN
- Low: AGENCY_OWNER, CLIENT

---

#### `profile.experience`
**Suitable for:**
- ✅ **PROVIDER** - Years of service delivery experience
- ✅ **INSTRUCTOR** - Years of teaching/training experience
- ✅ **AGENCY_OWNER** - Business leadership experience
- ✅ **AGENCY_ADMIN** - Management experience
- ⚠️ **CLIENT** - Job application purposes (optional)
- ❌ **SUPPLIER** - Use `yearsInBusiness` instead
- ❌ **ADMIN** - Not applicable
- ❌ **ADVERTISER** - Not applicable

**Priority:**
- High: PROVIDER, INSTRUCTOR
- Medium: AGENCY_OWNER, AGENCY_ADMIN
- Low: CLIENT

---

### 3. Business Information Fields

#### `profile.businessName`
**Suitable for:**
- ✅ **PROVIDER** - Business entity name (if not individual)
- ✅ **SUPPLIER** - Company name
- ✅ **AGENCY_OWNER** - Agency name
- ✅ **AGENCY_ADMIN** - Agency name (reference)
- ✅ **INSTRUCTOR** - Training company or school name
- ✅ **ADVERTISER** - Business/brand name
- ❌ **CLIENT** - Not applicable
- ❌ **ADMIN** - Not applicable

**Priority:**
- High: AGENCY_OWNER, SUPPLIER, ADVERTISER
- Medium: PROVIDER (if businessType != 'individual'), INSTRUCTOR
- Low: AGENCY_ADMIN

---

#### `profile.businessType` ('individual' | 'small_business' | 'enterprise' | 'franchise')
**Suitable for:**
- ✅ **PROVIDER** - Legal structure definition
  - `individual` - Solo practitioner
  - `small_business` - Small company
  - `enterprise` - Large organization
  - `franchise` - Franchise operation
- ✅ **SUPPLIER** - Business structure
  - `small_business` - Most common
  - `enterprise` - Large suppliers
  - `franchise` - Franchise distributors
- ✅ **AGENCY_OWNER** - Agency structure
  - `small_business` - Small agency
  - `enterprise` - Large agency network
  - `franchise` - Franchise agency
- ✅ **INSTRUCTOR** - Training business structure
  - `individual` - Independent instructor
  - `small_business` - Training company
- ✅ **ADVERTISER** - Advertising entity type
  - `small_business` - Small agency
  - `enterprise` - Large advertising company
- ❌ **CLIENT** - Not applicable
- ❌ **ADMIN** - Not applicable
- ❌ **AGENCY_ADMIN** - Not applicable (inherits from agency)

**Priority:**
- High: PROVIDER, AGENCY_OWNER, SUPPLIER
- Medium: INSTRUCTOR, ADVERTISER

---

#### `profile.yearsInBusiness`
**Suitable for:**
- ✅ **PROVIDER** - Business longevity indicator
- ✅ **SUPPLIER** - Company age and stability
- ✅ **AGENCY_OWNER** - Agency establishment date
- ✅ **INSTRUCTOR** - Training business duration
- ✅ **ADVERTISER** - Business tenure
- ❌ **CLIENT** - Not applicable
- ❌ **ADMIN** - Not applicable
- ❌ **AGENCY_ADMIN** - Not applicable

**Priority:**
- High: PROVIDER, AGENCY_OWNER, SUPPLIER
- Medium: INSTRUCTOR, ADVERTISER

---

#### `profile.serviceAreas` (string[])
**Suitable for:**
- ✅ **PROVIDER** - Geographic coverage areas (CRITICAL)
- ✅ **SUPPLIER** - Delivery/service regions (CRITICAL)
- ✅ **AGENCY_OWNER** - Agency service coverage
- ✅ **INSTRUCTOR** - Training service locations
- ⚠️ **ADVERTISER** - Target markets (optional)
- ❌ **CLIENT** - Not applicable
- ❌ **ADMIN** - Not applicable
- ❌ **AGENCY_ADMIN** - Not applicable

**Priority:**
- High: PROVIDER, SUPPLIER (essential for matching)
- Medium: AGENCY_OWNER, INSTRUCTOR
- Low: ADVERTISER

**Special Notes:**
- Critical for search/discovery algorithms
- Used for location-based service matching

---

#### `profile.specialties` (string[])
**Suitable for:**
- ✅ **PROVIDER** - Service specializations (e.g., "plumbing", "electrical", "landscaping")
- ✅ **SUPPLIER** - Product categories (e.g., "tools", "materials", "equipment")
- ✅ **INSTRUCTOR** - Course topics/subjects (e.g., "safety training", "technical skills")
- ✅ **AGENCY_OWNER** - Agency focus areas
- ⚠️ **ADVERTISER** - Advertising specialties
- ❌ **CLIENT** - Not applicable
- ❌ **ADMIN** - Not applicable
- ❌ **AGENCY_ADMIN** - Not applicable

**Priority:**
- High: PROVIDER, SUPPLIER, INSTRUCTOR
- Medium: AGENCY_OWNER
- Low: ADVERTISER

---

### 4. Professional Credentials

#### `profile.certifications` (Array)
**Suitable for:**
- ✅ **PROVIDER** - Professional licenses, trade certifications (REQUIRED for many services)
- ✅ **INSTRUCTOR** - Teaching credentials, subject matter certifications
- ✅ **AGENCY_OWNER** - Business licenses, industry certifications
- ⚠️ **SUPPLIER** - Product certifications (optional)
- ⚠️ **AGENCY_ADMIN** - Relevant professional certifications
- ❌ **CLIENT** - Not applicable
- ❌ **ADMIN** - Not applicable
- ❌ **ADVERTISER** - Not applicable

**Priority:**
- High: PROVIDER (often required for legal compliance)
- Medium: INSTRUCTOR, AGENCY_OWNER
- Low: SUPPLIER, AGENCY_ADMIN

**Special Notes:**
- Document uploads are critical for verification
- Expiry dates are important for compliance tracking

---

#### `profile.insurance`
**Suitable for:**
- ✅ **PROVIDER** - Liability insurance (OFTEN REQUIRED)
- ✅ **AGENCY_OWNER** - Business insurance
- ✅ **AGENCY_ADMIN** - Agency insurance reference
- ⚠️ **SUPPLIER** - Product liability insurance (optional)
- ⚠️ **INSTRUCTOR** - Professional liability (optional)
- ❌ **CLIENT** - Not applicable
- ❌ **ADMIN** - Not applicable
- ❌ **ADVERTISER** - Not applicable

**Priority:**
- High: PROVIDER (required for many service types)
- Medium: AGENCY_OWNER
- Low: SUPPLIER, INSTRUCTOR, AGENCY_ADMIN

**Special Notes:**
- Coverage amount and expiry tracking critical
- Document upload required for verification

---

#### `profile.backgroundCheck`
**Suitable for:**
- ✅ **PROVIDER** - Safety verification (OFTEN REQUIRED)
- ✅ **INSTRUCTOR** - Trust verification for teaching
- ✅ **AGENCY_OWNER** - Business credibility
- ⚠️ **AGENCY_ADMIN** - Trust verification
- ❌ **CLIENT** - Not applicable (unless applying for jobs)
- ❌ **SUPPLIER** - Not typically required
- ❌ **ADMIN** - Not applicable
- ❌ **ADVERTISER** - Not applicable

**Priority:**
- High: PROVIDER (critical for trust and safety)
- Medium: INSTRUCTOR, AGENCY_OWNER
- Low: AGENCY_ADMIN

**Status Values:**
- `pending` - Under review
- `approved` - Verified and cleared
- `rejected` - Failed background check
- `not_required` - Role doesn't require it

---

### 5. Portfolio & Work Samples

#### `profile.portfolio` (Array)
**Suitable for:**
- ✅ **PROVIDER** - Showcase completed work, before/after images (HIGHLY RECOMMENDED)
- ✅ **INSTRUCTOR** - Sample training materials, course previews
- ✅ **AGENCY_OWNER** - Agency portfolio, case studies
- ✅ **ADVERTISER** - Advertising portfolio, campaign examples
- ⚠️ **SUPPLIER** - Product showcases (optional)
- ⚠️ **AGENCY_ADMIN** - Operational examples (optional)
- ❌ **CLIENT** - Not applicable
- ❌ **ADMIN** - Not applicable

**Priority:**
- High: PROVIDER (builds trust and credibility)
- Medium: INSTRUCTOR, AGENCY_OWNER, ADVERTISER
- Low: SUPPLIER, AGENCY_ADMIN

**Structure:**
- Title, description, images, category, completion date
- Critical for PROVIDER to demonstrate expertise

---

### 6. Availability & Scheduling

#### `profile.availability`
**Suitable for:**
- ✅ **PROVIDER** - Service availability schedule (CRITICAL for booking)
- ✅ **INSTRUCTOR** - Class/training schedule
- ✅ **SUPPLIER** - Delivery/service hours
- ✅ **AGENCY_ADMIN** - Operational hours
- ⚠️ **AGENCY_OWNER** - Business hours (optional)
- ❌ **CLIENT** - Not applicable
- ❌ **ADMIN** - Not applicable
- ❌ **ADVERTISER** - Not applicable

**Priority:**
- High: PROVIDER, INSTRUCTOR, SUPPLIER
- Medium: AGENCY_ADMIN
- Low: AGENCY_OWNER

**Structure:**
- `schedule[]` - Day-based availability (Monday-Sunday)
- `timezone` - Time zone for scheduling
- `emergencyService` - 24/7 availability flag (PROVIDER-specific)

**Special Notes:**
- Emergency service flag is primarily for PROVIDER role
- Schedule array essential for booking system integration

---

## Summary by Role

### 🔵 CLIENT
**Essential Fields:** firstName, lastName, email
**Optional Fields:** profile.bio, profile.address
**Not Applicable:** All business fields, certifications, insurance, portfolio, availability

**Profile Completeness Requirements:** Minimal - basic identification only

---

### 🟢 PROVIDER
**Essential Fields:**
- firstName, lastName, email
- profile.skills
- profile.experience
- profile.serviceAreas (CRITICAL)
- profile.specialties
- profile.certifications (often required)
- profile.insurance (often required)
- profile.backgroundCheck (often required)
- profile.availability (CRITICAL)
- profile.address.coordinates (for geolocation)

**Recommended Fields:**
- profile.bio
- profile.businessName (if businessType != 'individual')
- profile.businessType
- profile.yearsInBusiness
- profile.portfolio (builds trust)
- profile.availability.emergencyService

**Optional Fields:**
- profile.address (if coordinates provided)

**Profile Completeness Requirements:** HIGH - Most comprehensive profile needed

---

### 🟡 SUPPLIER
**Essential Fields:**
- firstName, lastName, email
- profile.businessName
- profile.businessType
- profile.serviceAreas (CRITICAL for delivery zones)
- profile.specialties (product categories)
- profile.address.coordinates (for delivery matching)
- profile.availability (delivery hours)

**Recommended Fields:**
- profile.bio
- profile.yearsInBusiness
- profile.address (full address)

**Optional Fields:**
- profile.skills
- profile.certifications
- profile.insurance
- profile.portfolio

**Profile Completeness Requirements:** MEDIUM-HIGH

---

### 🟣 INSTRUCTOR
**Essential Fields:**
- firstName, lastName, email
- profile.bio
- profile.skills
- profile.experience
- profile.specialties (course topics)
- profile.availability (class schedules)

**Recommended Fields:**
- profile.businessName
- profile.businessType
- profile.yearsInBusiness
- profile.certifications
- profile.portfolio
- profile.address

**Optional Fields:**
- profile.backgroundCheck
- profile.insurance
- profile.serviceAreas

**Profile Completeness Requirements:** MEDIUM-HIGH

---

### 🔴 AGENCY_OWNER
**Essential Fields:**
- firstName, lastName, email
- profile.businessName
- profile.businessType
- profile.yearsInBusiness

**Recommended Fields:**
- profile.bio
- profile.address
- profile.experience
- profile.serviceAreas
- profile.specialties
- profile.certifications
- profile.insurance
- profile.portfolio
- profile.backgroundCheck

**Optional Fields:**
- profile.skills
- profile.availability

**Profile Completeness Requirements:** MEDIUM

---

### 🟠 AGENCY_ADMIN
**Essential Fields:**
- firstName, lastName, email

**Recommended Fields:**
- profile.bio
- profile.skills
- profile.experience
- profile.address

**Optional Fields:**
- profile.address
- profile.backgroundCheck

**Profile Completeness Requirements:** LOW-MEDIUM

---

### ⚫ ADMIN
**Essential Fields:**
- firstName, lastName, email

**Optional Fields:**
- profile.bio
- profile.address

**Not Applicable:** All business and professional fields

**Profile Completeness Requirements:** MINIMAL

---

### 🔵 ADVERTISER
**Essential Fields:**
- firstName, lastName, email
- profile.businessName
- profile.businessType

**Recommended Fields:**
- profile.bio
- profile.portfolio
- profile.specialties

**Optional Fields:**
- profile.address
- profile.yearsInBusiness
- profile.serviceAreas

**Profile Completeness Requirements:** MEDIUM

---

## Field Priority Matrix

| Field | CLIENT | PROVIDER | SUPPLIER | INSTRUCTOR | AGENCY_OWNER | AGENCY_ADMIN | ADMIN | ADVERTISER |
|-------|--------|----------|----------|------------|--------------|--------------|-------|------------|
| firstName/lastName/email | ✅ Essential | ✅ Essential | ✅ Essential | ✅ Essential | ✅ Essential | ✅ Essential | ✅ Essential | ✅ Essential |
| bio | ⚠️ Optional | ✅ Recommended | ✅ Recommended | ✅ Essential | ✅ Recommended | ✅ Recommended | ❌ N/A | ✅ Recommended |
| address | ⚠️ Optional | ⚠️ Optional | ✅ Recommended | ✅ Recommended | ✅ Recommended | ⚠️ Optional | ⚠️ Optional | ⚠️ Optional |
| coordinates | ❌ N/A | ✅ Essential | ✅ Essential | ⚠️ Optional | ⚠️ Optional | ❌ N/A | ❌ N/A | ❌ N/A |
| skills | ❌ N/A | ✅ Essential | ❌ N/A | ✅ Essential | ⚠️ Optional | ⚠️ Optional | ❌ N/A | ❌ N/A |
| experience | ❌ N/A | ✅ Essential | ❌ N/A | ✅ Essential | ✅ Recommended | ⚠️ Optional | ❌ N/A | ❌ N/A |
| businessName | ❌ N/A | ⚠️ Conditional* | ✅ Essential | ⚠️ Optional | ✅ Essential | ❌ N/A | ❌ N/A | ✅ Essential |
| businessType | ❌ N/A | ✅ Recommended | ✅ Essential | ⚠️ Optional | ✅ Essential | ❌ N/A | ❌ N/A | ✅ Recommended |
| yearsInBusiness | ❌ N/A | ✅ Recommended | ✅ Recommended | ⚠️ Optional | ✅ Essential | ❌ N/A | ❌ N/A | ⚠️ Optional |
| serviceAreas | ❌ N/A | ✅ Essential | ✅ Essential | ⚠️ Optional | ✅ Recommended | ❌ N/A | ❌ N/A | ⚠️ Optional |
| specialties | ❌ N/A | ✅ Essential | ✅ Essential | ✅ Essential | ✅ Recommended | ❌ N/A | ❌ N/A | ⚠️ Optional |
| certifications | ❌ N/A | ✅ Essential** | ⚠️ Optional | ✅ Recommended | ✅ Recommended | ⚠️ Optional | ❌ N/A | ❌ N/A |
| insurance | ❌ N/A | ✅ Essential** | ⚠️ Optional | ⚠️ Optional | ✅ Recommended | ❌ N/A | ❌ N/A | ❌ N/A |
| backgroundCheck | ❌ N/A | ✅ Essential** | ❌ N/A | ✅ Recommended | ✅ Recommended | ⚠️ Optional | ❌ N/A | ❌ N/A |
| portfolio | ❌ N/A | ✅ Recommended | ⚠️ Optional | ✅ Recommended | ✅ Recommended | ⚠️ Optional | ❌ N/A | ✅ Recommended |
| availability | ❌ N/A | ✅ Essential | ✅ Essential | ✅ Essential | ⚠️ Optional | ⚠️ Optional | ❌ N/A | ❌ N/A |

**Legend:**
- ✅ Essential = Required or highly critical
- ✅ Recommended = Should be included for profile completeness
- ⚠️ Optional = Nice to have but not required
- ❌ N/A = Not applicable for this role

\* Conditional: Required if businessType != 'individual'
\** Essential for many service types (legal/compliance requirements)

---

## Recommendations for Implementation

### 1. Role-Based Validation Rules
Implement different validation schemas based on user role:
- **PROVIDER**: Stricter validation, require essential fields
- **SUPPLIER**: Focus on business and service area fields
- **INSTRUCTOR**: Emphasize skills, experience, and certifications
- **CLIENT**: Minimal validation, basic fields only

### 2. Profile Completeness Scoring
Create role-specific completeness algorithms:
- PROVIDER: 80%+ required for active listing
- SUPPLIER: 70%+ for product visibility
- INSTRUCTOR: 75%+ for course creation
- Other roles: Lower thresholds

### 3. Conditional Field Requirements
- `businessName` required when `businessType != 'individual'`
- `certifications` required for certain provider specialties
- `insurance` required for high-risk service categories
- `backgroundCheck` required for provider role activation

### 4. Field Grouping for UI
Group fields in role-appropriate sections:
- **PROVIDER**: Personal Info → Professional Info → Business Info → Verification → Portfolio → Availability
- **SUPPLIER**: Personal Info → Business Info → Service Areas → Availability
- **INSTRUCTOR**: Personal Info → Teaching Credentials → Courses → Schedule

### 5. Progressive Disclosure
Show/hide fields based on role selection and business type to simplify the user experience.


# User Role Journey - Quick Reference Guide

> **Quick access to all user role documentation**  
> **Version:** 1.0.0  
> **Last Updated:** January 13, 2026

---

## 📚 All Role Journeys

### Consumer Role
| Role | Document | Description | Key Features |
|------|----------|-------------|--------------|
| 🛍️ **Client** | [Client Journey](01_CLIENT_JOURNEY.md) | Default base role for all users | Service booking, Job search, Shopping, Learning |

### Service Provider Roles
| Role | Document | Description | Key Features |
|------|----------|-------------|--------------|
| 🛠️ **Provider** | [Provider Journey](02_PROVIDER_JOURNEY.md) | Individual/business service provider | Offer services, Manage bookings, Earn income |
| 🏢 **Agency Owner** | [Agency Owner Journey](06_AGENCY_OWNER_JOURNEY.md) | Owns and manages service agency | Recruit providers, Bulk operations, Agency finances |
| 👔 **Agency Admin** | [Agency Admin Journey](07_AGENCY_ADMIN_JOURNEY.md) | Day-to-day agency operations | Provider coordination, Booking dispatch, Operations |

### Business Roles
| Role | Document | Description | Key Features |
|------|----------|-------------|--------------|
| 📦 **Supplier** | [Supplier Journey](04_SUPPLIER_JOURNEY.md) | Sells products and supplies | Product catalog, Order fulfillment, Inventory |
| 🎓 **Instructor** | [Instructor Journey](05_INSTRUCTOR_JOURNEY.md) | Creates and teaches courses | Course creation, Student management, Certifications |
| 🤝 **Partner** | [Partner Journey](08_PARTNER_JOURNEY.md) | Corporate/LGU/institutional partner | Bulk services, Employee benefits, Corporate billing |

### Management Roles
| Role | Document | Description | Key Features |
|------|----------|-------------|--------------|
| ⚙️ **Admin** | [Admin Journey](03_ADMIN_JOURNEY.md) | Platform administrator | User management, Verification, System configuration |
| 👥 **Staff** | [Staff Journey](09_STAFF_JOURNEY.md) | Platform staff with specific permissions | Support, Moderation, Assigned tasks |

---

## 🎯 Role Selection Guide

### "I want to..."

**Book services or buy products**
→ You're a [Client](01_CLIENT_JOURNEY.md) (default role)

**Offer professional services**
→ Become a [Provider](02_PROVIDER_JOURNEY.md)

**Sell products and supplies**
→ Register as a [Supplier](04_SUPPLIER_JOURNEY.md)

**Teach courses and share expertise**
→ Apply as an [Instructor](05_INSTRUCTOR_JOURNEY.md)

**Manage a team of service providers**
→ Create an [Agency Owner](06_AGENCY_OWNER_JOURNEY.md) account

**Help run an agency**
→ Get appointed as [Agency Admin](07_AGENCY_ADMIN_JOURNEY.md)

**Provide services to employees/constituents**
→ Register as a [Partner](08_PARTNER_JOURNEY.md)

**Manage the platform**
→ Admin access required - see [Admin Journey](03_ADMIN_JOURNEY.md)

**Support platform operations**
→ Staff account needed - see [Staff Journey](09_STAFF_JOURNEY.md)

---

## 🔄 Role Combinations

Users can have multiple roles simultaneously:

| Primary Role | + Additional Role | Common Scenario |
|--------------|------------------|-----------------|
| Client | + Provider | User who both books and provides services |
| Provider | + Supplier | Service provider who also sells supplies |
| Provider | + Instructor | Service provider who teaches courses |
| Client | + Instructor | Professional who teaches in spare time |
| Agency Owner | + Provider | Agency owner who also works in the field |
| Provider | + Agency Admin | Provider who helps manage an agency |

**Note:** All users retain the base `client` role when adding additional roles.

---

## 📊 Feature Comparison Matrix

| Feature | Client | Provider | Supplier | Instructor | Agency Owner | Agency Admin | Partner | Staff | Admin |
|---------|--------|----------|----------|------------|--------------|--------------|---------|-------|-------|
| **Core Features** |
| Book Services | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search Jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Shop Products | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enroll Courses | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Service Provider** |
| Offer Services | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Manage Bookings | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Set Pricing | ❌ | ✅ | ❌ | ❌ | ✅ | ⚠️ | ❌ | ❌ | ✅ |
| **Business** |
| Sell Products | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Teach Courses | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage Inventory | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Agency** |
| Create Agency | ❌ | ⚠️ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Manage Providers | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Dispatch Bookings | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Corporate** |
| Bulk Operations | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Employee Management | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Corporate Billing | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Administration** |
| Verify Users | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| Platform Settings | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Financial Oversight | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Legend:**
- ✅ Full Access
- ⚠️ Limited Access
- ❌ No Access

---

## 🚀 Getting Started by Role

### First-Time Users (Client)
1. Read [Client Journey](01_CLIENT_JOURNEY.md)
2. Complete registration
3. Verify account
4. Browse services
5. Make first booking

### Becoming a Provider
1. Read [Provider Journey](02_PROVIDER_JOURNEY.md)
2. Upgrade from client
3. Complete provider profile
4. Submit verification documents
5. Wait for approval
6. Start receiving bookings

### Starting a Business
**Supplier:**
1. Read [Supplier Journey](04_SUPPLIER_JOURNEY.md)
2. Register business
3. Add products
4. Set pricing
5. Start selling

**Instructor:**
1. Read [Instructor Journey](05_INSTRUCTOR_JOURNEY.md)
2. Apply as instructor
3. Get verified
4. Create course
5. Enroll students

### Agency Operations
**Agency Owner:**
1. Read [Agency Owner Journey](06_AGENCY_OWNER_JOURNEY.md)
2. Register agency
3. Submit documents
4. Recruit providers
5. Start operations

**Agency Admin:**
1. Read [Agency Admin Journey](07_AGENCY_ADMIN_JOURNEY.md)
2. Accept owner invitation
3. Learn responsibilities
4. Coordinate providers
5. Manage bookings

### Corporate Programs
**Partner:**
1. Read [Partner Journey](08_PARTNER_JOURNEY.md)
2. Submit application
3. Contract negotiation
4. Setup program
5. Enroll users
6. Launch program

### Platform Management
**Admin/Staff:**
1. Read [Admin Journey](03_ADMIN_JOURNEY.md) or [Staff Journey](09_STAFF_JOURNEY.md)
2. Receive credentials
3. Complete training
4. Understand permissions
5. Begin duties

---

## 📱 Platform Access by Role

### Mobile Apps

**Client App** (iOS/Android)
- ✅ Client features
- ✅ Provider features (if provider role)
- ✅ Supplier features (if supplier role)
- ✅ Instructor features (if instructor role)

**Provider App** (iOS/Android)
- ✅ Provider-focused interface
- ✅ Agency admin features
- ✅ Booking management
- ✅ Earnings tracking

### Web Portals

**Client Portal** (Web)
- ✅ All client features
- ✅ Desktop-optimized

**Provider Portal** (Web)
- ✅ Provider dashboard
- ✅ Analytics and reports

**Admin Dashboard** (Web)
- ✅ Admin features
- ✅ Staff features (limited)
- ✅ System management

**Partner Portal** (Web)
- ✅ Corporate features
- ✅ Bulk operations
- ✅ Reporting

---

## 📞 Support & Resources

### Documentation
- [Main README](../README.md)
- [API Documentation Index](../API_DOCUMENTATION_INDEX.md)
- [Quick Start Guide](../QUICK_START_GUIDE.md)

### Role-Specific Help
- Each journey document contains FAQs and troubleshooting
- Best practices sections
- Common scenarios
- Success metrics

### Contact Support
- In-app help center
- Email: support@localpro.com
- Phone: +63 (2) 1234-5678
- Live chat (available 24/7)

---

## 🔄 Document Updates

**Version History:**
- v1.0.0 (Jan 13, 2026): Initial comprehensive role journey documentation

**Next Review:** April 13, 2026

**Feedback:**
If you have suggestions for improving these documents, please contact the development team.

---

**Maintained By:** LocalPro Development Team  
**Last Updated:** January 13, 2026

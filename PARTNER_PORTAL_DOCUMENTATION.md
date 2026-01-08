# LocalPro Partner Portal - API Documentation

> **Version:** 1.0.0  
> **Last Updated:** January 7, 2026  
> **Base URL:** `https://api.yourdomain.com/api` or `http://localhost:4000/api` (development)

## Table of Contents

1. [Overview](#overview)
2. [Partner Types](#partner-types)
3. [Getting Started](#getting-started)
4. [Partner Registration](#partner-registration)
5. [Organization Management](#organization-management)
6. [Bulk Services & Bookings](#bulk-services--bookings)
7. [Employee/Student Management](#employeestudent-management)
8. [Corporate Programs](#corporate-programs)
9. [Financial Management](#financial-management)
10. [Analytics & Reporting](#analytics--reporting)
11. [Integration & API Access](#integration--api-access)
12. [Special Programs](#special-programs)
13. [Billing & Invoicing](#billing--invoicing)
14. [Support & Resources](#support--resources)

---

## Overview

**LocalPro Partner Portal** enables businesses, government units, and educational institutions to provide LocalPro services to their employees, constituents, or students. Partners can:

- 🏢 **Corporate Services** - Bulk booking for facilities and employees
- 🏛️ **Government Programs** - Community service initiatives
- 🎓 **Educational Benefits** - Student and faculty services
- 💼 **Bulk Management** - Manage multiple users and bookings
- 📊 **Custom Reporting** - Detailed analytics and insights
- 💰 **Corporate Billing** - Centralized billing and invoicing
- 🤝 **Preferred Providers** - Work with selected service providers
- 🎯 **Custom Programs** - Tailored service packages

---

## Partner Types

### 1. Corporate/Business Partners
**Businesses providing employee benefits**

**Use Cases:**
- Office cleaning and maintenance
- Employee home services benefits
- Corporate facility management
- Company events and catering
- Employee wellness programs

**Features:**
- Employee enrollment
- Department-based access
- Budget allocation
- Approval workflows
- Usage reports

---

### 2. Local Government Units (LGUs)
**Government agencies serving communities**

**Use Cases:**
- Community cleaning programs
- Public facility maintenance
- Barangay services
- Disaster response coordination
- Public works management

**Features:**
- Constituent management
- Barangay/district segmentation
- Budget tracking
- Public reporting
- Emergency services

---

### 3. Educational Institutions
**Schools and universities**

**Use Cases:**
- Campus maintenance
- Student housing services
- Faculty benefits
- Campus facilities management
- Student job board access

**Features:**
- Student/faculty enrollment
- Department management
- Academic term scheduling
- Student employment programs
- Campus-wide services

---

## Getting Started

### Authentication

Partners use email/password authentication with enhanced organizational access.

**Base URL:**
```
https://api.yourdomain.com/api
```

**Headers for Authenticated Requests:**
```
Authorization: Bearer <partner_jwt_token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

### Partner Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `partner_owner` | Organization owner | Full access |
| `partner_admin` | Administrator | Admin access |
| `partner_manager` | Department manager | Department access |
| `partner_coordinator` | Service coordinator | Booking management |
| `partner_finance` | Financial officer | Financial access |
| `partner_viewer` | Read-only access | View only |

---

## Partner Registration

### 1. Register as Partner

Create a new partner organization account.

**Endpoint:** `POST /partners/register`

**Request Body:**
```json
{
  "organizationType": "business",
  "organizationInfo": {
    "name": "ABC Corporation",
    "legalName": "ABC Corporation Inc.",
    "registrationNumber": "SEC-2020-123456",
    "taxId": "TAX-123-456-789",
    "industry": "Technology",
    "size": "500-1000",
    "website": "https://abccorp.com"
  },
  "contactInfo": {
    "primaryContact": {
      "firstName": "John",
      "lastName": "Doe",
      "position": "HR Manager",
      "email": "john.doe@abccorp.com",
      "phoneNumber": "+639171234567"
    },
    "billingContact": {
      "firstName": "Jane",
      "lastName": "Smith",
      "position": "Finance Manager",
      "email": "jane.smith@abccorp.com",
      "phoneNumber": "+639171234568"
    }
  },
  "address": {
    "street": "123 Business Avenue",
    "city": "Makati",
    "state": "Metro Manila",
    "zipCode": "1200",
    "country": "Philippines"
  },
  "program": {
    "type": "employee_benefits",
    "expectedUsers": 500,
    "estimatedMonthlyBookings": 200,
    "services": ["cleaning", "maintenance", "repairs"],
    "budget": {
      "monthly": 100000,
      "currency": "PHP"
    }
  }
}
```

**Organization Types:**
- `business` - Corporate/Business
- `lgu` - Local Government Unit
- `school` - Educational Institution
- `ngo` - Non-profit Organization

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Partner registration submitted successfully",
  "data": {
    "partner": {
      "id": "partner123",
      "organizationId": "org123",
      "organizationName": "ABC Corporation",
      "organizationType": "business",
      "status": "pending_verification",
      "accountManager": {
        "name": "Sarah Johnson",
        "email": "sarah.johnson@localpro.com",
        "phone": "+639171234569"
      },
      "onboardingSteps": [
        {
          "step": "document_verification",
          "status": "pending",
          "description": "Submit business documents"
        },
        {
          "step": "contract_signing",
          "status": "pending",
          "description": "Review and sign partnership agreement"
        },
        {
          "step": "payment_setup",
          "status": "pending",
          "description": "Configure billing and payment methods"
        },
        {
          "step": "user_enrollment",
          "status": "pending",
          "description": "Enroll employees/members"
        }
      ],
      "createdAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 2. Complete Onboarding

Complete the multi-step partner onboarding process.

**Endpoint:** `PUT /partners/onboarding/step`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "step": "document_verification",
  "data": {
    "documents": [
      {
        "type": "business_registration",
        "url": "https://cloudinary.com/sec_certificate.pdf"
      },
      {
        "type": "tax_certificate",
        "url": "https://cloudinary.com/bir_certificate.pdf"
      },
      {
        "type": "authorization_letter",
        "url": "https://cloudinary.com/authorization.pdf"
      }
    ]
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Onboarding step completed",
  "data": {
    "currentStep": "contract_signing",
    "progress": 25,
    "nextStep": {
      "step": "contract_signing",
      "title": "Review Partnership Agreement",
      "description": "Review and electronically sign the partnership agreement",
      "documents": [
        {
          "name": "Partnership Agreement",
          "url": "https://localpro.com/agreements/partner123.pdf"
        }
      ]
    }
  }
}
```

---

### 3. Get Partner Profile

Get current partner organization profile.

**Endpoint:** `GET /partners/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "partner": {
      "id": "partner123",
      "organizationId": "org123",
      "organizationInfo": {
        "name": "ABC Corporation",
        "legalName": "ABC Corporation Inc.",
        "type": "business",
        "industry": "Technology",
        "size": "500-1000",
        "logo": "https://cloudinary.com/abc_logo.png"
      },
      "status": "active",
      "tier": "enterprise",
      "memberSince": "2026-01-15",
      "accountManager": {
        "name": "Sarah Johnson",
        "email": "sarah.johnson@localpro.com",
        "phone": "+639171234569"
      },
      "subscription": {
        "plan": "Enterprise",
        "users": 500,
        "bookingsPerMonth": 200,
        "features": [
          "Bulk booking",
          "Custom reporting",
          "API access",
          "Dedicated support",
          "Priority service"
        ]
      },
      "stats": {
        "totalUsers": 487,
        "activeUsers": 423,
        "totalBookings": 1234,
        "thisMonthBookings": 189,
        "totalSpent": 567890,
        "averageRating": 4.7
      }
    }
  }
}
```

---

## Organization Management

### 1. Get Organization Overview

Get comprehensive organization overview.

**Endpoint:** `GET /partners/organization/overview`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "organization": {
        "name": "ABC Corporation",
        "type": "business",
        "status": "active"
      },
      "users": {
        "total": 487,
        "active": 423,
        "pending": 64,
        "byDepartment": {
          "IT": 89,
          "HR": 45,
          "Finance": 67,
          "Operations": 156,
          "Sales": 130
        }
      },
      "services": {
        "totalBookings": 189,
        "pendingBookings": 12,
        "completedThisMonth": 156,
        "upcomingScheduled": 21
      },
      "budget": {
        "monthly": 100000,
        "spent": 78456,
        "remaining": 21544,
        "utilization": 78.5
      },
      "alerts": [
        {
          "type": "budget_warning",
          "message": "Budget utilization at 78.5%",
          "priority": "medium"
        }
      ]
    }
  }
}
```

---

### 2. Update Organization Profile

Update organization information.

**Endpoint:** `PUT /partners/organization/profile`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "organizationInfo": {
    "name": "ABC Corporation Ltd.",
    "website": "https://abccorp.com",
    "description": "Leading technology company in Southeast Asia"
  },
  "contactInfo": {
    "primaryContact": {
      "email": "updated.email@abccorp.com"
    }
  }
}
```

**Response:** `200 OK`

---

### 3. Manage Departments

Create and manage organizational departments.

**Create Department:**
**Endpoint:** `POST /partners/organization/departments`

**Request Body:**
```json
{
  "name": "Engineering",
  "code": "ENG",
  "description": "Engineering Department",
  "manager": {
    "userId": "user123",
    "name": "John Manager",
    "email": "john.manager@abccorp.com"
  },
  "budget": {
    "monthly": 25000,
    "currency": "PHP"
  },
  "allowedServices": ["cleaning", "maintenance", "repairs"],
  "approvalRequired": true,
  "approvers": ["user456", "user789"]
}
```

**Response:** `201 Created`

---

### 4. Get Departments

Get all departments in organization.

**Endpoint:** `GET /partners/organization/departments`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "id": "dept123",
        "name": "Engineering",
        "code": "ENG",
        "manager": {
          "name": "John Manager",
          "email": "john.manager@abccorp.com"
        },
        "stats": {
          "totalUsers": 89,
          "activeUsers": 78,
          "bookingsThisMonth": 34,
          "budgetUsed": 18456,
          "budgetRemaining": 6544
        }
      }
    ]
  }
}
```

---

## Bulk Services & Bookings

### 1. Create Bulk Booking

Book services for multiple users or locations.

**Endpoint:** `POST /partners/bookings/bulk`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "bookingType": "recurring",
  "service": {
    "serviceId": "service123",
    "title": "Office Cleaning",
    "category": "cleaning"
  },
  "schedule": {
    "type": "recurring",
    "frequency": "weekly",
    "days": ["monday", "wednesday", "friday"],
    "time": "18:00",
    "startDate": "2026-01-15",
    "endDate": "2026-12-31"
  },
  "locations": [
    {
      "name": "Main Office - 5th Floor",
      "address": {
        "street": "123 Business Avenue",
        "city": "Makati",
        "floor": "5th Floor",
        "area": "500 sqm"
      },
      "contactPerson": {
        "name": "Floor Manager",
        "phone": "+639171234567"
      }
    },
    {
      "name": "Main Office - 6th Floor",
      "address": {
        "street": "123 Business Avenue",
        "city": "Makati",
        "floor": "6th Floor",
        "area": "450 sqm"
      },
      "contactPerson": {
        "name": "Floor Manager",
        "phone": "+639171234568"
      }
    }
  ],
  "billing": {
    "department": "dept123",
    "budgetCode": "FAC-2026-001",
    "approvalRequired": true,
    "approvers": ["user456"]
  },
  "specialRequirements": [
    "After office hours only",
    "Use eco-friendly products",
    "Access cards provided"
  ]
}
```

**Booking Types:**
- `one_time` - Single booking
- `recurring` - Recurring schedule
- `bulk_individual` - Multiple individual bookings

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Bulk booking created successfully",
  "data": {
    "bulkBooking": {
      "id": "bulk123",
      "referenceNumber": "BULK-2026-001234",
      "status": "pending_approval",
      "totalLocations": 2,
      "estimatedBookings": 312,
      "schedule": {
        "frequency": "weekly",
        "occurrences": 156
      },
      "pricing": {
        "perBooking": 600,
        "totalEstimated": 187200,
        "currency": "PHP",
        "discount": 15,
        "finalAmount": 159120
      },
      "approvalStatus": {
        "required": true,
        "pending": ["user456"],
        "approved": []
      },
      "createdAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 2. Get Partner Bookings

Get all bookings made by the organization.

**Endpoint:** `GET /partners/bookings`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status
- `department`: Filter by department
- `startDate`: From date
- `endDate`: To date
- `type`: Filter by type (one_time, recurring, bulk)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking123",
        "referenceNumber": "BKG-2026-001234",
        "type": "recurring",
        "service": "Office Cleaning",
        "location": "Main Office - 5th Floor",
        "status": "active",
        "schedule": {
          "nextBooking": "2026-01-10T18:00:00Z",
          "frequency": "weekly"
        },
        "department": {
          "id": "dept123",
          "name": "Engineering"
        },
        "pricing": {
          "perBooking": 600,
          "totalPaid": 4800,
          "remaining": 182400
        },
        "createdBy": {
          "name": "John Manager",
          "email": "john.manager@abccorp.com"
        }
      }
    ],
    "pagination": { ... },
    "summary": {
      "totalBookings": 234,
      "activeBookings": 45,
      "completedThisMonth": 156,
      "totalSpent": 98456
    }
  }
}
```

---

### 3. Request Corporate Quote

Request custom quote for large-scale services.

**Endpoint:** `POST /partners/quotes/request`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "serviceType": "facility_management",
  "description": "Complete facility management for 10-floor office building",
  "requirements": {
    "locations": 1,
    "totalArea": "5000 sqm",
    "services": [
      "Daily cleaning",
      "Weekly deep cleaning",
      "Monthly maintenance",
      "Emergency repairs"
    ],
    "duration": "12 months",
    "startDate": "2026-02-01"
  },
  "budget": {
    "estimated": 500000,
    "flexible": true,
    "currency": "PHP"
  },
  "additionalInfo": "Looking for comprehensive facility management solution with 24/7 support"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Quote request submitted successfully",
  "data": {
    "quote": {
      "id": "quote123",
      "referenceNumber": "QTE-2026-001234",
      "status": "pending",
      "assignedTo": {
        "name": "Sarah Johnson",
        "title": "Account Manager",
        "email": "sarah.johnson@localpro.com",
        "phone": "+639171234569"
      },
      "expectedResponse": "2-3 business days",
      "createdAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

## Employee/Student Management

### 1. Bulk Enroll Users

Enroll multiple employees/students at once.

**Endpoint:** `POST /partners/users/bulk-enroll`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `file`: CSV file with user data
- `department`: Department ID (optional)
- `accessLevel`: Access level for all users

**CSV Format:**
```csv
firstName,lastName,email,employeeId,department,phoneNumber
John,Doe,john.doe@abccorp.com,EMP001,Engineering,+639171234567
Jane,Smith,jane.smith@abccorp.com,EMP002,HR,+639171234568
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Bulk enrollment processed",
  "data": {
    "enrollment": {
      "id": "enroll123",
      "totalRows": 100,
      "successful": 95,
      "failed": 5,
      "results": [
        {
          "row": 1,
          "email": "john.doe@abccorp.com",
          "status": "success",
          "userId": "user123"
        },
        {
          "row": 6,
          "email": "invalid@email",
          "status": "failed",
          "error": "Invalid email format"
        }
      ],
      "failedRows": [
        {
          "row": 6,
          "data": {...},
          "error": "Invalid email format"
        }
      ]
    }
  }
}
```

---

### 2. Get Organization Users

Get all users in the organization.

**Endpoint:** `GET /partners/users`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `department`: Filter by department
- `status`: Filter by status (active, inactive, suspended)
- `search`: Search by name or email

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@abccorp.com",
        "employeeId": "EMP001",
        "department": {
          "id": "dept123",
          "name": "Engineering"
        },
        "status": "active",
        "enrolledDate": "2026-01-15",
        "stats": {
          "totalBookings": 12,
          "lastBooking": "2026-01-05T10:00:00Z",
          "totalSpent": 7200
        }
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 3. Update User Access

Update user access and permissions.

**Endpoint:** `PUT /partners/users/:userId/access`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "active",
  "accessLevel": "standard",
  "permissions": {
    "canBook": true,
    "requireApproval": false,
    "monthlyLimit": 5000,
    "allowedServices": ["cleaning", "maintenance"]
  },
  "department": "dept456"
}
```

**Response:** `200 OK`

---

### 4. Suspend/Remove User

Suspend or remove a user from the organization.

**Endpoint:** `PUT /partners/users/:userId/status`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Employment terminated",
  "effective": "immediate"
}
```

**Status Options:**
- `active` - Active user
- `suspended` - Temporarily suspended
- `removed` - Removed from organization

**Response:** `200 OK`

---

## Corporate Programs

### 1. Create Employee Benefit Program

Set up employee benefit programs.

**Endpoint:** `POST /partners/programs`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "programType": "employee_benefit",
  "name": "Home Services Benefit 2026",
  "description": "Annual home services benefit for all employees",
  "eligibility": {
    "departments": ["all"],
    "employmentStatus": ["regular", "probationary"],
    "minimumTenure": 3
  },
  "benefits": {
    "type": "credit",
    "amount": 5000,
    "currency": "PHP",
    "frequency": "annual",
    "rollover": false
  },
  "allowedServices": ["cleaning", "plumbing", "electrical", "repair"],
  "restrictions": {
    "maxBookingsPerMonth": 2,
    "advanceBookingDays": 3,
    "cancellationPolicy": "24_hours"
  },
  "validity": {
    "startDate": "2026-01-01",
    "endDate": "2026-12-31"
  }
}
```

**Program Types:**
- `employee_benefit` - Employee benefits
- `wellness_program` - Wellness programs
- `facility_services` - Facility services
- `community_program` - Community programs (LGU)
- `student_services` - Student services (Schools)

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Program created successfully",
  "data": {
    "program": {
      "id": "program123",
      "name": "Home Services Benefit 2026",
      "status": "active",
      "eligibleUsers": 487,
      "totalBudget": 2435000,
      "startDate": "2026-01-01",
      "endDate": "2026-12-31"
    }
  }
}
```

---

### 2. Get Active Programs

Get all active programs for the organization.

**Endpoint:** `GET /partners/programs`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "programs": [
      {
        "id": "program123",
        "name": "Home Services Benefit 2026",
        "type": "employee_benefit",
        "status": "active",
        "eligibleUsers": 487,
        "enrolledUsers": 423,
        "stats": {
          "totalBudget": 2435000,
          "utilized": 1456789,
          "remaining": 978211,
          "utilization": 59.8
        },
        "topServices": [
          {
            "service": "House Cleaning",
            "bookings": 234,
            "amount": 140400
          }
        ]
      }
    ]
  }
}
```

---

### 3. Set Preferred Providers

Configure preferred service providers for the organization.

**Endpoint:** `POST /partners/preferred-providers`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "providers": [
    {
      "providerId": "provider123",
      "services": ["cleaning", "maintenance"],
      "priority": 1,
      "discount": 15,
      "exclusivity": false
    },
    {
      "providerId": "provider456",
      "services": ["electrical", "plumbing"],
      "priority": 2,
      "discount": 10,
      "exclusivity": false
    }
  ],
  "autoAssign": true,
  "allowOthers": true
}
```

**Response:** `201 Created`

---

## Financial Management

### 1. Get Financial Overview

Get comprehensive financial overview for the organization.

**Endpoint:** `GET /partners/finance/overview`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Query Parameters:**
- `period`: Time period (month, quarter, year)
- `department`: Filter by department

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalSpent": 1456789,
      "monthlyBudget": 100000,
      "budgetUsed": 78456,
      "budgetRemaining": 21544,
      "currency": "PHP"
    },
    "byDepartment": [
      {
        "department": "Engineering",
        "budget": 25000,
        "spent": 18456,
        "remaining": 6544,
        "utilization": 73.8
      }
    ],
    "byService": [
      {
        "service": "Cleaning",
        "bookings": 156,
        "amount": 93600,
        "percentage": 64.3
      }
    ],
    "trends": {
      "monthly": [
        {
          "month": "2026-01",
          "spent": 78456,
          "bookings": 189
        }
      ]
    },
    "upcomingCharges": {
      "pendingBookings": 12,
      "estimatedAmount": 7200
    }
  }
}
```

---

### 2. Get Invoices

Get all invoices for the organization.

**Endpoint:** `GET /partners/finance/invoices`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (paid, pending, overdue)
- `startDate`: From date
- `endDate`: To date

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "invoice123",
        "invoiceNumber": "INV-2026-001234",
        "billingPeriod": {
          "start": "2026-01-01",
          "end": "2026-01-31"
        },
        "status": "paid",
        "items": [
          {
            "description": "Office Cleaning Services",
            "quantity": 156,
            "unitPrice": 600,
            "amount": 93600
          }
        ],
        "subtotal": 93600,
        "tax": 11232,
        "discount": 14040,
        "total": 90792,
        "paidDate": "2026-02-05",
        "paymentMethod": "bank_transfer",
        "dueDate": "2026-02-15"
      }
    ],
    "pagination": { ... },
    "summary": {
      "totalInvoices": 12,
      "totalPaid": 890456,
      "totalPending": 90792,
      "totalOverdue": 0
    }
  }
}
```

---

### 3. Set Budget Allocation

Configure budget allocation for departments.

**Endpoint:** `POST /partners/finance/budget-allocation`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "period": {
    "type": "monthly",
    "startDate": "2026-02-01"
  },
  "allocations": [
    {
      "department": "dept123",
      "amount": 30000,
      "services": ["cleaning", "maintenance"]
    },
    {
      "department": "dept456",
      "amount": 20000,
      "services": ["all"]
    }
  ],
  "rules": {
    "allowOverspend": false,
    "alertThreshold": 80,
    "requireApprovalAbove": 5000
  }
}
```

**Response:** `201 Created`

---

### 4. Download Financial Report

Generate and download financial reports.

**Endpoint:** `GET /partners/finance/reports`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Query Parameters:**
- `type`: Report type (summary, detailed, tax, departmental)
- `format`: Format (pdf, excel, csv)
- `period`: Time period
- `startDate`: From date
- `endDate`: To date
- `department`: Filter by department

**Response:** File download or `200 OK` with download URL

---

## Analytics & Reporting

### 1. Get Usage Analytics

Get detailed usage analytics for the organization.

**Endpoint:** `GET /partners/analytics/usage`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Query Parameters:**
- `period`: Time period (week, month, quarter, year)
- `groupBy`: Group by (department, service, user, location)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalBookings": 1234,
      "activeUsers": 423,
      "userAdoptionRate": 86.9,
      "averageBookingsPerUser": 2.9
    },
    "byDepartment": [
      {
        "department": "Engineering",
        "users": 89,
        "activeUsers": 78,
        "bookings": 234,
        "spent": 140400,
        "topService": "Office Cleaning"
      }
    ],
    "byService": [
      {
        "service": "Cleaning",
        "bookings": 567,
        "users": 234,
        "satisfaction": 4.8,
        "repeatRate": 78
      }
    ],
    "trends": {
      "daily": [
        {
          "date": "2026-01-01",
          "bookings": 12,
          "users": 10
        }
      ]
    },
    "satisfaction": {
      "average": 4.7,
      "distribution": {
        "5": 678,
        "4": 234,
        "3": 45,
        "2": 12,
        "1": 3
      }
    }
  }
}
```

---

### 2. Get Provider Performance

Get performance analytics for preferred providers.

**Endpoint:** `GET /partners/analytics/providers`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "providerId": "provider123",
        "name": "CleanPro Services",
        "services": ["cleaning", "maintenance"],
        "stats": {
          "totalBookings": 345,
          "completionRate": 98.5,
          "averageRating": 4.8,
          "responseTime": "2 hours",
          "onTimeRate": 96
        },
        "savings": {
          "discount": 15,
          "totalSaved": 51750
        },
        "issues": {
          "complaints": 2,
          "resolved": 2,
          "pending": 0
        }
      }
    ]
  }
}
```

---

### 3. Get Custom Report

Generate custom analytical reports.

**Endpoint:** `POST /partners/analytics/custom-report`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reportName": "Q1 2026 Usage Report",
  "metrics": [
    "bookings",
    "spending",
    "user_adoption",
    "satisfaction"
  ],
  "dimensions": [
    "department",
    "service_type",
    "provider"
  ],
  "filters": {
    "startDate": "2026-01-01",
    "endDate": "2026-03-31",
    "departments": ["dept123", "dept456"]
  },
  "format": "excel",
  "schedule": {
    "recurring": true,
    "frequency": "monthly",
    "recipients": ["john.manager@abccorp.com"]
  }
}
```

**Response:** `201 Created`

---

## Integration & API Access

### 1. Generate API Keys

Generate API keys for system integration.

**Endpoint:** `POST /partners/integration/api-keys`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "HR System Integration",
  "description": "Integration with company HR system",
  "permissions": [
    "read_users",
    "create_users",
    "create_bookings",
    "read_bookings",
    "read_analytics"
  ],
  "ipWhitelist": [
    "192.168.1.100",
    "192.168.1.101"
  ],
  "rateLimit": 1000,
  "expiresAt": "2027-01-07"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "API key created successfully",
  "data": {
    "apiKey": {
      "id": "key123",
      "name": "HR System Integration",
      "key": "pk_live_abc123def456...",
      "secret": "sk_live_xyz789uvw012...",
      "permissions": [...],
      "createdAt": "2026-01-07T10:00:00Z",
      "expiresAt": "2027-01-07T10:00:00Z"
    },
    "warning": "Store these credentials securely. They will not be shown again."
  }
}
```

---

### 2. Get Webhook Configuration

Configure webhooks for real-time updates.

**Endpoint:** `POST /partners/integration/webhooks`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://your-system.com/webhooks/localpro",
  "events": [
    "booking.created",
    "booking.completed",
    "booking.cancelled",
    "user.enrolled",
    "user.suspended",
    "invoice.generated"
  ],
  "secret": "your_webhook_secret"
}
```

**Response:** `201 Created`

---

### 3. Get Integration Documentation

Access API integration documentation and SDKs.

**Endpoint:** `GET /partners/integration/docs`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Response:** `200 OK` with integration documentation

---

## Special Programs

### 1. LGU Community Programs

Set up community service programs (for LGUs).

**Endpoint:** `POST /partners/programs/community`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "programName": "Barangay Cleaning Initiative 2026",
  "programType": "community_service",
  "coverage": {
    "barangays": ["Barangay 1", "Barangay 2", "Barangay 3"],
    "population": 50000,
    "households": 12500
  },
  "services": [
    {
      "service": "waste_collection",
      "frequency": "weekly",
      "coverage": "all_households"
    },
    {
      "service": "street_cleaning",
      "frequency": "daily",
      "areas": ["main_roads", "public_spaces"]
    }
  ],
  "budget": {
    "total": 5000000,
    "source": "local_government_fund",
    "fiscalYear": 2026
  },
  "duration": {
    "startDate": "2026-01-01",
    "endDate": "2026-12-31"
  }
}
```

**Response:** `201 Created`

---

### 2. School Campus Services

Set up campus service programs (for schools).

**Endpoint:** `POST /partners/programs/campus`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "programName": "Campus Maintenance 2026",
  "programType": "campus_services",
  "coverage": {
    "buildings": 15,
    "totalArea": "50000 sqm",
    "students": 5000,
    "faculty": 300
  },
  "services": [
    {
      "service": "classroom_cleaning",
      "frequency": "daily",
      "buildings": ["all"]
    },
    {
      "service": "restroom_maintenance",
      "frequency": "4_times_daily",
      "locations": ["all_buildings"]
    },
    {
      "service": "grounds_maintenance",
      "frequency": "weekly",
      "areas": ["campus_grounds", "sports_facilities"]
    }
  ],
  "schedule": {
    "academicYear": "2026-2027",
    "semesterBased": true,
    "holidays": ["include"]
  },
  "studentBenefits": {
    "enabled": true,
    "eligibility": ["all_students"],
    "allowedServices": ["tutoring", "room_cleaning"],
    "creditPerSemester": 1000
  }
}
```

**Response:** `201 Created`

---

### 3. Emergency Response Program

Set up emergency response services (for LGUs).

**Endpoint:** `POST /partners/programs/emergency`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "programName": "Disaster Response 2026",
  "programType": "emergency_response",
  "services": [
    "debris_removal",
    "emergency_repairs",
    "water_restoration",
    "power_restoration"
  ],
  "coverage": {
    "area": "entire_municipality",
    "population": 100000
  },
  "activationProtocol": {
    "triggerEvents": ["typhoon", "flood", "earthquake"],
    "responseLevels": ["alert1", "alert2", "alert3"],
    "authorities": ["mayor", "disaster_officer"]
  },
  "providers": {
    "preApproved": ["provider123", "provider456"],
    "autoActivate": true
  }
}
```

**Response:** `201 Created`

---

## Billing & Invoicing

### 1. Configure Billing Settings

Set up billing preferences and payment methods.

**Endpoint:** `PUT /partners/billing/settings`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "billingCycle": "monthly",
  "billingDate": 1,
  "paymentTerms": "net_30",
  "paymentMethod": {
    "primary": "bank_transfer",
    "backup": "credit_card"
  },
  "bankDetails": {
    "accountName": "ABC Corporation",
    "accountNumber": "1234567890",
    "bankName": "BDO",
    "bankCode": "BDO"
  },
  "invoiceSettings": {
    "format": "detailed",
    "groupBy": "department",
    "includeTax": true,
    "recipients": [
      "finance@abccorp.com",
      "accounting@abccorp.com"
    ]
  },
  "autoPayment": {
    "enabled": true,
    "method": "bank_transfer"
  }
}
```

**Response:** `200 OK`

---

### 2. Request Invoice

Request invoice for specific period.

**Endpoint:** `POST /partners/billing/invoice-request`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "period": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "includeDetails": true,
  "groupBy": "department",
  "format": "pdf"
}
```

**Response:** `201 Created` with download link

---

### 3. Get Payment History

Get payment transaction history.

**Endpoint:** `GET /partners/billing/payments`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status
- `startDate`: From date
- `endDate`: To date

**Response:** `200 OK`

---

## Support & Resources

### 1. Get Dedicated Support Contact

Get assigned account manager information.

**Endpoint:** `GET /partners/support/contact`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accountManager": {
      "name": "Sarah Johnson",
      "title": "Senior Account Manager",
      "email": "sarah.johnson@localpro.com",
      "phone": "+639171234569",
      "mobilePhone": "+639171234570",
      "availability": "Mon-Fri, 9 AM - 6 PM",
      "languages": ["English", "Filipino"]
    },
    "technicalSupport": {
      "email": "partners-support@localpro.com",
      "phone": "+639171234571",
      "hours": "24/7"
    },
    "emergency": {
      "phone": "+639171234572",
      "email": "emergency@localpro.com",
      "note": "For urgent/emergency issues only"
    }
  }
}
```

---

### 2. Submit Support Ticket

Create support ticket for issues.

**Endpoint:** `POST /partners/support/tickets`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "subject": "Billing discrepancy for January 2026",
  "category": "billing",
  "priority": "high",
  "description": "Found incorrect charges on invoice INV-2026-001234",
  "attachments": [
    "https://cloudinary.com/invoice_screenshot.png"
  ],
  "affectedUsers": ["user123", "user456"],
  "urgency": "requires_immediate_attention"
}
```

**Categories:**
- `billing` - Billing issues
- `technical` - Technical problems
- `account` - Account issues
- `service` - Service quality issues
- `feature_request` - Feature requests
- `other` - Other issues

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Support ticket created",
  "data": {
    "ticket": {
      "id": "ticket123",
      "ticketNumber": "TKT-2026-001234",
      "status": "open",
      "priority": "high",
      "assignedTo": {
        "name": "Sarah Johnson",
        "email": "sarah.johnson@localpro.com"
      },
      "expectedResponse": "Within 2 hours",
      "createdAt": "2026-01-07T10:00:00Z"
    }
  }
}
```

---

### 3. Get Training Resources

Access partner training materials.

**Endpoint:** `GET /partners/support/training`

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "type": "video",
        "title": "Partner Portal Overview",
        "duration": "15 minutes",
        "url": "https://localpro.com/training/portal-overview"
      },
      {
        "type": "document",
        "title": "Bulk Booking Guide",
        "pages": 25,
        "url": "https://localpro.com/guides/bulk-booking.pdf"
      },
      {
        "type": "webinar",
        "title": "Monthly Partner Webinar",
        "scheduled": "2026-01-15T14:00:00Z",
        "registerUrl": "https://localpro.com/webinars/register"
      }
    ],
    "upcomingTraining": [
      {
        "title": "Advanced Analytics Workshop",
        "date": "2026-01-20",
        "duration": "2 hours",
        "type": "live",
        "seats": "25 available"
      }
    ]
  }
}
```

---

## Best Practices

### 1. Organization Management
- **Regularly update** organization information
- **Maintain accurate** department structure
- **Review user access** periodically
- **Monitor budget** utilization
- **Track program** effectiveness

### 2. Booking Management
- **Plan ahead** for bulk bookings
- **Use recurring** bookings for regular services
- **Set clear** requirements and expectations
- **Monitor service** quality regularly
- **Provide feedback** to improve services

### 3. Financial Management
- **Set realistic** budgets
- **Monitor spending** regularly
- **Review invoices** promptly
- **Maintain accurate** records
- **Plan for** seasonal variations

### 4. User Management
- **Onboard users** properly
- **Provide training** on system usage
- **Monitor adoption** rates
- **Gather feedback** from users
- **Recognize active** participants

### 5. Integration
- **Secure API keys** properly
- **Test integrations** thoroughly
- **Monitor webhook** deliveries
- **Handle errors** gracefully
- **Keep documentation** updated

---

## API Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Organization Management | 100 requests | 15 minutes |
| Bulk Operations | 10 requests | 15 minutes |
| Analytics | 50 requests | 15 minutes |
| General API | 200 requests | 15 minutes |
| File Uploads | 20 requests | 1 hour |

---

## Support Channels

### Partner Support
- **Email**: partners@localpro.com
- **Phone**: +63917-PARTNER (24/7)
- **Portal**: https://partners.localpro.com
- **Documentation**: https://docs.localpro.com/partners

### Account Management
- **Dedicated Manager**: Assigned upon onboarding
- **Business Hours**: Monday-Friday, 9 AM - 6 PM
- **Emergency**: 24/7 hotline available

### Resources
- **Partner Academy**: Online training courses
- **Webinars**: Monthly partner webinars
- **Community**: Partner forum and networking
- **Newsletter**: Monthly updates and tips

---

## Pricing Tiers

### Starter (For small businesses, 1-50 users)
- Basic features
- Standard support
- Monthly invoicing
- Email support

### Professional (For medium businesses, 51-200 users)
- All Starter features
- Priority support
- Custom reporting
- Dedicated account manager
- API access

### Enterprise (For large organizations, 201+ users)
- All Professional features
- 24/7 support
- Custom integrations
- On-site training
- Volume discounts
- SLA guarantees

### Government/Education (Special pricing)
- Custom solutions
- Flexible payment terms
- Community programs
- Grant assistance
- Specialized support

---

**© 2026 LocalPro Super App. All rights reserved.**

**For partnership inquiries: partners@localpro.com**

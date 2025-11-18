# Provider API Response Data Structures

This document describes the response data structures for provider endpoints.

## 1. Get Providers List

**Endpoint:** `GET /api/providers`  
**Access:** Public

### Response Structure

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": {
        "_id": "507f191e810c19729de860ea",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "phoneNumber": "+1234567890",
        "profileImage": "https://example.com/profile.jpg",
        "roles": ["client", "provider"],
        "isActive": true,
        "verification": {
          "emailVerified": true,
          "phoneVerified": true
        },
        "badges": ["verified", "top_rated"],
        "profile": {
          "_id": "507f1f77bcf86cd799439012",
          "avatar": {
            "url": "https://example.com/avatar.jpg",
            "publicId": "avatar_123",
            "thumbnail": "https://example.com/avatar_thumb.jpg"
          },
          "bio": "Experienced professional with 10+ years in the industry",
          "address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zipCode": "10001",
            "country": "USA",
            "coordinates": {
              "lat": 40.7128,
              "lng": -74.0060
            }
          }
        },
        "settings": {
          "_id": "507f1f77bcf86cd799439013",
          "notifications": {
            "email": true,
            "sms": true,
            "push": true
          },
          "privacy": {
            "profileVisibility": "public",
            "showEmail": true,
            "showPhone": false
          }
        },
        "agency": {
          "_id": "507f1f77bcf86cd799439014",
          "agencyId": {
            "_id": "507f1f77bcf86cd799439015",
            "name": "ABC Agency",
            "type": "business",
            "contact": {
              "address": {
                "city": "New York",
                "state": "NY"
              }
            }
          }
        },
        "referral": {
          "_id": "507f1f77bcf86cd799439016",
          "referralCode": "JOHN123",
          "referralStats": {
            "totalReferrals": 10,
            "successfulReferrals": 8
          }
        },
        "trust": {
          "_id": "507f1f77bcf86cd799439017",
          "trustScore": 95,
          "verification": {
            "identityVerified": true,
            "phoneVerified": true
          },
          "badges": ["verified", "trusted"]
        }
      },
      "status": "active",
      "providerType": "individual",
      "professionalInfo": {
        "_id": "507f1f77bcf86cd799439018",
        "provider": "507f1f77bcf86cd799439011",
        "specialties": [
          {
            "_id": "507f1f77bcf86cd799439019",
            "experience": 10,
            "hourlyRate": 75,
            "certifications": [
              {
                "_id": "507f1f77bcf86cd799439020",
                "name": "Licensed Plumber",
                "issuer": "State Licensing Board",
                "dateIssued": "2020-01-15T00:00:00.000Z",
                "expiryDate": "2025-01-15T00:00:00.000Z",
                "certificateNumber": "PLB-12345"
              }
            ],
            "skills": [
              {
                "_id": "507f1f77bcf86cd799439021",
                "name": "Pipe Repair",
                "description": "Expert in repairing and replacing pipes",
                "category": {
                  "_id": "507f1f77bcf86cd799439022",
                  "name": "Plumbing",
                  "key": "plumbing"
                },
                "metadata": {
                  "level": "expert",
                  "yearsExperience": 10
                }
              },
              {
                "_id": "507f1f77bcf86cd799439023",
                "name": "Leak Detection",
                "description": "Advanced leak detection techniques",
                "category": {
                  "_id": "507f1f77bcf86cd799439022",
                  "name": "Plumbing",
                  "key": "plumbing"
                },
                "metadata": {
                  "level": "expert",
                  "yearsExperience": 8
                }
              }
            ],
            "serviceAreas": [
              {
                "_id": "507f1f77bcf86cd799439024",
                "city": "New York",
                "state": "NY",
                "radius": 25
              },
              {
                "_id": "507f1f77bcf86cd799439025",
                "city": "Brooklyn",
                "state": "NY",
                "radius": 20
              }
            ]
          }
        ],
        "languages": ["English", "Spanish"],
        "availability": {
          "monday": {
            "start": "09:00",
            "end": "17:00",
            "available": true
          },
          "tuesday": {
            "start": "09:00",
            "end": "17:00",
            "available": true
          },
          "wednesday": {
            "start": "09:00",
            "end": "17:00",
            "available": true
          },
          "thursday": {
            "start": "09:00",
            "end": "17:00",
            "available": true
          },
          "friday": {
            "start": "09:00",
            "end": "17:00",
            "available": true
          },
          "saturday": {
            "start": "10:00",
            "end": "14:00",
            "available": true
          },
          "sunday": {
            "start": null,
            "end": null,
            "available": false
          }
        },
        "emergencyServices": true,
        "travelDistance": 50,
        "minimumJobValue": 100,
        "maximumJobValue": 5000,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      },
      "businessInfo": null,
      "verification": {
        "_id": "507f1f77bcf86cd799439026",
        "provider": "507f1f77bcf86cd799439011",
        "identityVerified": true,
        "businessVerified": false,
        "backgroundCheck": {
          "status": "passed",
          "dateCompleted": "2024-01-10T00:00:00.000Z"
        },
        "insurance": {
          "hasInsurance": true,
          "insuranceProvider": "ABC Insurance",
          "policyNumber": "POL-12345",
          "coverageAmount": 1000000,
          "expiryDate": "2025-12-31T00:00:00.000Z"
        },
        "licenses": [
          {
            "_id": "507f1f77bcf86cd799439027",
            "type": "Professional License",
            "number": "PL-12345",
            "issuingAuthority": "State Board",
            "issueDate": "2020-01-15T00:00:00.000Z",
            "expiryDate": "2025-01-15T00:00:00.000Z"
          }
        ],
        "references": [],
        "portfolio": {
          "images": [
            "https://example.com/portfolio1.jpg",
            "https://example.com/portfolio2.jpg"
          ],
          "videos": [],
          "descriptions": [],
          "beforeAfter": []
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      },
      "preferences": {
        "_id": "507f1f77bcf86cd799439028",
        "provider": "507f1f77bcf86cd799439011",
        "notificationSettings": {
          "newJobAlerts": true,
          "messageNotifications": true,
          "paymentNotifications": true,
          "reviewNotifications": true,
          "marketingEmails": false
        },
        "jobPreferences": {
          "preferredJobTypes": ["plumbing", "repair"],
          "avoidJobTypes": [],
          "preferredTimeSlots": ["morning", "afternoon"],
          "maxJobsPerDay": 5,
          "advanceBookingDays": 30
        },
        "communicationPreferences": {
          "preferredContactMethod": "app",
          "responseTimeExpectation": 60,
          "autoAcceptJobs": false
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      },
      "performance": {
        "_id": "507f1f77bcf86cd799439029",
        "provider": "507f1f77bcf86cd799439011",
        "rating": 4.8,
        "totalReviews": 150,
        "totalJobs": 200,
        "completedJobs": 195,
        "cancelledJobs": 5,
        "responseTime": 15,
        "completionRate": 97.5,
        "repeatCustomerRate": 85,
        "earnings": {
          "total": 50000,
          "thisMonth": 5000,
          "lastMonth": 4500,
          "pending": 1000
        },
        "badges": [
          {
            "_id": "507f1f77bcf86cd799439030",
            "name": "Top Rated",
            "description": "Consistently high ratings",
            "earnedDate": "2024-01-01T00:00:00.000Z",
            "category": "performance"
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      },
      "settings": {
        "profileVisibility": "public",
        "showContactInfo": true,
        "showPricing": true,
        "showReviews": true,
        "allowDirectBooking": true,
        "requireApproval": false
      },
      "metadata": {
        "lastActive": "2024-01-20T14:30:00.000Z",
        "profileViews": 1250,
        "searchRanking": 8.5,
        "featured": true,
        "promoted": false,
        "tags": ["verified", "top_rated", "experienced"],
        "notes": null
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-20T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Notes for Providers List Response

- **Financial Info**: Excluded from public responses for security
- **Skills**: Fully populated with name, description, category, and metadata
- **User Data**: Includes profile, settings, agency, referral, and trust information
- **Pagination**: Included in response

---

## 2. Get Provider Detail

**Endpoint:** `GET /api/providers/:id` or `GET /api/marketplace/providers/:id`  
**Access:** Public

### Response Structure (Basic - `/api/providers/:id`)

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": {
      "_id": "507f191e810c19729de860ea",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "phoneNumber": "+1234567890",
      "profileImage": "https://example.com/profile.jpg",
      "roles": ["client", "provider"],
      "isActive": true,
      "verification": {
        "emailVerified": true,
        "phoneVerified": true
      },
      "badges": ["verified", "top_rated"],
      "profile": {
        "_id": "507f1f77bcf86cd799439012",
        "avatar": {
          "url": "https://example.com/avatar.jpg",
          "publicId": "avatar_123",
          "thumbnail": "https://example.com/avatar_thumb.jpg"
        },
        "bio": "Experienced professional with 10+ years in the industry",
        "address": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA",
          "coordinates": {
            "lat": 40.7128,
            "lng": -74.0060
          }
        }
      }
    },
    "user": {
      "_id": "507f191e810c19729de860ea",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "phoneNumber": "+1234567890",
      "profileImage": "https://example.com/profile.jpg",
      "roles": ["client", "provider"],
      "isActive": true,
      "verification": {
        "emailVerified": true,
        "phoneVerified": true
      },
      "badges": ["verified", "top_rated"],
      "profile": {
        "_id": "507f1f77bcf86cd799439012",
        "avatar": {
          "url": "https://example.com/avatar.jpg",
          "publicId": "avatar_123",
          "thumbnail": "https://example.com/avatar_thumb.jpg"
        },
        "bio": "Experienced professional with 10+ years in the industry",
        "address": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA",
          "coordinates": {
            "lat": 40.7128,
            "lng": -74.0060
          }
        }
      }
    },
    "userProfile": {
      "_id": "507f191e810c19729de860ea",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "phoneNumber": "+1234567890",
      "profileImage": "https://example.com/profile.jpg",
      "roles": ["client", "provider"],
      "isActive": true,
      "verification": {
        "emailVerified": true,
        "phoneVerified": true
      },
      "badges": ["verified", "top_rated"],
      "profile": {
        "_id": "507f1f77bcf86cd799439012",
        "avatar": {
          "url": "https://example.com/avatar.jpg",
          "publicId": "avatar_123",
          "thumbnail": "https://example.com/avatar_thumb.jpg"
        },
        "bio": "Experienced professional with 10+ years in the industry",
        "address": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA",
          "coordinates": {
            "lat": 40.7128,
            "lng": -74.0060
          }
        }
      }
    },
    "status": "active",
    "providerType": "individual",
    "professionalInfo": {
      "_id": "507f1f77bcf86cd799439018",
      "provider": "507f1f77bcf86cd799439011",
      "specialties": [
        {
          "_id": "507f1f77bcf86cd799439019",
          "experience": 10,
          "hourlyRate": 75,
          "certifications": [
            {
              "_id": "507f1f77bcf86cd799439020",
              "name": "Licensed Plumber",
              "issuer": "State Licensing Board",
              "dateIssued": "2020-01-15T00:00:00.000Z",
              "expiryDate": "2025-01-15T00:00:00.000Z",
              "certificateNumber": "PLB-12345"
            }
          ],
          "skills": [
            {
              "_id": "507f1f77bcf86cd799439021",
              "name": "Pipe Repair",
              "description": "Expert in repairing and replacing pipes",
              "category": {
                "_id": "507f1f77bcf86cd799439022",
                "name": "Plumbing",
                "key": "plumbing"
              },
              "metadata": {
                "level": "expert",
                "yearsExperience": 10
              }
            }
          ],
          "serviceAreas": [
            {
              "_id": "507f1f77bcf86cd799439024",
              "city": "New York",
              "state": "NY",
              "radius": 25
            }
          ]
        }
      ],
      "languages": ["English", "Spanish"],
      "availability": {
        "monday": {
          "start": "09:00",
          "end": "17:00",
          "available": true
        },
        "tuesday": {
          "start": "09:00",
          "end": "17:00",
          "available": true
        },
        "wednesday": {
          "start": "09:00",
          "end": "17:00",
          "available": true
        },
        "thursday": {
          "start": "09:00",
          "end": "17:00",
          "available": true
        },
        "friday": {
          "start": "09:00",
          "end": "17:00",
          "available": true
        },
        "saturday": {
          "start": "10:00",
          "end": "14:00",
          "available": true
        },
        "sunday": {
          "start": null,
          "end": null,
          "available": false
        }
      },
      "emergencyServices": true,
      "travelDistance": 50,
      "minimumJobValue": 100,
      "maximumJobValue": 5000,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    },
    "businessInfo": null,
    "verification": {
      "_id": "507f1f77bcf86cd799439026",
      "provider": "507f1f77bcf86cd799439011",
      "identityVerified": true,
      "businessVerified": false,
      "backgroundCheck": {
        "status": "passed",
        "dateCompleted": "2024-01-10T00:00:00.000Z"
      },
      "insurance": {
        "hasInsurance": true,
        "insuranceProvider": "ABC Insurance",
        "policyNumber": "POL-12345",
        "coverageAmount": 1000000,
        "expiryDate": "2025-12-31T00:00:00.000Z"
      },
      "licenses": [
        {
          "_id": "507f1f77bcf86cd799439027",
          "type": "Professional License",
          "number": "PL-12345",
          "issuingAuthority": "State Board",
          "issueDate": "2020-01-15T00:00:00.000Z",
          "expiryDate": "2025-01-15T00:00:00.000Z"
        }
      ],
      "references": [],
      "portfolio": {
        "images": [
          "https://example.com/portfolio1.jpg",
          "https://example.com/portfolio2.jpg"
        ],
        "videos": [],
        "descriptions": [],
        "beforeAfter": []
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    },
    "preferences": {
      "_id": "507f1f77bcf86cd799439028",
      "provider": "507f1f77bcf86cd799439011",
      "notificationSettings": {
        "newJobAlerts": true,
        "messageNotifications": true,
        "paymentNotifications": true,
        "reviewNotifications": true,
        "marketingEmails": false
      },
      "jobPreferences": {
        "preferredJobTypes": ["plumbing", "repair"],
        "avoidJobTypes": [],
        "preferredTimeSlots": ["morning", "afternoon"],
        "maxJobsPerDay": 5,
        "advanceBookingDays": 30
      },
      "communicationPreferences": {
        "preferredContactMethod": "app",
        "responseTimeExpectation": 60,
        "autoAcceptJobs": false
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    },
    "performance": {
      "_id": "507f1f77bcf86cd799439029",
      "provider": "507f1f77bcf86cd799439011",
      "rating": 4.8,
      "totalReviews": 150,
      "totalJobs": 200,
      "completedJobs": 195,
      "cancelledJobs": 5,
      "responseTime": 15,
      "completionRate": 97.5,
      "repeatCustomerRate": 85,
      "earnings": {
        "total": 50000,
        "thisMonth": 5000,
        "lastMonth": 4500,
        "pending": 1000
      },
      "badges": [
        {
          "_id": "507f1f77bcf86cd799439030",
          "name": "Top Rated",
          "description": "Consistently high ratings",
          "earnedDate": "2024-01-01T00:00:00.000Z",
          "category": "performance"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    },
    "settings": {
      "profileVisibility": "public",
      "showContactInfo": true,
      "showPricing": true,
      "showReviews": true,
      "allowDirectBooking": true,
      "requireApproval": false
    },
    "metadata": {
      "lastActive": "2024-01-20T14:30:00.000Z",
      "profileViews": 1251,
      "searchRanking": 8.5,
      "featured": true,
      "promoted": false,
      "tags": ["verified", "top_rated", "experienced"],
      "notes": null
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-20T14:30:00.000Z"
  }
}
```

### Response Structure (Extended - `/api/marketplace/providers/:id`)

```json
{
  "success": true,
  "message": "Provider details retrieved successfully",
  "data": {
    "provider": {
      "id": "507f1f77bcf86cd799439011",
      "userId": "507f191e810c19729de860ea",
      "user": {
        "_id": "507f191e810c19729de860ea",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "phoneNumber": "+1234567890",
        "profileImage": "https://example.com/profile.jpg",
        "roles": ["client", "provider"],
        "isActive": true,
        "verification": {
          "emailVerified": true,
          "phoneVerified": true
        },
        "badges": ["verified", "top_rated"],
        "profile": {
          "_id": "507f1f77bcf86cd799439012",
          "avatar": {
            "url": "https://example.com/avatar.jpg",
            "publicId": "avatar_123",
            "thumbnail": "https://example.com/avatar_thumb.jpg"
          },
          "bio": "Experienced professional with 10+ years in the industry",
          "address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zipCode": "10001",
            "country": "USA",
            "coordinates": {
              "lat": 40.7128,
              "lng": -74.0060
            }
          }
        }
      },
      "userProfile": {
        "_id": "507f191e810c19729de860ea",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "phoneNumber": "+1234567890",
        "profileImage": "https://example.com/profile.jpg",
        "roles": ["client", "provider"],
        "isActive": true,
        "verification": {
          "emailVerified": true,
          "phoneVerified": true
        },
        "badges": ["verified", "top_rated"],
        "profile": {
          "_id": "507f1f77bcf86cd799439012",
          "avatar": {
            "url": "https://example.com/avatar.jpg",
            "publicId": "avatar_123",
            "thumbnail": "https://example.com/avatar_thumb.jpg"
          },
          "bio": "Experienced professional with 10+ years in the industry",
          "address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zipCode": "10001",
            "country": "USA",
            "coordinates": {
              "lat": 40.7128,
              "lng": -74.0060
            }
          }
        }
      },
      "providerType": "individual",
      "status": "active",
      "businessInfo": null,
      "professionalInfo": {
        "_id": "507f1f77bcf86cd799439018",
        "provider": "507f1f77bcf86cd799439011",
        "specialties": [
          {
            "_id": "507f1f77bcf86cd799439019",
            "experience": 10,
            "hourlyRate": 75,
            "certifications": [
              {
                "_id": "507f1f77bcf86cd799439020",
                "name": "Licensed Plumber",
                "issuer": "State Licensing Board",
                "dateIssued": "2020-01-15T00:00:00.000Z",
                "expiryDate": "2025-01-15T00:00:00.000Z",
                "certificateNumber": "PLB-12345"
              }
            ],
            "skills": [
              {
                "_id": "507f1f77bcf86cd799439021",
                "name": "Pipe Repair",
                "description": "Expert in repairing and replacing pipes",
                "category": {
                  "_id": "507f1f77bcf86cd799439022",
                  "name": "Plumbing",
                  "key": "plumbing"
                },
                "metadata": {
                  "level": "expert",
                  "yearsExperience": 10
                }
              }
            ],
            "serviceAreas": [
              {
                "_id": "507f1f77bcf86cd799439024",
                "city": "New York",
                "state": "NY",
                "radius": 25
              }
            ]
          }
        ],
        "languages": ["English", "Spanish"],
        "availability": {
          "monday": {
            "start": "09:00",
            "end": "17:00",
            "available": true
          },
          "tuesday": {
            "start": "09:00",
            "end": "17:00",
            "available": true
          },
          "wednesday": {
            "start": "09:00",
            "end": "17:00",
            "available": true
          },
          "thursday": {
            "start": "09:00",
            "end": "17:00",
            "available": true
          },
          "friday": {
            "start": "09:00",
            "end": "17:00",
            "available": true
          },
          "saturday": {
            "start": "10:00",
            "end": "14:00",
            "available": true
          },
          "sunday": {
            "start": null,
            "end": null,
            "available": false
          }
        },
        "emergencyServices": true,
        "travelDistance": 50,
        "minimumJobValue": 100,
        "maximumJobValue": 5000,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      },
      "verification": {
        "identityVerified": true,
        "businessVerified": false,
        "backgroundCheck": {
          "status": "passed"
        },
        "insurance": {
          "hasInsurance": true,
          "coverageAmount": 1000000
        },
        "licenses": [
          {
            "type": "Professional License",
            "number": "PL-12345",
            "issuingAuthority": "State Board",
            "expiryDate": "2025-01-15T00:00:00.000Z"
          }
        ],
        "portfolio": {
          "images": [
            "https://example.com/portfolio1.jpg",
            "https://example.com/portfolio2.jpg"
          ],
          "videos": [],
          "descriptions": [],
          "beforeAfter": []
        }
      },
      "performance": {
        "rating": 4.8,
        "totalReviews": 150,
        "totalJobs": 200,
        "completedJobs": 195,
        "cancelledJobs": 5,
        "responseTime": 15,
        "completionRate": 97.5,
        "repeatCustomerRate": 85,
        "earnings": {
          "total": 50000,
          "thisMonth": 5000,
          "lastMonth": 4500,
          "pending": 1000
        },
        "badges": [
          {
            "_id": "507f1f77bcf86cd799439030",
            "name": "Top Rated",
            "description": "Consistently high ratings",
            "earnedDate": "2024-01-01T00:00:00.000Z",
            "category": "performance"
          }
        ]
      },
      "preferences": {
        "notificationSettings": {
          "newJobAlerts": true,
          "messageNotifications": true,
          "paymentNotifications": true,
          "reviewNotifications": true,
          "marketingEmails": false
        },
        "jobPreferences": {
          "preferredJobTypes": ["plumbing", "repair"],
          "avoidJobTypes": [],
          "preferredTimeSlots": ["morning", "afternoon"],
          "maxJobsPerDay": 5,
          "advanceBookingDays": 30
        },
        "communicationPreferences": {
          "preferredContactMethod": "app",
          "responseTimeExpectation": 60,
          "autoAcceptJobs": false
        }
      },
      "settings": {
        "profileVisibility": "public",
        "showContactInfo": true,
        "showPricing": true,
        "showReviews": true,
        "allowDirectBooking": true,
        "requireApproval": false
      },
      "metadata": {
        "profileViews": 1251,
        "featured": true,
        "promoted": false,
        "lastActive": "2024-01-20T14:30:00.000Z"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-20T14:30:00.000Z"
    },
    "services": [
      {
        "_id": "507f1f77bcf86cd799439031",
        "title": "Emergency Plumbing Repair",
        "description": "24/7 emergency plumbing services",
        "category": "plumbing",
        "subcategory": "repair",
        "pricing": {
          "type": "hourly",
          "basePrice": 75,
          "currency": "USD"
        },
        "rating": {
          "average": 4.8,
          "count": 50
        },
        "images": [
          "https://example.com/service1.jpg"
        ],
        "serviceArea": {
          "city": "New York",
          "state": "NY",
          "radius": 25
        },
        "createdAt": "2024-01-10T00:00:00.000Z"
      }
    ],
    "serviceCount": 1,
    "statistics": {
      "totalServices": 5,
      "bookings": {
        "total": 200,
        "completed": 195,
        "pending": 3,
        "cancelled": 2,
        "totalEarnings": 50000
      },
      "averageRating": 4.8,
      "totalReviews": 150,
      "responseRate": 97.5,
      "averageResponseTime": 15,
      "averageServiceRating": 4.7,
      "totalServiceRatings": 200
    },
    "reviews": [
      {
        "id": "507f1f77bcf86cd799439032",
        "client": {
          "_id": "507f1f77bcf86cd799439033",
          "firstName": "Jane",
          "lastName": "Smith",
          "profile": {
            "avatar": {
              "url": "https://example.com/client-avatar.jpg"
            }
          }
        },
        "rating": 5,
        "comment": "Excellent service! Very professional and timely.",
        "categories": {
          "quality": 5,
          "timeliness": 5,
          "communication": 5
        },
        "wouldRecommend": true,
        "photos": [],
        "bookingDate": "2024-01-15T10:00:00.000Z",
        "createdAt": "2024-01-16T08:00:00.000Z"
      }
    ]
  }
}
```

### Query Parameters for Marketplace Provider Detail

- `includeServices` (default: `true`) - Include provider's services
- `includeReviews` (default: `true`) - Include recent reviews
- `includeStatistics` (default: `true`) - Include statistics
- `requireActive` (default: `true`) - Only return active providers

### Notes for Provider Detail Response

- **Skills**: Fully populated with name, description, category, and metadata
- **Financial Info**: Excluded from public responses
- **Services**: Included when `includeServices=true` (default)
- **Statistics**: Included when `includeStatistics=true` (default)
- **Reviews**: Included when `includeReviews=true` (default)
- **Profile Views**: Automatically incremented on each request

---

## Key Differences

| Feature | Providers List | Provider Detail |
|---------|---------------|-----------------|
| **Structure** | Array of providers | Single provider object |
| **Pagination** | Yes | No |
| **Services** | No | Yes (optional) |
| **Statistics** | No | Yes (optional) |
| **Reviews** | No | Yes (optional) |
| **User Data** | Included | Included (as `user` and `userProfile`) |
| **Skills Population** | Yes | Yes |
| **Financial Info** | Excluded | Excluded |

---

## Common Fields

Both responses include:

- **Provider ID** (`_id`)
- **User Information** (userId, user, userProfile)
- **Status** (pending, active, suspended, inactive, rejected)
- **Provider Type** (individual, business, agency)
- **Professional Info** (with populated skills)
- **Business Info** (for business/agency providers)
- **Verification** (identity, business, background check, insurance, licenses)
- **Performance** (rating, reviews, jobs, earnings)
- **Preferences** (notifications, job preferences, communication)
- **Settings** (visibility, display options)
- **Metadata** (views, featured, promoted, tags)


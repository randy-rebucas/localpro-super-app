# PATCH Endpoints - Quick Reference Examples

## Table of Contents
- [Agency Examples](#agency-examples)
- [Instructor Course Examples](#instructor-course-examples)
- [Supplier Product Examples](#supplier-product-examples)
- [cURL Examples](#curl-examples)
- [JavaScript/TypeScript Examples](#javascripttypescript-examples)

---

## Agency Examples

### Update Agency Name

```json
PATCH /api/agencies/:id
{
  "name": "New Agency Name"
}
```

### Update Contact Information

```json
PATCH /api/agencies/:id
{
  "contact": {
    "email": "newemail@agency.com",
    "phone": "+1234567890",
    "website": "https://newagency.com"
  }
}
```

### Update Business Information

```json
PATCH /api/agencies/:id
{
  "business": {
    "type": "corporation",
    "registrationNumber": "REG123456",
    "taxId": "TAX123456"
  }
}
```

### Update Settings

```json
PATCH /api/agencies/:id
{
  "settings": {
    "autoApproveProviders": true,
    "defaultCommissionRate": 15,
    "notificationPreferences": {
      "email": {
        "newBookings": true
      }
    }
  }
}
```

### Update Service Areas

```json
PATCH /api/agencies/:id
{
  "serviceAreas": [
    {
      "name": "Metro Manila",
      "coordinates": {
        "lat": 14.5995,
        "lng": 120.9842
      },
      "radius": 50,
      "zipCodes": ["1000", "1001"]
    }
  ]
}
```

### Update Services

```json
PATCH /api/agencies/:id
{
  "services": [
    {
      "category": "cleaning",
      "subcategories": ["deep_cleaning", "move_out"],
      "pricing": {
        "baseRate": 50,
        "currency": "USD"
      }
    }
  ]
}
```

---

## Instructor Course Examples

### Update Course Title

```json
PATCH /api/academy/courses/:id
{
  "title": "Advanced JavaScript Mastery"
}
```

### Update Course Level and Duration

```json
PATCH /api/academy/courses/:id
{
  "level": "advanced",
  "duration": {
    "hours": 60,
    "weeks": 12
  }
}
```

### Update Pricing

```json
PATCH /api/academy/courses/:id
{
  "pricing": {
    "regularPrice": 499,
    "discountedPrice": 399,
    "currency": "PHP"
  }
}
```

### Update Enrollment Settings

```json
PATCH /api/academy/courses/:id
{
  "enrollment": {
    "maxCapacity": 100,
    "isOpen": true
  }
}
```

### Update Schedule

```json
PATCH /api/academy/courses/:id
{
  "schedule": {
    "startDate": "2025-02-01T00:00:00.000Z",
    "endDate": "2025-04-01T00:00:00.000Z",
    "sessions": [
      {
        "date": "2025-02-01T00:00:00.000Z",
        "startTime": "09:00",
        "endTime": "12:00",
        "type": "live"
      }
    ]
  }
}
```

### Update Tags

```json
PATCH /api/academy/courses/:id
{
  "tags": ["javascript", "advanced", "web-development", "es6"]
}
```

### Update Curriculum

```json
PATCH /api/academy/courses/:id
{
  "curriculum": [
    {
      "module": "Module 1: Introduction",
      "lessons": [
        {
          "title": "Lesson 1.1",
          "description": "Introduction to JavaScript",
          "duration": 30,
          "type": "video"
        }
      ]
    }
  ]
}
```

---

## Supplier Product Examples

### Update Product Name and Price

```json
PATCH /api/supplies/:id
{
  "name": "Premium Cleaning Solution",
  "pricing": {
    "retailPrice": 49.99
  }
}
```

### Update Inventory

```json
PATCH /api/supplies/:id
{
  "inventory": {
    "quantity": 150,
    "minStock": 20,
    "maxStock": 1000
  }
}
```

### Update Specifications

```json
PATCH /api/supplies/:id
{
  "specifications": {
    "weight": "2.5 lbs",
    "dimensions": "10x8x6 inches",
    "material": "Plastic",
    "color": "Blue"
  }
}
```

### Update Location

```json
PATCH /api/supplies/:id
{
  "location": {
    "street": "456 Business Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

### Update Featured Status and Tags

```json
PATCH /api/supplies/:id
{
  "isFeatured": true,
  "tags": ["premium", "eco-friendly", "bestseller"]
}
```

### Update Multiple Fields

```json
PATCH /api/supplies/:id
{
  "pricing": {
    "retailPrice": 59.99,
    "wholesalePrice": 49.99
  },
  "inventory": {
    "quantity": 200
  },
  "isActive": true,
  "isFeatured": true
}
```

---

## cURL Examples

### Agency PATCH

```bash
curl -X PATCH https://api.example.com/api/agencies/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Agency Name",
    "settings": {
      "autoApproveProviders": true
    }
  }'
```

### Course PATCH

```bash
curl -X PATCH https://api.example.com/api/academy/courses/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Course Title",
    "pricing": {
      "regularPrice": 399
    }
  }'
```

### Product PATCH

```bash
curl -X PATCH https://api.example.com/api/supplies/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "pricing": {
      "retailPrice": 49.99
    },
    "inventory": {
      "quantity": 100
    }
  }'
```

---

## JavaScript/TypeScript Examples

### Agency PATCH

```javascript
async function patchAgency(agencyId, updates) {
  const response = await fetch(`/api/agencies/${agencyId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('Updated fields:', data.data.updatedFields);
    return data.data.agency;
  } else {
    throw new Error(data.message);
  }
}

// Usage
patchAgency('507f1f77bcf86cd799439011', {
  name: 'New Agency Name',
  settings: {
    autoApproveProviders: true
  }
});
```

### Course PATCH

```javascript
async function patchCourse(courseId, updates) {
  const response = await fetch(`/api/academy/courses/${courseId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();
  
  if (data.success) {
    return data.data.course;
  } else {
    throw new Error(data.message);
  }
}

// Usage
patchCourse('507f1f77bcf86cd799439011', {
  title: 'Updated Course Title',
  pricing: {
    regularPrice: 399
  }
});
```

### Product PATCH

```javascript
async function patchProduct(productId, updates) {
  const response = await fetch(`/api/supplies/${productId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();
  
  if (data.success) {
    return data.data.supply;
  } else {
    throw new Error(data.message);
  }
}

// Usage
patchProduct('507f1f77bcf86cd799439011', {
  name: 'Updated Product Name',
  pricing: {
    retailPrice: 49.99
  },
  inventory: {
    quantity: 100
  }
});
```

### TypeScript Example

```typescript
interface AgencyPatchRequest {
  name?: string;
  description?: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  settings?: {
    autoApproveProviders?: boolean;
    defaultCommissionRate?: number;
  };
}

async function patchAgency(
  agencyId: string,
  updates: AgencyPatchRequest
): Promise<Agency> {
  const response = await fetch(`/api/agencies/${agencyId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data.agency;
}
```

---

## Notes

- All fields are optional - only send what you want to update
- Nested objects are deep merged - existing values are preserved
- Protected fields are automatically ignored
- The response includes an `updatedFields` array showing what was changed
- Location/address updates automatically trigger geocoding
- All updates are logged for audit purposes

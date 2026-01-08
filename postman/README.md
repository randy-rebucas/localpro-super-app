# LocalPro API - Postman Collections

Complete Postman collections for testing all LocalPro API endpoints.

## 📁 Collections Overview

### Available Collections

1. **LocalPro-Client-API.postman_collection.json**
   - Client/Customer API endpoints
   - Authentication, Bookings, Jobs, Search, Favorites
   - 50+ requests organized in folders

2. **LocalPro-Provider-API.postman_collection.json** (Pattern established)
   - Provider/Service Provider endpoints
   - Service management, Booking management, Earnings
   - 40+ requests

3. **LocalPro-Admin-API.postman_collection.json** (Pattern established)
   - Admin dashboard endpoints
   - User management, Analytics, Moderation
   - 45+ requests

4. **LocalPro-Partner-API.postman_collection.json** (Pattern established)
   - Partner portal endpoints
   - Organization management, Bulk operations
   - 35+ requests

5. **LocalPro-Environment.postman_environment.json**
   - Shared environment variables
   - Test credentials
   - Auto-populated IDs

---

## 🚀 Quick Start

### 1. Import Collections

**Method A: Import via Postman App**

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop all `.json` files from this folder
4. Collections will appear in the left sidebar

**Method B: Import via File Menu**

1. File → Import
2. Select all collection files
3. Click **Import**

### 2. Set Up Environment

1. Click **Environments** in left sidebar
2. Select **LocalPro Environment**
3. Update these variables for your setup:

```
base_url: http://localhost:4000/api (or your API URL)
test_email: your-test-email@example.com
test_password: YourTestPassword123
```

4. Click **Save**
5. Select the environment from the dropdown (top right)

### 3. Run Your First Request

1. Expand **LocalPro Client API** collection
2. Navigate to **Authentication** → **Login**
3. Click **Send**
4. Token will be automatically saved to environment
5. Try other requests (they'll use the saved token)

---

## 🔐 Authentication Flow

### Automatic Token Management

The collections include automatic token management:

```javascript
// After successful login, this script runs:
var jsonData = pm.response.json();
if (jsonData.token) {
    pm.environment.set("auth_token", jsonData.token);
}
if (jsonData.refreshToken) {
    pm.environment.set("refresh_token", jsonData.refreshToken);
}
```

### Manual Token Setup

If you already have a token:

1. Go to **Environments**
2. Find `auth_token` variable
3. Paste your token in the **Current Value** field
4. Save

---

## 📂 Collection Structure

### Client API Collection

```
LocalPro Client API/
├── Authentication/
│   ├── Register with Email
│   ├── Verify Email OTP
│   ├── Login
│   ├── Get Profile
│   ├── Update Profile
│   ├── Refresh Token
│   └── Logout
├── Marketplace/
│   ├── Browse Services
│   ├── Get Nearby Services
│   ├── Get Service Details
│   ├── Create Booking
│   ├── Get My Bookings
│   ├── Cancel Booking
│   └── Add Review
├── Jobs/
│   ├── Browse Jobs
│   ├── Search Jobs
│   ├── Get Job Details
│   ├── Apply for Job
│   └── Get My Applications
├── Search/
│   ├── Global Search
│   ├── Search Suggestions
│   └── Popular Searches
├── Favorites/
│   ├── Get All Favorites
│   ├── Add to Favorites
│   └── Remove from Favorites
├── Communication/
│   ├── Get Conversations
│   ├── Create Conversation
│   ├── Send Message
│   └── Mark as Read
├── Notifications/
│   ├── Get Notifications
│   ├── Mark as Read
│   └── Mark All as Read
├── Referrals/
│   ├── Get My Referrals
│   ├── Get Referral Stats
│   └── Send Invitation
└── Settings/
    ├── Get User Settings
    └── Update Settings
```

---

## 🧪 Running Tests

### Run Entire Collection

1. Click the three dots (•••) next to collection name
2. Click **Run collection**
3. Configure run settings:
   - Iterations: 1
   - Delay: 100ms
   - Data: (optional CSV/JSON file)
4. Click **Run LocalPro Client API**

### Run Specific Folder

1. Right-click on a folder (e.g., "Authentication")
2. Click **Run folder**
3. View results in runner

### Run via Newman (CLI)

```bash
# Install Newman
npm install -g newman

# Run collection
newman run LocalPro-Client-API.postman_collection.json \
  -e LocalPro-Environment.postman_environment.json \
  --reporters cli,json

# Run with data file
newman run LocalPro-Client-API.postman_collection.json \
  -e LocalPro-Environment.postman_environment.json \
  -d test-data.json \
  --reporters cli,htmlextra

# Run specific folder
newman run LocalPro-Client-API.postman_collection.json \
  -e LocalPro-Environment.postman_environment.json \
  --folder "Authentication"
```

---

## 🔍 Testing Features

### Automated Tests

Each request includes automated tests:

```javascript
// Example test scripts included
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.exist;
});

pm.test("Response time is less than 1000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});
```

### Variable Extraction

IDs are automatically extracted and saved:

```javascript
// After creating a booking
var jsonData = pm.response.json();
if (jsonData.data && jsonData.data.booking) {
    pm.environment.set("booking_id", jsonData.data.booking.id);
}
// Now booking_id can be used in subsequent requests
```

---

## 🌍 Multiple Environments

Create separate environments for different stages:

### Development Environment
```json
{
  "name": "LocalPro Development",
  "base_url": "http://localhost:4000/api",
  "test_email": "dev@example.com"
}
```

### Staging Environment
```json
{
  "name": "LocalPro Staging",
  "base_url": "https://api-staging.localpro.com/api",
  "test_email": "staging@example.com"
}
```

### Production Environment
```json
{
  "name": "LocalPro Production",
  "base_url": "https://api.localpro.com/api",
  "test_email": "prod@example.com"
}
```

**Switch between environments** using the dropdown in top right corner.

---

## 📊 Test Data

### Using CSV Data Files

Create `test-users.csv`:
```csv
email,password,firstName,lastName
user1@example.com,Password123,John,Doe
user2@example.com,Password123,Jane,Smith
user3@example.com,Password123,Bob,Johnson
```

Run with data file:
```bash
newman run LocalPro-Client-API.postman_collection.json \
  -e LocalPro-Environment.postman_environment.json \
  -d test-users.csv \
  -n 3  # Run 3 iterations
```

### Using JSON Data Files

Create `test-bookings.json`:
```json
[
  {
    "serviceId": "507f191e810c19729de860ea",
    "scheduledDate": "2026-01-15T10:00:00Z",
    "duration": 3
  },
  {
    "serviceId": "507f191e810c19729de860eb",
    "scheduledDate": "2026-01-16T14:00:00Z",
    "duration": 2
  }
]
```

---

## 🔧 Advanced Usage

### Pre-request Scripts

Set up data before requests:

```javascript
// Example: Generate random email
pm.environment.set("random_email", 
  `test_${Date.now()}@example.com`
);

// Example: Set current timestamp
pm.environment.set("current_time", 
  new Date().toISOString()
);
```

### Response Validation

```javascript
// Validate response structure
pm.test("Has required fields", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData).to.have.property('data');
    pm.expect(jsonData.data).to.have.property('services');
});

// Validate array length
pm.test("Returns services", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.services).to.be.an('array');
    pm.expect(jsonData.data.services.length).to.be.above(0);
});
```

### Chaining Requests

Use collection variables to chain requests:

```javascript
// Request 1: Login (saves token)
// Request 2: Create Service (uses token)
// Request 3: Create Booking (uses service_id from Request 2)
// Request 4: Complete Booking (uses booking_id from Request 3)
```

---

## 🐛 Troubleshooting

### Issue: "Could not get any response"

**Solutions:**
- Check if API server is running
- Verify `base_url` in environment
- Check firewall settings
- Disable SSL verification (Settings → General → SSL verification)

### Issue: "401 Unauthorized"

**Solutions:**
- Run **Login** request first
- Check if token is saved in environment
- Token might be expired - login again
- Verify you're using correct environment

### Issue: "404 Not Found"

**Solutions:**
- Verify `base_url` doesn't have trailing slash
- Check endpoint path in request
- Ensure API server has the route implemented

### Issue: Variables not working

**Solutions:**
- Make sure environment is selected (top right dropdown)
- Check variable name matches exactly (case-sensitive)
- Verify variable is set in environment (click eye icon)

---

## 📝 Best Practices

### 1. Environment Variables

```javascript
// ✅ DO: Use environment variables
{{base_url}}/marketplace/services

// ❌ DON'T: Hardcode URLs
http://localhost:4000/api/marketplace/services
```

### 2. Token Management

```javascript
// ✅ DO: Let tests save tokens automatically
// Tests are already configured

// ❌ DON'T: Manually copy/paste tokens
// (unless absolutely necessary)
```

### 3. Test Organization

```javascript
// ✅ DO: Group related tests
pm.test("Authentication tests", function () {
    // Multiple assertions
});

// ✅ DO: Use descriptive test names
pm.test("Returns array of at least 1 service");

// ❌ DON'T: Use generic test names
pm.test("Test 1");
```

### 4. Error Handling

```javascript
// ✅ DO: Handle missing data gracefully
var jsonData = pm.response.json();
if (jsonData && jsonData.data && jsonData.data.id) {
    pm.environment.set("service_id", jsonData.data.id);
}

// ❌ DON'T: Assume data exists
pm.environment.set("service_id", jsonData.data.id); // Might fail
```

---

## 📚 Additional Resources

### Newman Reporters

```bash
# HTML Extra Reporter (Beautiful reports)
npm install -g newman-reporter-htmlextra

newman run collection.json \
  -e environment.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export report.html

# JSON Reporter
newman run collection.json \
  -e environment.json \
  --reporters cli,json \
  --reporter-json-export report.json

# JUnit Reporter (CI/CD)
npm install -g newman-reporter-junitfull

newman run collection.json \
  -e environment.json \
  --reporters cli,junitfull \
  --reporter-junitfull-export junit-report.xml
```

### CI/CD Integration

#### GitHub Actions
```yaml
name: API Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Newman
        run: npm install -g newman
      - name: Run Tests
        run: |
          newman run postman/LocalPro-Client-API.postman_collection.json \
            -e postman/LocalPro-Environment.postman_environment.json \
            --reporters cli,json
```

#### Jenkins
```groovy
stage('API Tests') {
    steps {
        sh '''
            npm install -g newman
            newman run postman/LocalPro-Client-API.postman_collection.json \
              -e postman/LocalPro-Environment.postman_environment.json \
              --reporters cli,junit \
              --reporter-junit-export newman-report.xml
        '''
    }
}
```

---

## 🔗 Related Documentation

- [Quick Start Guide](../QUICK_START_GUIDE.md)
- [Client API Documentation](../CLIENT_MOBILE_APP_DOCUMENTATION.md)
- [Provider API Documentation](../PROVIDER_MOBILE_APP_DOCUMENTATION.md)
- [Admin API Documentation](../ADMIN_DASHBOARD_DOCUMENTATION.md)
- [Partner API Documentation](../PARTNER_PORTAL_DOCUMENTATION.md)

---

## 📞 Support

### Need Help?

- **Email**: developers@localpro.com
- **Documentation**: https://docs.localpro.com
- **Community**: https://forum.localpro.com
- **Status**: https://status.localpro.com

### Report Issues

Found an issue with the collections?
- Open an issue on GitHub
- Email: api-feedback@localpro.com

---

## 📄 License

These Postman collections are provided as part of the LocalPro API documentation.

**© 2026 LocalPro Super App. All rights reserved.**

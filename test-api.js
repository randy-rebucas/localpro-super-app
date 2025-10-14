// Comprehensive API testing script for LocalPro Super App
const http = require('http');

// Global variables to store test data
let authToken = null;
let testUserId = null;
let testServiceId = null;
let testCourseId = null;
let testBookingId = null;

const testEndpoint = (path, method = 'GET', data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000, // Updated to match server.js PORT
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // Add authorization header if token exists
    if (authToken && !headers.Authorization) {
      options.headers.Authorization = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: jsonBody,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

// Helper function to log test results
const logTestResult = (testName, result, expectedStatus = 200) => {
  const status = result.status === expectedStatus ? '✅' : '❌';
  console.log(`${status} ${testName}`);
  console.log(`   Status: ${result.status} (expected: ${expectedStatus})`);
  if (result.data && typeof result.data === 'object') {
    console.log(`   Response:`, JSON.stringify(result.data, null, 2));
  } else {
    console.log(`   Response:`, result.data);
  }
  console.log('');
  return result.status === expectedStatus;
};

// Test categories
async function testHealthAndInfo() {
  console.log('🏥 HEALTH & INFO TESTS');
  console.log('======================\n');

  // Test 1: Health check
  const health = await testEndpoint('/health');
  logTestResult('Health Check', health);

  // Test 2: API Info
  const info = await testEndpoint('/');
  logTestResult('API Information', info);
}

async function testAuthentication() {
  console.log('🔐 AUTHENTICATION TESTS');
  console.log('========================\n');

  // Test 1: Send verification code
  const sendCode = await testEndpoint('/api/auth/send-code', 'POST', {
    phoneNumber: '+1234567890'
  });
  logTestResult('Send Verification Code', sendCode);

  // Test 2: Verify code and login
  const verifyCode = await testEndpoint('/api/auth/verify-code', 'POST', {
    phoneNumber: '+1234567890',
    code: '123456',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com'
  });
  
  if (logTestResult('Verify Code and Login', verifyCode)) {
    authToken = verifyCode.data.token;
    testUserId = verifyCode.data.user?.id;
  }

  // Test 3: Get current user profile (requires auth)
  if (authToken) {
    const profile = await testEndpoint('/api/auth/me');
    logTestResult('Get User Profile', profile);
  }

  // Test 4: Update profile (requires auth)
  if (authToken) {
    const updateProfile = await testEndpoint('/api/auth/profile', 'PUT', {
      firstName: 'John Updated',
      lastName: 'Doe Updated',
      bio: 'Updated bio for testing'
    });
    logTestResult('Update User Profile', updateProfile);
  }
}

async function testMarketplace() {
  console.log('🛒 MARKETPLACE TESTS');
  console.log('====================\n');

  // Test 1: Get all services (public)
  const services = await testEndpoint('/api/marketplace/services');
  logTestResult('Get All Services', services);

  // Test 2: Get nearby services (public)
  const nearbyServices = await testEndpoint('/api/marketplace/services/nearby', 'POST', {
    latitude: 14.5995,
    longitude: 120.9842,
    radius: 10
  });
  logTestResult('Get Nearby Services', nearbyServices);

  // Test 3: Get specific service (public)
  if (services.data && services.data.length > 0) {
    testServiceId = services.data[0]._id;
    const service = await testEndpoint(`/api/marketplace/services/${testServiceId}`);
    logTestResult('Get Service by ID', service);
  }

  // Test 4: Create service (requires auth + provider role)
  if (authToken) {
    const createService = await testEndpoint('/api/marketplace/services', 'POST', {
      title: 'Test Service',
      description: 'A test service for API testing',
      category: 'cleaning',
      price: 100,
      duration: 60,
      location: {
        address: 'Test Address',
        coordinates: [14.5995, 120.9842]
      },
      availability: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' }
      }
    });
    logTestResult('Create Service', createService, 201);
  }

  // Test 5: Create booking (requires auth)
  if (authToken && testServiceId) {
    const createBooking = await testEndpoint('/api/marketplace/bookings', 'POST', {
      serviceId: testServiceId,
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Test booking for API testing',
      location: {
        address: 'Test Booking Address',
        coordinates: [14.5995, 120.9842]
      }
    });
    
    if (logTestResult('Create Booking', createBooking, 201)) {
      testBookingId = createBooking.data._id;
    }
  }

  // Test 6: Get user bookings (requires auth)
  if (authToken) {
    const bookings = await testEndpoint('/api/marketplace/bookings');
    logTestResult('Get User Bookings', bookings);
  }
}

async function testAcademy() {
  console.log('🎓 ACADEMY TESTS');
  console.log('================\n');

  // Test 1: Get all courses (public)
  const courses = await testEndpoint('/api/academy/courses');
  logTestResult('Get All Courses', courses);

  // Test 2: Get certifications (public)
  const certifications = await testEndpoint('/api/academy/certifications');
  logTestResult('Get Certifications', certifications);

  // Test 3: Get specific course (public)
  if (courses.data && courses.data.length > 0) {
    testCourseId = courses.data[0]._id;
    const course = await testEndpoint(`/api/academy/courses/${testCourseId}`);
    logTestResult('Get Course by ID', course);
  }

  // Test 4: Enroll in course (requires auth)
  if (authToken && testCourseId) {
    const enroll = await testEndpoint('/api/academy/enroll', 'POST', {
      courseId: testCourseId
    });
    logTestResult('Enroll in Course', enroll, 201);
  }

  // Test 5: Get user enrollments (requires auth)
  if (authToken) {
    const enrollments = await testEndpoint('/api/academy/enrollments');
    logTestResult('Get User Enrollments', enrollments);
  }
}

async function testSupplies() {
  console.log('📦 SUPPLIES TESTS');
  console.log('==================\n');

  // Test 1: Get all products (public)
  const products = await testEndpoint('/api/supplies/products');
  logTestResult('Get All Products', products);

  // Test 2: Get subscription kits (public)
  const kits = await testEndpoint('/api/supplies/subscription-kits');
  logTestResult('Get Subscription Kits', kits);

  // Test 3: Get specific product (public)
  if (products.data && products.data.length > 0) {
    const product = await testEndpoint(`/api/supplies/products/${products.data[0]._id}`);
    logTestResult('Get Product by ID', product);
  }

  // Test 4: Create order (requires auth)
  if (authToken && products.data && products.data.length > 0) {
    const createOrder = await testEndpoint('/api/supplies/orders', 'POST', {
      items: [{
        productId: products.data[0]._id,
        quantity: 2
      }],
      shippingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'Philippines'
      }
    });
    logTestResult('Create Order', createOrder, 201);
  }

  // Test 5: Get user orders (requires auth)
  if (authToken) {
    const orders = await testEndpoint('/api/supplies/orders');
    logTestResult('Get User Orders', orders);
  }
}

async function testFinance() {
  console.log('💰 FINANCE TESTS');
  console.log('=================\n');

  // Test 1: Apply for loan (requires auth)
  if (authToken) {
    const applyLoan = await testEndpoint('/api/finance/loans/apply', 'POST', {
      amount: 50000,
      purpose: 'Business expansion',
      repaymentPeriod: 12,
      monthlyIncome: 30000,
      employmentStatus: 'employed',
      employerName: 'Test Company'
    });
    logTestResult('Apply for Loan', applyLoan, 201);
  }

  // Test 2: Apply for salary advance (requires auth)
  if (authToken) {
    const applyAdvance = await testEndpoint('/api/finance/salary-advance/apply', 'POST', {
      amount: 10000,
      reason: 'Emergency expenses',
      expectedRepaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    logTestResult('Apply for Salary Advance', applyAdvance, 201);
  }

  // Test 3: Get user loans (requires auth)
  if (authToken) {
    const loans = await testEndpoint('/api/finance/loans');
    logTestResult('Get User Loans', loans);
  }

  // Test 4: Get user salary advances (requires auth)
  if (authToken) {
    const advances = await testEndpoint('/api/finance/salary-advances');
    logTestResult('Get User Salary Advances', advances);
  }

  // Test 5: Get user transactions (requires auth)
  if (authToken) {
    const transactions = await testEndpoint('/api/finance/transactions');
    logTestResult('Get User Transactions', transactions);
  }
}

async function testRentals() {
  console.log('🏠 RENTALS TESTS');
  console.log('=================\n');

  // Test 1: Get rental items (public)
  const items = await testEndpoint('/api/rentals/items');
  logTestResult('Get Rental Items', items);

  // Test 2: Get specific rental item (public)
  if (items.data && items.data.length > 0) {
    const item = await testEndpoint(`/api/rentals/items/${items.data[0]._id}`);
    logTestResult('Get Rental Item by ID', item);
  }

  // Test 3: Create rental booking (requires auth)
  if (authToken && items.data && items.data.length > 0) {
    const createRental = await testEndpoint('/api/rentals/book', 'POST', {
      itemId: items.data[0]._id,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      pickupLocation: {
        address: 'Test Pickup Address',
        coordinates: [14.5995, 120.9842]
      }
    });
    logTestResult('Create Rental Booking', createRental, 201);
  }

  // Test 4: Get user rentals (requires auth)
  if (authToken) {
    const rentals = await testEndpoint('/api/rentals/');
    logTestResult('Get User Rentals', rentals);
  }
}

async function testMaps() {
  console.log('🗺️  MAPS TESTS');
  console.log('===============\n');

  // Test 1: Geocode address
  const geocode = await testEndpoint('/api/maps/geocode', 'POST', {
    address: 'Makati City, Philippines'
  });
  logTestResult('Geocode Address', geocode);

  // Test 2: Reverse geocode
  const reverseGeocode = await testEndpoint('/api/maps/reverse-geocode', 'POST', {
    latitude: 14.5995,
    longitude: 120.9842
  });
  logTestResult('Reverse Geocode', reverseGeocode);

  // Test 3: Search places
  const searchPlaces = await testEndpoint('/api/maps/places/search', 'POST', {
    query: 'restaurants in Makati',
    location: {
      latitude: 14.5995,
      longitude: 120.9842
    },
    radius: 1000
  });
  logTestResult('Search Places', searchPlaces);

  // Test 4: Calculate distance
  const distance = await testEndpoint('/api/maps/distance', 'POST', {
    origin: {
      latitude: 14.5995,
      longitude: 120.9842
    },
    destination: {
      latitude: 14.6042,
      longitude: 120.9822
    }
  });
  logTestResult('Calculate Distance', distance);

  // Test 5: Find nearby places
  const nearby = await testEndpoint('/api/maps/nearby', 'POST', {
    location: {
      latitude: 14.5995,
      longitude: 120.9842
    },
    radius: 1000,
    type: 'restaurant'
  });
  logTestResult('Find Nearby Places', nearby);

  // Test 6: Validate service area
  const validateArea = await testEndpoint('/api/maps/validate-service-area', 'POST', {
    serviceLocation: {
      latitude: 14.5995,
      longitude: 120.9842
    },
    customerLocation: {
      latitude: 14.6042,
      longitude: 120.9822
    },
    maxDistance: 10
  });
  logTestResult('Validate Service Area', validateArea);
}

async function testOtherModules() {
  console.log('🔧 OTHER MODULES TESTS');
  console.log('=======================\n');

  // Test 1: Get ads (public)
  const ads = await testEndpoint('/api/ads/');
  logTestResult('Get Ads', ads);

  // Test 2: Get facility care services (public)
  const facilityServices = await testEndpoint('/api/facility-care/services');
  logTestResult('Get Facility Care Services', facilityServices);

  // Test 3: Get LocalPro Plus features (requires auth)
  if (authToken) {
    const features = await testEndpoint('/api/localpro-plus/features');
    logTestResult('Get LocalPro Plus Features', features);
  }

  // Test 4: Get trust verification requests (requires auth)
  if (authToken) {
    const trustRequests = await testEndpoint('/api/trust-verification/requests');
    logTestResult('Get Trust Verification Requests', trustRequests);
  }

  // Test 5: Get user conversations (requires auth)
  if (authToken) {
    const conversations = await testEndpoint('/api/communication/conversations');
    logTestResult('Get User Conversations', conversations);
  }

  // Test 6: Get user notifications (requires auth)
  if (authToken) {
    const notifications = await testEndpoint('/api/communication/notifications');
    logTestResult('Get User Notifications', notifications);
  }

  // Test 7: Get user analytics (requires auth)
  if (authToken) {
    const analytics = await testEndpoint('/api/analytics/user');
    logTestResult('Get User Analytics', analytics);
  }
}

async function testErrorHandling() {
  console.log('⚠️  ERROR HANDLING TESTS');
  console.log('=========================\n');

  // Test 1: Invalid endpoint
  const invalidEndpoint = await testEndpoint('/api/invalid-endpoint');
  logTestResult('Invalid Endpoint (404)', invalidEndpoint, 404);

  // Test 2: Unauthorized access
  const unauthorized = await testEndpoint('/api/auth/me', 'GET', null, {});
  logTestResult('Unauthorized Access (401)', unauthorized, 401);

  // Test 3: Invalid data format
  const invalidData = await testEndpoint('/api/auth/send-code', 'POST', {
    invalidField: 'test'
  });
  logTestResult('Invalid Data Format (400)', invalidData, 400);

  // Test 4: Missing required fields
  const missingFields = await testEndpoint('/api/auth/verify-code', 'POST', {
    phoneNumber: '+1234567890'
    // Missing code, firstName, lastName
  });
  logTestResult('Missing Required Fields (400)', missingFields, 400);
}

async function runTests() {
  console.log('🧪 Testing LocalPro Super App API...\n');
  console.log('📡 Server should be running on port 5000\n');

  try {
    // Run all test categories
    await testHealthAndInfo();
    await testAuthentication();
    await testMarketplace();
    await testAcademy();
    await testSupplies();
    await testFinance();
    await testRentals();
    await testMaps();
    await testOtherModules();
    await testErrorHandling();

    console.log('🎉 All tests completed!');
    console.log('\n📊 Test Summary:');
    console.log('- Health & Info: Basic API functionality');
    console.log('- Authentication: User registration and login flow');
    console.log('- Marketplace: Services and booking system');
    console.log('- Academy: Course management and enrollment');
    console.log('- Supplies: Product catalog and ordering');
    console.log('- Finance: Loan and salary advance applications');
    console.log('- Rentals: Equipment rental system');
    console.log('- Maps: Google Maps integration');
    console.log('- Other Modules: Additional features');
    console.log('- Error Handling: Edge cases and validation');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run dev');
    console.log('💡 Check that all environment variables are properly configured');
  }
}

runTests();

// Simple API testing script
const http = require('http');

const testEndpoint = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

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
            data: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
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

async function runTests() {
  console.log('🧪 Testing LocalPro Super App API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await testEndpoint('/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, health.data);
    console.log('');

    // Test 2: Send verification code
    console.log('2. Testing send verification code...');
    const sendCode = await testEndpoint('/api/auth/send-code', 'POST', {
      phoneNumber: '+1234567890'
    });
    console.log(`   Status: ${sendCode.status}`);
    console.log(`   Response:`, sendCode.data);
    console.log('');

    // Test 3: Verify code
    console.log('3. Testing verify code...');
    const verifyCode = await testEndpoint('/api/auth/verify-code', 'POST', {
      phoneNumber: '+1234567890',
      code: '123456',
      firstName: 'John',
      lastName: 'Doe'
    });
    console.log(`   Status: ${verifyCode.status}`);
    console.log(`   Response:`, verifyCode.data);
    console.log('');

    // Test 4: Get courses (public endpoint)
    console.log('4. Testing get courses...');
    const courses = await testEndpoint('/api/academy/courses');
    console.log(`   Status: ${courses.status}`);
    console.log(`   Response:`, courses.data);
    console.log('');

    // Test 5: Get marketplace services
    console.log('5. Testing get marketplace services...');
    const services = await testEndpoint('/api/marketplace/services');
    console.log(`   Status: ${services.status}`);
    console.log(`   Response:`, services.data);

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run dev');
  }
}

runTests();

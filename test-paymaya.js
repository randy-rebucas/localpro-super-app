/**
 * PayMaya Integration Test Script
 * 
 * This script demonstrates how to test the PayMaya integration
 * Run with: node test-paymaya.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-jwt-token-here'; // Replace with actual token

// Test data
const testCheckoutData = {
  totalAmount: 1000.00,
  currency: 'PHP',
  description: 'Test service payment',
  referenceId: `TEST-${Date.now()}`,
  buyer: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+639171234567'
  },
  items: [
    {
      name: 'Test Service',
      code: 'TEST-001',
      description: 'Test service for PayMaya integration',
      quantity: 1,
      totalAmount: {
        amount: '1000.00',
        currency: 'PHP'
      }
    }
  ],
  redirectUrl: {
    success: 'http://localhost:3000/payment/success',
    failure: 'http://localhost:3000/payment/failure',
    cancel: 'http://localhost:3000/payment/cancel'
  }
};

const testPaymentData = {
  vaultId: 'test-vault-123',
  amount: 500.00,
  currency: 'PHP',
  referenceId: `PAYMENT-${Date.now()}`,
  buyer: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com'
  },
  description: 'Test payment with vault'
};

const testInvoiceData = {
  amount: 750.00,
  currency: 'PHP',
  description: 'Test invoice payment',
  referenceId: `INVOICE-${Date.now()}`,
  buyer: {
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com'
  },
  redirectUrl: {
    success: 'http://localhost:3000/payment/success',
    failure: 'http://localhost:3000/payment/failure',
    cancel: 'http://localhost:3000/payment/cancel'
  }
};

// Helper function to make API requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error making ${method} request to ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testPayMayaConfig = async () => {
  console.log('\n🔧 Testing PayMaya Configuration...');
  try {
    const result = await makeRequest('GET', '/paymaya/config/validate');
    console.log('✅ Configuration validation result:', result);
    return result.data.isValid;
  } catch (error) {
    console.log('❌ Configuration validation failed:', error.message);
    return false;
  }
};

const testCreateCheckout = async () => {
  console.log('\n🛒 Testing Checkout Creation...');
  try {
    const result = await makeRequest('POST', '/paymaya/checkout', testCheckoutData);
    console.log('✅ Checkout created successfully:', result);
    return result.data.checkoutId;
  } catch (error) {
    console.log('❌ Checkout creation failed:', error.message);
    return null;
  }
};

const testGetCheckout = async (checkoutId) => {
  if (!checkoutId) {
    console.log('⏭️  Skipping checkout retrieval (no checkout ID)');
    return;
  }

  console.log('\n📋 Testing Checkout Retrieval...');
  try {
    const result = await makeRequest('GET', `/paymaya/checkout/${checkoutId}`);
    console.log('✅ Checkout retrieved successfully:', result);
  } catch (error) {
    console.log('❌ Checkout retrieval failed:', error.message);
  }
};

const testCreatePayment = async () => {
  console.log('\n💳 Testing Payment Creation...');
  try {
    const result = await makeRequest('POST', '/paymaya/payment', testPaymentData);
    console.log('✅ Payment created successfully:', result);
    return result.data.paymentId;
  } catch (error) {
    console.log('❌ Payment creation failed:', error.message);
    return null;
  }
};

const testGetPayment = async (paymentId) => {
  if (!paymentId) {
    console.log('⏭️  Skipping payment retrieval (no payment ID)');
    return;
  }

  console.log('\n📋 Testing Payment Retrieval...');
  try {
    const result = await makeRequest('GET', `/paymaya/payment/${paymentId}`);
    console.log('✅ Payment retrieved successfully:', result);
  } catch (error) {
    console.log('❌ Payment retrieval failed:', error.message);
  }
};

const testCreateInvoice = async () => {
  console.log('\n📄 Testing Invoice Creation...');
  try {
    const result = await makeRequest('POST', '/paymaya/invoice', testInvoiceData);
    console.log('✅ Invoice created successfully:', result);
    return result.data.invoiceId;
  } catch (error) {
    console.log('❌ Invoice creation failed:', error.message);
    return null;
  }
};

const testGetInvoice = async (invoiceId) => {
  if (!invoiceId) {
    console.log('⏭️  Skipping invoice retrieval (no invoice ID)');
    return;
  }

  console.log('\n📋 Testing Invoice Retrieval...');
  try {
    const result = await makeRequest('GET', `/paymaya/invoice/${invoiceId}`);
    console.log('✅ Invoice retrieved successfully:', result);
  } catch (error) {
    console.log('❌ Invoice retrieval failed:', error.message);
  }
};

const testWebhookEvents = async () => {
  console.log('\n🔔 Testing Webhook Events...');
  try {
    const result = await makeRequest('GET', '/paymaya/webhook/events');
    console.log('✅ Webhook events retrieved successfully:', result);
  } catch (error) {
    console.log('❌ Webhook events retrieval failed:', error.message);
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting PayMaya Integration Tests...');
  console.log('=' .repeat(50));

  // Test configuration
  const isConfigValid = await testPayMayaConfig();
  
  if (!isConfigValid) {
    console.log('\n❌ PayMaya configuration is invalid. Please check your environment variables.');
    console.log('Required variables:');
    console.log('- PAYMAYA_PUBLIC_KEY');
    console.log('- PAYMAYA_SECRET_KEY');
    console.log('- PAYMAYA_MODE (sandbox/production)');
    console.log('- PAYMAYA_WEBHOOK_SECRET');
    return;
  }

  // Test checkout flow
  const checkoutId = await testCreateCheckout();
  await testGetCheckout(checkoutId);

  // Test payment flow
  const paymentId = await testCreatePayment();
  await testGetPayment(paymentId);

  // Test invoice flow
  const invoiceId = await testCreateInvoice();
  await testGetInvoice(invoiceId);

  // Test webhook events
  await testWebhookEvents();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ PayMaya Integration Tests Completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Test with actual PayMaya sandbox credentials');
  console.log('2. Set up webhook endpoints for real-time notifications');
  console.log('3. Test payment flows with test cards');
  console.log('4. Implement frontend integration');
  console.log('5. Test in production environment');
};

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testPayMayaConfig,
  testCreateCheckout,
  testGetCheckout,
  testCreatePayment,
  testGetPayment,
  testCreateInvoice,
  testGetInvoice,
  testWebhookEvents,
  runTests
};

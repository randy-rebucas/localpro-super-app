// Test script for email templates
require('dotenv').config();
const templateEngine = require('./src/utils/templateEngine');
const fs = require('fs');
const path = require('path');

async function testEmailTemplates() {
  console.log('🧪 Testing Email Templates...\n');

  // Create output directory for generated templates
  const outputDir = path.join(__dirname, 'template-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  try {
    // Test 1: Welcome Email Template
    console.log('1. Testing Welcome Email Template...');
    const welcomeHtml = templateEngine.render('welcome', {
      firstName: 'John',
      subject: 'Welcome to LocalPro Super App!'
    });
    
    fs.writeFileSync(path.join(outputDir, 'welcome.html'), welcomeHtml);
    console.log('✅ Welcome template rendered successfully');
    console.log('📄 Saved to: template-output/welcome.html\n');

    // Test 2: Booking Confirmation Template
    console.log('2. Testing Booking Confirmation Template...');
    const bookingHtml = templateEngine.render('booking-confirmation', {
      clientName: 'Jane Smith',
      serviceTitle: 'House Cleaning',
      serviceCategory: 'Cleaning',
      bookingDate: 'Monday, January 15, 2024',
      bookingTime: '10:00 AM',
      duration: 3,
      totalAmount: 150,
      status: 'confirmed',
      address: {
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      specialInstructions: 'Please use eco-friendly cleaning products',
      providerName: 'Mike Johnson',
      providerInitials: 'MJ',
      providerRating: '4.8',
      providerReviewCount: '127',
      providerPhone: '+1 (555) 123-4567',
      bookingId: 'booking_123456',
      subject: 'Booking Confirmation - LocalPro'
    });
    
    fs.writeFileSync(path.join(outputDir, 'booking-confirmation.html'), bookingHtml);
    console.log('✅ Booking confirmation template rendered successfully');
    console.log('📄 Saved to: template-output/booking-confirmation.html\n');

    // Test 3: Order Confirmation Template
    console.log('3. Testing Order Confirmation Template...');
    const orderHtml = templateEngine.render('order-confirmation', {
      customerName: 'Alice Johnson',
      orderNumber: 'ORD-2024-001',
      orderDate: 'Tuesday, January 16, 2024',
      isSubscription: false,
      status: 'confirmed',
      totalAmount: 89.99,
      items: [
        {
          productName: 'Professional Cleaning Kit',
          quantity: 2,
          itemTotal: 59.98,
          productImage: 'https://via.placeholder.com/60x60/667eea/ffffff?text=Kit'
        },
        {
          productName: 'Microfiber Cloths (Pack of 10)',
          quantity: 1,
          itemTotal: 29.99,
          productImage: 'https://via.placeholder.com/60x60/667eea/ffffff?text=Cloth'
        }
      ],
      shippingAddress: {
        name: 'Alice Johnson',
        street: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      },
      estimatedDelivery: 'Friday, January 19, 2024',
      orderId: 'order_123456',
      subject: 'Order Confirmation - LocalPro'
    });
    
    fs.writeFileSync(path.join(outputDir, 'order-confirmation.html'), orderHtml);
    console.log('✅ Order confirmation template rendered successfully');
    console.log('📄 Saved to: template-output/order-confirmation.html\n');

    // Test 4: Loan Approval Template
    console.log('4. Testing Loan Approval Template...');
    const loanHtml = templateEngine.render('loan-approval', {
      borrowerName: 'Robert Wilson',
      loanType: 'Business Expansion Loan',
      approvedAmount: 15000,
      interestRate: 8.5,
      loanDuration: 24,
      monthlyPayment: 678.50,
      firstPaymentDate: 'Wednesday, February 15, 2024',
      loanPurpose: 'Equipment purchase and business expansion',
      conditions: [
        'Maintain current business operations',
        'Provide quarterly financial statements',
        'Keep business insurance current'
      ],
      paymentMethod: 'Bank Transfer',
      paymentDueDate: 15,
      lateFee: 25,
      loanId: 'loan_123456',
      notes: 'Congratulations on your loan approval! Please review all terms carefully.',
      subject: 'Loan Approved - LocalPro Finance'
    });
    
    fs.writeFileSync(path.join(outputDir, 'loan-approval.html'), loanHtml);
    console.log('✅ Loan approval template rendered successfully');
    console.log('📄 Saved to: template-output/loan-approval.html\n');

    // Test 5: Subscription Order Template
    console.log('5. Testing Subscription Order Template...');
    const subscriptionHtml = templateEngine.render('order-confirmation', {
      customerName: 'Sarah Davis',
      orderNumber: 'SUB-2024-001',
      orderDate: 'Wednesday, January 17, 2024',
      isSubscription: true,
      status: 'confirmed',
      totalAmount: 49.99,
      items: [
        {
          productName: 'Monthly Cleaning Supplies Kit',
          quantity: 1,
          itemTotal: 49.99,
          productImage: 'https://via.placeholder.com/60x60/667eea/ffffff?text=Kit'
        }
      ],
      subscriptionDetails: {
        frequency: 'monthly',
        nextDelivery: 'Saturday, February 17, 2024',
        isActive: true
      },
      subscriptionKit: {
        name: 'Professional Cleaning Monthly Kit'
      },
      shippingAddress: {
        name: 'Sarah Davis',
        street: '789 Pine Street',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA'
      },
      estimatedDelivery: 'Saturday, January 20, 2024',
      orderId: 'subscription_123456',
      subject: 'Subscription Confirmation - LocalPro'
    });
    
    fs.writeFileSync(path.join(outputDir, 'subscription-confirmation.html'), subscriptionHtml);
    console.log('✅ Subscription confirmation template rendered successfully');
    console.log('📄 Saved to: template-output/subscription-confirmation.html\n');

    console.log('🎉 All email templates tested successfully!');
    console.log('\n📋 Template Summary:');
    console.log('✅ Welcome Email - Professional onboarding experience');
    console.log('✅ Booking Confirmation - Detailed service booking info');
    console.log('✅ Order Confirmation - Product order details');
    console.log('✅ Loan Approval - Financial service notifications');
    console.log('✅ Subscription Confirmation - Recurring order management');
    
    console.log('\n📁 Generated Files:');
    console.log('📄 template-output/welcome.html');
    console.log('📄 template-output/booking-confirmation.html');
    console.log('📄 template-output/order-confirmation.html');
    console.log('📄 template-output/loan-approval.html');
    console.log('📄 template-output/subscription-confirmation.html');
    
    console.log('\n💡 Features:');
    console.log('🎨 Responsive design that works on all devices');
    console.log('🎯 Professional branding with LocalPro colors');
    console.log('📱 Mobile-optimized layouts');
    console.log('🔄 Dynamic content with conditional sections');
    console.log('🛡️ Fallback HTML for error handling');
    console.log('⚡ Template caching for performance');

  } catch (error) {
    console.error('❌ Error testing templates:', error);
  }
}

// Run the test
testEmailTemplates().catch(console.error);

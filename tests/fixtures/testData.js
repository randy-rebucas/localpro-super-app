/**
 * Test fixtures - Common test data for consistent testing
 */

const testUsers = {
  client: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'client@test.com',
    password: 'password123',
    phoneNumber: '+1234567890',
    role: 'client',
    isVerified: true
  },
  
  provider: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'provider@test.com',
    password: 'password123',
    phoneNumber: '+1234567891',
    role: 'provider',
    isVerified: true,
    businessName: 'Smith Services',
    businessAddress: '123 Business St',
    businessPhone: '+1234567892'
  },
  
  admin: {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'password123',
    phoneNumber: '+1234567893',
    role: 'admin',
    isVerified: true
  }
};

const testServices = {
  cleaning: {
    title: 'House Cleaning Service',
    description: 'Professional house cleaning service',
    category: 'cleaning',
    subcategory: 'house-cleaning',
    price: 150,
    duration: 120,
    location: {
      address: '123 Service St',
      coordinates: { lat: 14.5995, lng: 120.9842 }
    },
    isActive: true
  },
  
  plumbing: {
    title: 'Emergency Plumbing',
    description: '24/7 emergency plumbing services',
    category: 'plumbing',
    subcategory: 'emergency',
    price: 200,
    duration: 90,
    location: {
      address: '456 Plumbing Ave',
      coordinates: { lat: 14.5996, lng: 120.9843 }
    },
    isActive: true
  },
  
  electrical: {
    title: 'Electrical Installation',
    description: 'Professional electrical installation and repair',
    category: 'electrical',
    subcategory: 'installation',
    price: 300,
    duration: 180,
    location: {
      address: '789 Electric Blvd',
      coordinates: { lat: 14.5997, lng: 120.9844 }
    },
    isActive: true
  }
};

const testBookings = {
  pending: {
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    status: 'pending',
    totalAmount: 150,
    location: {
      address: '123 Client Address',
      coordinates: { lat: 14.5995, lng: 120.9842 }
    },
    notes: 'Please call before arriving'
  },
  
  confirmed: {
    scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
    status: 'confirmed',
    totalAmount: 200,
    location: {
      address: '456 Client Address',
      coordinates: { lat: 14.5996, lng: 120.9843 }
    },
    notes: 'Gate code: 1234'
  },
  
  completed: {
    scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    status: 'completed',
    totalAmount: 150,
    location: {
      address: '789 Client Address',
      coordinates: { lat: 14.5997, lng: 120.9844 }
    },
    notes: 'Service completed successfully'
  }
};

const testJobs = {
  fullTime: {
    title: 'Senior Software Developer',
    description: 'Looking for an experienced software developer',
    company: 'Tech Corp',
    location: 'Manila, Philippines',
    salary: '80000-120000',
    type: 'full-time',
    category: 'technology',
    requirements: [
      '5+ years experience',
      'Node.js expertise',
      'React knowledge',
      'MongoDB experience'
    ],
    isActive: true
  },
  
  partTime: {
    title: 'Marketing Assistant',
    description: 'Part-time marketing assistant needed',
    company: 'Marketing Inc',
    location: 'Makati, Philippines',
    salary: '25000-35000',
    type: 'part-time',
    category: 'marketing',
    requirements: [
      'Marketing degree',
      'Social media experience',
      'Good communication skills'
    ],
    isActive: true
  }
};

const testSubscriptionPlans = {
  basic: {
    name: 'Basic Plan',
    description: 'Basic subscription plan',
    price: 19.99,
    duration: 30,
    features: [
      'Basic service listings',
      'Email support',
      'Standard analytics'
    ],
    isActive: true
  },
  
  premium: {
    name: 'Premium Plan',
    description: 'Premium subscription plan',
    price: 49.99,
    duration: 30,
    features: [
      'Unlimited service listings',
      'Priority support',
      'Advanced analytics',
      'Featured listings'
    ],
    isActive: true
  }
};

const testPayments = {
  paypal: {
    amount: 150.00,
    currency: 'PHP',
    method: 'paypal',
    status: 'pending',
    description: 'Service payment'
  },
  
  paymaya: {
    amount: 200.00,
    currency: 'PHP',
    method: 'paymaya',
    status: 'pending',
    description: 'Service payment'
  }
};

const testReviews = {
  positive: {
    rating: 5,
    comment: 'Excellent service! Highly recommended.',
    isVerified: true
  },
  
  negative: {
    rating: 2,
    comment: 'Service was below expectations.',
    isVerified: true
  },
  
  neutral: {
    rating: 3,
    comment: 'Average service, could be better.',
    isVerified: true
  }
};

module.exports = {
  testUsers,
  testServices,
  testBookings,
  testJobs,
  testSubscriptionPlans,
  testPayments,
  testReviews
};

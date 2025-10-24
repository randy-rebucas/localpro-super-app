const { SubscriptionPlan } = require('../models/LocalProPlus');

const defaultPlans = [
  {
    name: 'Basic',
    description: 'Perfect for individual service providers getting started',
    price: {
      monthly: 9.99,
      yearly: 99.99,
      currency: 'USD'
    },
    features: [
      {
        name: 'service_creation',
        description: 'Create and manage services',
        included: true,
        limit: 5,
        unit: 'per_month'
      },
      {
        name: 'booking_management',
        description: 'Manage bookings and appointments',
        included: true,
        limit: 20,
        unit: 'per_month'
      },
      {
        name: 'basic_analytics',
        description: 'Basic performance analytics',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'email_support',
        description: 'Email support',
        included: true,
        limit: null,
        unit: 'unlimited'
      }
    ],
    limits: {
      maxServices: 5,
      maxBookings: 20,
      maxProviders: 1,
      maxStorage: 100, // 100MB
      maxApiCalls: 1000
    },
    benefits: [
      'Up to 5 services',
      '20 bookings per month',
      'Basic analytics',
      'Email support',
      'Mobile app access'
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 1
  },
  {
    name: 'Standard',
    description: 'Ideal for growing service businesses',
    price: {
      monthly: 19.99,
      yearly: 199.99,
      currency: 'USD'
    },
    features: [
      {
        name: 'service_creation',
        description: 'Create and manage services',
        included: true,
        limit: 15,
        unit: 'per_month'
      },
      {
        name: 'booking_management',
        description: 'Manage bookings and appointments',
        included: true,
        limit: 100,
        unit: 'per_month'
      },
      {
        name: 'advanced_analytics',
        description: 'Advanced performance analytics',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'priority_support',
        description: 'Priority customer support',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'custom_branding',
        description: 'Custom branding options',
        included: true,
        limit: null,
        unit: 'unlimited'
      }
    ],
    limits: {
      maxServices: 15,
      maxBookings: 100,
      maxProviders: 3,
      maxStorage: 500, // 500MB
      maxApiCalls: 5000
    },
    benefits: [
      'Up to 15 services',
      '100 bookings per month',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'Team management (up to 3 providers)',
      'API access'
    ],
    isActive: true,
    isPopular: true,
    sortOrder: 2
  },
  {
    name: 'Premium',
    description: 'For established service businesses',
    price: {
      monthly: 39.99,
      yearly: 399.99,
      currency: 'USD'
    },
    features: [
      {
        name: 'service_creation',
        description: 'Create and manage services',
        included: true,
        limit: 50,
        unit: 'per_month'
      },
      {
        name: 'booking_management',
        description: 'Manage bookings and appointments',
        included: true,
        limit: 500,
        unit: 'per_month'
      },
      {
        name: 'advanced_analytics',
        description: 'Advanced performance analytics',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'priority_support',
        description: 'Priority customer support',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'custom_branding',
        description: 'Custom branding options',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'api_access',
        description: 'Full API access',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'white_label',
        description: 'White-label options',
        included: true,
        limit: null,
        unit: 'unlimited'
      }
    ],
    limits: {
      maxServices: 50,
      maxBookings: 500,
      maxProviders: 10,
      maxStorage: 2000, // 2GB
      maxApiCalls: 20000
    },
    benefits: [
      'Up to 50 services',
      '500 bookings per month',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'Team management (up to 10 providers)',
      'Full API access',
      'White-label options',
      'Advanced integrations'
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 3
  },
  {
    name: 'Enterprise',
    description: 'For large organizations and agencies',
    price: {
      monthly: 99.99,
      yearly: 999.99,
      currency: 'USD'
    },
    features: [
      {
        name: 'service_creation',
        description: 'Create and manage services',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'booking_management',
        description: 'Manage bookings and appointments',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'advanced_analytics',
        description: 'Advanced performance analytics',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'priority_support',
        description: 'Priority customer support',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'custom_branding',
        description: 'Custom branding options',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'api_access',
        description: 'Full API access',
        included: true,
        limit: null,
        unit: 'unlimited'
      },
      {
        name: 'white_label',
        description: 'White-label options',
        included: true,
        limit: null,
        unit: 'unlimited'
      }
    ],
    limits: {
      maxServices: null, // unlimited
      maxBookings: null, // unlimited
      maxProviders: null, // unlimited
      maxStorage: 10000, // 10GB
      maxApiCalls: null // unlimited
    },
    benefits: [
      'Unlimited services',
      'Unlimited bookings',
      'Advanced analytics',
      'Dedicated support',
      'Custom branding',
      'Unlimited team members',
      'Full API access',
      'White-label options',
      'Advanced integrations',
      'Custom integrations',
      'SLA guarantee'
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 4
  }
];

const seedSubscriptionPlans = async () => {
  try {
    console.log('🌱 Seeding subscription plans...');

    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log('✅ Cleared existing subscription plans');

    // Create default plans
    const createdPlans = await SubscriptionPlan.insertMany(defaultPlans);
    console.log(`✅ Created ${createdPlans.length} subscription plans`);

    // Log created plans
    createdPlans.forEach(plan => {
      console.log(`   📋 ${plan.name}: $${plan.price.monthly}/month, $${plan.price.yearly}/year`);
    });

    return createdPlans;
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  }
};

const clearSubscriptionPlans = async () => {
  try {
    console.log('🧹 Clearing subscription plans...');
    await SubscriptionPlan.deleteMany({});
    console.log('✅ Cleared all subscription plans');
  } catch (error) {
    console.error('❌ Error clearing subscription plans:', error);
    throw error;
  }
};

module.exports = {
  seedSubscriptionPlans,
  clearSubscriptionPlans,
  defaultPlans
};

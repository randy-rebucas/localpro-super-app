const JobCategory = require('../models/JobCategory');
const logger = require('../config/logger');

const defaultJobCategories = [
  {
    name: 'Technology',
    description: 'Software development, IT support, cybersecurity, and technology-related positions',
    displayOrder: 1,
    metadata: {
      icon: '💻',
      color: '#3B82F6',
      tags: ['software', 'IT', 'developer', 'programmer', 'tech']
    }
  },
  {
    name: 'Healthcare',
    description: 'Medical, nursing, healthcare administration, and health services positions',
    displayOrder: 2,
    metadata: {
      icon: '🏥',
      color: '#EF4444',
      tags: ['medical', 'nurse', 'doctor', 'health', 'hospital']
    }
  },
  {
    name: 'Education',
    description: 'Teaching, training, academic, and educational support positions',
    displayOrder: 3,
    metadata: {
      icon: '📚',
      color: '#10B981',
      tags: ['teacher', 'instructor', 'trainer', 'academic', 'education']
    }
  },
  {
    name: 'Finance',
    description: 'Accounting, banking, financial planning, and finance-related positions',
    displayOrder: 4,
    metadata: {
      icon: '💰',
      color: '#F59E0B',
      tags: ['accounting', 'banking', 'financial', 'analyst', 'finance']
    }
  },
  {
    name: 'Marketing',
    description: 'Digital marketing, advertising, brand management, and marketing communications',
    displayOrder: 5,
    metadata: {
      icon: '📢',
      color: '#8B5CF6',
      tags: ['advertising', 'branding', 'social media', 'SEO', 'marketing']
    }
  },
  {
    name: 'Sales',
    description: 'Sales representative, account manager, business development, and sales support positions',
    displayOrder: 6,
    metadata: {
      icon: '📞',
      color: '#EC4899',
      tags: ['sales rep', 'account manager', 'BD', 'sales executive', 'sales']
    }
  },
  {
    name: 'Customer Service',
    description: 'Customer support, call center, client relations, and customer care positions',
    displayOrder: 7,
    metadata: {
      icon: '🎧',
      color: '#06B6D4',
      tags: ['support', 'call center', 'client relations', 'customer care', 'CSR']
    }
  },
  {
    name: 'Human Resources',
    description: 'HR management, recruitment, talent acquisition, and people operations',
    displayOrder: 8,
    metadata: {
      icon: '👥',
      color: '#6366F1',
      tags: ['recruitment', 'talent', 'HR', 'people ops', 'hiring']
    }
  },
  {
    name: 'Operations',
    description: 'Operations management, logistics, supply chain, and process improvement',
    displayOrder: 9,
    metadata: {
      icon: '⚙️',
      color: '#64748B',
      tags: ['logistics', 'supply chain', 'operations', 'process', 'ops']
    }
  },
  {
    name: 'Design',
    description: 'Graphic design, UI/UX design, web design, and creative design positions',
    displayOrder: 10,
    metadata: {
      icon: '🎨',
      color: '#F97316',
      tags: ['graphic design', 'UI/UX', 'web design', 'creative', 'designer']
    }
  },
  {
    name: 'Engineering',
    description: 'Mechanical, electrical, civil, and other engineering disciplines',
    displayOrder: 11,
    metadata: {
      icon: '🔧',
      color: '#14B8A6',
      tags: ['mechanical', 'electrical', 'civil', 'engineer', 'engineering']
    }
  },
  {
    name: 'Construction',
    description: 'Construction workers, project managers, site supervisors, and tradespeople',
    displayOrder: 12,
    metadata: {
      icon: '🏗️',
      color: '#DC2626',
      tags: ['construction', 'builder', 'contractor', 'trades', 'construction worker']
    }
  },
  {
    name: 'Maintenance',
    description: 'Facility maintenance, equipment repair, and maintenance technician positions',
    displayOrder: 13,
    metadata: {
      icon: '🔨',
      color: '#7C3AED',
      tags: ['maintenance', 'repair', 'technician', 'facility', 'maintenance worker']
    }
  },
  {
    name: 'Cleaning',
    description: 'Housekeeping, janitorial, commercial cleaning, and cleaning services',
    displayOrder: 14,
    metadata: {
      icon: '🧹',
      color: '#059669',
      tags: ['housekeeping', 'janitor', 'cleaner', 'cleaning services', 'custodial']
    }
  },
  {
    name: 'Security',
    description: 'Security guard, security officer, loss prevention, and security services',
    displayOrder: 15,
    metadata: {
      icon: '🛡️',
      color: '#1E40AF',
      tags: ['security guard', 'security officer', 'loss prevention', 'security', 'guard']
    }
  },
  {
    name: 'Transportation',
    description: 'Driver, delivery, logistics, transportation, and fleet management positions',
    displayOrder: 16,
    metadata: {
      icon: '🚚',
      color: '#B91C1C',
      tags: ['driver', 'delivery', 'logistics', 'transport', 'fleet']
    }
  },
  {
    name: 'Food Service',
    description: 'Chef, cook, server, bartender, and food service industry positions',
    displayOrder: 17,
    metadata: {
      icon: '🍽️',
      color: '#C2410C',
      tags: ['chef', 'cook', 'server', 'bartender', 'restaurant', 'food service']
    }
  },
  {
    name: 'Retail',
    description: 'Retail sales associate, cashier, store manager, and retail positions',
    displayOrder: 18,
    metadata: {
      icon: '🛍️',
      color: '#BE185D',
      tags: ['retail', 'cashier', 'sales associate', 'store manager', 'retail worker']
    }
  },
  {
    name: 'Hospitality',
    description: 'Hotel staff, concierge, event coordinator, and hospitality service positions',
    displayOrder: 19,
    metadata: {
      icon: '🏨',
      color: '#0D9488',
      tags: ['hotel', 'concierge', 'event coordinator', 'hospitality', 'tourism']
    }
  },
  {
    name: 'Other',
    description: 'Other job categories and miscellaneous positions',
    displayOrder: 20,
    metadata: {
      icon: '📋',
      color: '#6B7280',
      tags: ['other', 'miscellaneous', 'general']
    }
  }
];

const seedJobCategories = async () => {
  try {
    logger.info('🌱 Seeding job categories...');

    // Use updateOne with upsert to avoid duplicates
    for (const category of defaultJobCategories) {
      await JobCategory.updateOne(
        { name: category.name },
        { $set: { ...category, isActive: true } },
        { upsert: true }
      );
    }

    const categories = await JobCategory.find({}).sort({ displayOrder: 1 });
    logger.info(`✅ Seeded ${categories.length} job categories`);

    categories.forEach(cat => {
      logger.info(`   📋 ${cat.metadata?.icon || '📌'} ${cat.name} - ${cat.description || 'No description'}`);
    });

    return categories;
  } catch (error) {
    console.error('❌ Error seeding job categories:', error);
    throw error;
  }
};

const seedAll = async () => {
  try {
    logger.info('🌱 Starting seed process for job categories...');
    
    await seedJobCategories();
    
    logger.info('✅ Seed process completed successfully!');
  } catch (error) {
    console.error('❌ Error in seed process:', error);
    throw error;
  }
};

const clearAll = async () => {
  try {
    logger.info('🧹 Clearing job categories...');
    await JobCategory.deleteMany({});
    logger.info('✅ Cleared all job categories');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};

module.exports = {
  seedJobCategories,
  seedAll,
  clearAll,
  defaultJobCategories
};


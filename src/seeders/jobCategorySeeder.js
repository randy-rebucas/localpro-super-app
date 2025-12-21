const JobCategory = require('../models/JobCategory');
const logger = require('../config/logger');

const defaultJobCategories = [
  {
    name: 'Home & Property Services',
    description: 'Plumbing, electrical, HVAC, appliance repair, carpentry, painting, roofing, masonry, glass works, pest control, and locksmith services. Aligned with BPLO, Building Office, and Consumer Protection.',
    displayOrder: 1,
    metadata: {
      icon: '🏠',
      color: '#3B82F6',
      tags: ['plumbing', 'electrical', 'hvac', 'appliance repair', 'carpentry', 'painting', 'roofing', 'masonry', 'pest control', 'locksmith', 'home services', 'property maintenance'],
      lguAlignment: ['BPLO', 'Building Office', 'Consumer Protection'],
      pricing: 'Per job / Quotation-based'
    }
  },
  {
    name: 'Cleaning & Sanitation Services',
    description: 'Residential and commercial cleaning, post-construction cleaning, disinfection, septic tank cleaning, garbage collection, and laundry services. Aligned with City Health Office, Environment Office, and Tourism.',
    displayOrder: 2,
    metadata: {
      icon: '🧹',
      color: '#10B981',
      tags: ['house cleaning', 'office cleaning', 'commercial cleaning', 'disinfection', 'sanitation', 'septic tank', 'garbage collection', 'laundry', 'dry cleaning'],
      lguAlignment: ['City Health Office', 'Environment Office', 'Tourism'],
      pricing: 'Per hour / Contract'
    }
  },
  {
    name: 'Construction & Skilled Trades',
    description: 'General construction workers, foremen, welders, heavy equipment operators, scaffolding installers, safety officers, and draftsmen. Aligned with TESDA, DPWH, and LEDIPO. Requires TESDA NC I–IV certification.',
    displayOrder: 3,
    metadata: {
      icon: '🏗️',
      color: '#DC2626',
      tags: ['construction worker', 'foreman', 'site supervisor', 'welder', 'fabricator', 'equipment operator', 'scaffolding', 'safety officer', 'draftsman', 'CAD technician'],
      lguAlignment: ['TESDA', 'DPWH', 'LEDIPO'],
      certification: 'TESDA NC I–IV'
    }
  },
  {
    name: 'Transport, Logistics & Delivery',
    description: 'Motorcycle couriers, delivery drivers, moving services, hauling, towing, warehouse helpers, fleet drivers, and ride-hailing partners. Aligned with Traffic Office and PESO.',
    displayOrder: 4,
    metadata: {
      icon: '🚚',
      color: '#F59E0B',
      tags: ['courier', 'delivery driver', 'motorcycle rider', 'moving services', 'hauling', 'towing', 'warehouse', 'fleet driver', 'ride-hailing', 'logistics'],
      lguAlignment: ['Traffic Office', 'PESO'],
      pricing: 'Per trip / Distance-based'
    }
  },
  {
    name: 'Personal & Lifestyle Services',
    description: 'Barbers, hairstylists, makeup artists, massage therapists, nail technicians, fitness trainers, yoga coaches, pet groomers, and pet sitters. Aligned with Tourism Office and Health Office.',
    displayOrder: 5,
    metadata: {
      icon: '💅',
      color: '#EC4899',
      tags: ['barber', 'hairstylist', 'makeup artist', 'massage therapist', 'nail technician', 'fitness trainer', 'yoga', 'wellness coach', 'pet groomer', 'pet sitter', 'dog walker'],
      lguAlignment: ['Tourism Office', 'Health Office'],
      pricing: 'Per session'
    }
  },
  {
    name: 'Business & Office Support Services',
    description: 'Virtual assistants, bookkeepers, accounting assistants, payroll staff, office administrators, HR assistants, call center agents, and data encoders. Aligned with DTI, LEDIPO, and PESO.',
    displayOrder: 6,
    metadata: {
      icon: '💼',
      color: '#6366F1',
      tags: ['virtual assistant', 'bookkeeper', 'accounting', 'payroll', 'office administrator', 'HR assistant', 'call center', 'customer support', 'data encoder'],
      lguAlignment: ['DTI', 'LEDIPO', 'PESO'],
      pricing: 'Hourly / Monthly'
    }
  },
  {
    name: 'IT, Digital & Creative Services',
    description: 'IT support technicians, network installers, CCTV technicians, web developers, mobile app developers, graphic designers, video editors, digital marketing specialists, and social media managers. Aligned with DICT and Smart City Programs.',
    displayOrder: 7,
    metadata: {
      icon: '💻',
      color: '#8B5CF6',
      tags: ['IT support', 'network installer', 'CCTV', 'web developer', 'mobile app developer', 'graphic designer', 'video editor', 'digital marketing', 'social media manager'],
      lguAlignment: ['DICT', 'Smart City Programs'],
      pricing: 'Project-based / Retainer'
    }
  },
  {
    name: 'Education, Training & Coaching',
    description: 'Academic tutors, technical skills trainers, language instructors, computer literacy trainers, exam review coaches, and corporate skills trainers. Aligned with PESO, TESDA, and DepEd.',
    displayOrder: 8,
    metadata: {
      icon: '📚',
      color: '#10B981',
      tags: ['tutor', 'academic tutor', 'technical trainer', 'language instructor', 'computer literacy', 'exam review', 'corporate trainer', 'coaching'],
      lguAlignment: ['PESO', 'TESDA', 'DepEd'],
      pricing: 'Per session / Package'
    }
  },
  {
    name: 'Healthcare & Caregiving (Non-Clinical)',
    description: 'Caregivers, elderly care assistants, home nurse assistants, physical therapy assistants, childcare providers, babysitters, medical transcriptionists, and health aides. Aligned with City Health Office and Social Welfare. Subject to local regulation and verification.',
    displayOrder: 9,
    metadata: {
      icon: '🏥',
      color: '#EF4444',
      tags: ['caregiver', 'elderly care', 'home nurse', 'physical therapy', 'childcare', 'babysitter', 'medical transcriptionist', 'health aide'],
      lguAlignment: ['City Health Office', 'Social Welfare'],
      note: 'Subject to local regulation and verification'
    }
  },
  {
    name: 'Events, Hospitality & Tourism',
    description: 'Event coordinators, event crew, caterers, cooks, chefs, bartenders, hotel housekeeping staff, tour guides, photographers, and videographers. Aligned with Tourism Office and LGU Events.',
    displayOrder: 10,
    metadata: {
      icon: '🎉',
      color: '#0D9488',
      tags: ['event coordinator', 'event crew', 'caterer', 'cook', 'chef', 'bartender', 'hotel housekeeping', 'tour guide', 'photographer', 'videographer'],
      lguAlignment: ['Tourism Office', 'LGU Events'],
      pricing: 'Per event'
    }
  },
  {
    name: 'Sales, Marketing & Field Promotion',
    description: 'Sales agents, brand promoters, field marketing staff, merchandisers, real estate sales associates, and insurance agents. Aligned with MSME Development.',
    displayOrder: 11,
    metadata: {
      icon: '📢',
      color: '#F97316',
      tags: ['sales agent', 'brand promoter', 'field marketing', 'merchandiser', 'real estate', 'insurance agent', 'sales'],
      lguAlignment: ['MSME Development'],
      pricing: 'Commission-based'
    }
  },
  {
    name: 'Emergency, Safety & Public Support',
    description: 'Disaster response volunteers, emergency repair technicians, safety marshals, traffic aides, and utility restoration crew. Aligned with DRRMO and City Operations. Optional extension category.',
    displayOrder: 12,
    metadata: {
      icon: '🚨',
      color: '#DC2626',
      tags: ['disaster response', 'emergency repair', 'safety marshal', 'traffic aide', 'utility restoration', 'emergency services'],
      lguAlignment: ['DRRMO', 'City Operations'],
      note: 'Optional Extension Category'
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


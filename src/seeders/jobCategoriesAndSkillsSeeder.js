const JobCategory = require('../models/JobCategory');
const ProviderSkill = require('../models/ProviderSkill');
const ServiceCategory = require('../models/ServiceCategory');
const logger = require('../config/logger');

const defaultJobCategories = [
  {
    name: 'Construction & Building Trades',
    description: 'Jobs related to construction, building, and infrastructure development',
    displayOrder: 1,
    isActive: true,
    metadata: {
      icon: 'construction',
      color: '#FF6B35',
      tags: ['construction', 'building', 'trades']
    }
  },
  {
    name: 'Mechanical & Industrial Trades',
    description: 'Jobs in mechanical engineering, manufacturing, and industrial operations',
    displayOrder: 2,
    isActive: true,
    metadata: {
      icon: 'mechanical',
      color: '#4ECDC4',
      tags: ['mechanical', 'industrial', 'manufacturing']
    }
  },
  {
    name: 'Technology & Electrical Trades',
    description: 'Jobs in technology, electronics, and electrical systems',
    displayOrder: 3,
    isActive: true,
    metadata: {
      icon: 'technology',
      color: '#45B7D1',
      tags: ['technology', 'electrical', 'IT']
    }
  },
  {
    name: 'Service & Technical Trades',
    description: 'Service-oriented jobs and technical support roles',
    displayOrder: 4,
    isActive: true,
    metadata: {
      icon: 'service',
      color: '#96CEB4',
      tags: ['service', 'technical', 'support']
    }
  },
  {
    name: 'Transportation & Logistics',
    description: 'Jobs in transportation, shipping, and logistics management',
    displayOrder: 5,
    isActive: true,
    metadata: {
      icon: 'transportation',
      color: '#FFEAA7',
      tags: ['transportation', 'logistics', 'shipping']
    }
  },
  {
    name: 'Health & Safety Trades',
    description: 'Jobs in healthcare, safety, and emergency services',
    displayOrder: 6,
    isActive: true,
    metadata: {
      icon: 'health',
      color: '#DDA0DD',
      tags: ['health', 'safety', 'emergency']
    }
  },
  {
    name: 'Beauty Services',
    description: 'Jobs in beauty, cosmetics, and personal care services',
    displayOrder: 7,
    isActive: true,
    metadata: {
      icon: 'beauty',
      color: '#FFB6C1',
      tags: ['beauty', 'cosmetics', 'personal-care']
    }
  },
  {
    name: 'Cleaning Services',
    description: 'Jobs in cleaning, maintenance, and janitorial services',
    displayOrder: 8,
    isActive: true,
    metadata: {
      icon: 'cleaning',
      color: '#87CEEB',
      tags: ['cleaning', 'maintenance', 'janitorial']
    }
  }
];

const defaultProviderSkills = [
  // Construction & Building Trades (1-15)
  { name: 'Carpenter', category: 'construction', displayOrder: 1 },
  { name: 'Electrician', category: 'construction', displayOrder: 2 },
  { name: 'Plumber', category: 'construction', displayOrder: 3 },
  { name: 'Welder', category: 'construction', displayOrder: 4 },
  { name: 'Heavy Equipment Operator', category: 'construction', displayOrder: 5 },
  { name: 'HVAC Technician', category: 'construction', displayOrder: 6 },
  { name: 'Roofer', category: 'construction', displayOrder: 7 },
  { name: 'Drywaller', category: 'construction', displayOrder: 8 },
  { name: 'Sheet Metal Worker', category: 'construction', displayOrder: 9 },
  { name: 'Glazier', category: 'construction', displayOrder: 10 },
  { name: 'Mason (Panday / Masonero)', category: 'construction', displayOrder: 11 },
  { name: 'Painter (Construction)', category: 'construction', displayOrder: 12 },
  { name: 'Tiler (Tile Setter)', category: 'construction', displayOrder: 13 },
  { name: 'Steelman (Rebar Worker)', category: 'construction', displayOrder: 14 },
  { name: 'Laborer / Helper', category: 'construction', displayOrder: 15 },
  
  // Mechanical & Industrial Trades (16-24)
  { name: 'Machinist', category: 'mechanical', displayOrder: 16 },
  { name: 'Millwright', category: 'mechanical', displayOrder: 17 },
  { name: 'Tool and Die Maker', category: 'mechanical', displayOrder: 18 },
  { name: 'CNC Operator', category: 'mechanical', displayOrder: 19 },
  { name: 'Automotive Technician', category: 'mechanical', displayOrder: 20 },
  { name: 'Diesel Mechanic', category: 'mechanical', displayOrder: 21 },
  { name: 'Aircraft Maintenance Technician', category: 'mechanical', displayOrder: 22 },
  { name: 'Elevator Technician', category: 'mechanical', displayOrder: 23 },
  { name: 'Boiler Operator', category: 'mechanical', displayOrder: 24 },
  
  // Technology & Electrical Trades (25-29)
  { name: 'Electronics Technician', category: 'technology', displayOrder: 25 },
  { name: 'Line Installer/Repairer', category: 'technology', displayOrder: 26 },
  { name: 'IT Technician/Support Specialist', category: 'technology', displayOrder: 27 },
  { name: 'Network Technician', category: 'technology', displayOrder: 28 },
  { name: 'Telecommunications Technician', category: 'technology', displayOrder: 29 },
  
  // Service & Technical Trades (30-36)
  { name: 'Chef/Cook', category: 'service', displayOrder: 30 },
  { name: 'Baker/Pastry Chef', category: 'service', displayOrder: 31 },
  { name: 'Butcher/Meat Cutter', category: 'service', displayOrder: 32 },
  { name: 'Cosmetologist', category: 'service', displayOrder: 33 },
  { name: 'Tattoo Artist', category: 'service', displayOrder: 34 },
  { name: 'Tailor/Seamstress', category: 'service', displayOrder: 35 },
  { name: 'Pet Groomer', category: 'service', displayOrder: 36 },
  
  // Transportation & Logistics (37-41)
  { name: 'Commercial Driver', category: 'transportation', displayOrder: 37 },
  { name: 'Crane Operator', category: 'transportation', displayOrder: 38 },
  { name: 'Forklift Operator', category: 'transportation', displayOrder: 39 },
  { name: 'Ship Captain or Marine Engineer', category: 'transportation', displayOrder: 40 },
  { name: 'Train Conductor/Engineer', category: 'transportation', displayOrder: 41 },
  
  // Health & Safety Trades (42-47)
  { name: 'Paramedic/EMT', category: 'health_safety', displayOrder: 42 },
  { name: 'Medical Laboratory Technician', category: 'health_safety', displayOrder: 43 },
  { name: 'Dental Technician', category: 'health_safety', displayOrder: 44 },
  { name: 'Pharmacy Technician', category: 'health_safety', displayOrder: 45 },
  { name: 'Firefighter', category: 'health_safety', displayOrder: 46 },
  { name: 'Security System Installer', category: 'health_safety', displayOrder: 47 },
  
  // Beauty Services (48-54)
  { name: 'Hairdresser / Barber', category: 'beauty', displayOrder: 48 },
  { name: 'Makeup Artist', category: 'beauty', displayOrder: 49 },
  { name: 'Nail Technician / Manicurist / Pedicurist', category: 'beauty', displayOrder: 50 },
  { name: 'Massage Therapist', category: 'beauty', displayOrder: 51 },
  { name: 'Esthetician', category: 'beauty', displayOrder: 52 },
  { name: 'Eyelash & Brow Technician', category: 'beauty', displayOrder: 53 },
  { name: 'Body Waxing Technician', category: 'beauty', displayOrder: 54 },
  
  // Cleaning Services (55-60)
  { name: 'Housekeeper / Kasambahay', category: 'cleaning', displayOrder: 55 },
  { name: 'Janitor / Utility Worker', category: 'cleaning', displayOrder: 56 },
  { name: 'Window Cleaner', category: 'cleaning', displayOrder: 57 },
  { name: 'Carpet & Upholstery Cleaner', category: 'cleaning', displayOrder: 58 },
  { name: 'Post-Construction Cleaner', category: 'cleaning', displayOrder: 59 },
  { name: 'Laundry Worker', category: 'cleaning', displayOrder: 60 }
];

const seedJobCategories = async () => {
  try {
    logger.info('🌱 Seeding job categories...');

    // Use updateOne with upsert to avoid duplicates
    for (const category of defaultJobCategories) {
      await JobCategory.updateOne(
        { name: category.name },
        { $set: category },
        { upsert: true }
      );
    }

    const categories = await JobCategory.find({});
    logger.info(`✅ Seeded ${categories.length} job categories`);

    categories.forEach(cat => {
      logger.info(`   📋 ${cat.name} (Order: ${cat.displayOrder})`);
    });

    return categories;
  } catch (error) {
    console.error('❌ Error seeding job categories:', error);
    throw error;
  }
};

const seedProviderSkills = async () => {
  try {
    logger.info('🌱 Seeding provider skills...');

    // Use updateOne with upsert to avoid duplicates
    for (const skill of defaultProviderSkills) {
      await ProviderSkill.updateOne(
        { name: skill.name },
        { $set: { ...skill, isActive: true } },
        { upsert: true }
      );
    }

    const skills = await ProviderSkill.find({});
    logger.info(`✅ Seeded ${skills.length} provider skills`);

    // Group by category for logging
    const skillsByCategory = {};
    skills.forEach(skill => {
      if (!skillsByCategory[skill.category]) {
        skillsByCategory[skill.category] = [];
      }
      skillsByCategory[skill.category].push(skill.name);
    });

    Object.keys(skillsByCategory).forEach(category => {
      logger.info(`   📋 ${category}: ${skillsByCategory[category].length} skills`);
    });

    return skills;
  } catch (error) {
    console.error('❌ Error seeding provider skills:', error);
    throw error;
  }
};

const defaultServiceCategories = [
  { key: 'cleaning', name: 'Cleaning Services', description: 'Professional cleaning services for homes and businesses', icon: '🧹', subcategories: ['residential_cleaning', 'commercial_cleaning', 'deep_cleaning', 'carpet_cleaning', 'window_cleaning', 'power_washing', 'post_construction_cleaning'], displayOrder: 1 },
  { key: 'plumbing', name: 'Plumbing Services', description: 'Plumbing repair, installation, and maintenance', icon: '🔧', subcategories: ['pipe_repair', 'installation', 'leak_repair', 'drain_cleaning', 'water_heater', 'sewer_services', 'emergency_plumbing'], displayOrder: 2 },
  { key: 'electrical', name: 'Electrical Services', description: 'Electrical work, repairs, and installations', icon: '⚡', subcategories: ['wiring', 'panel_upgrade', 'outlet_installation', 'lighting', 'electrical_repair', 'safety_inspection'], displayOrder: 3 },
  { key: 'moving', name: 'Moving Services', description: 'Residential and commercial moving services', icon: '📦', subcategories: ['local_moving', 'long_distance', 'packing', 'unpacking', 'storage', 'furniture_assembly'], displayOrder: 4 },
  { key: 'landscaping', name: 'Landscaping Services', description: 'Outdoor landscaping and yard maintenance', icon: '🌳', subcategories: ['lawn_care', 'garden_design', 'tree_services', 'irrigation', 'hardscaping', 'mulching'], displayOrder: 5 },
  { key: 'painting', name: 'Painting Services', description: 'Interior and exterior painting', icon: '🎨', subcategories: ['interior_painting', 'exterior_painting', 'cabinet_painting', 'deck_staining', 'wallpaper', 'texture_painting'], displayOrder: 6 },
  { key: 'carpentry', name: 'Carpentry Services', description: 'Woodwork and carpentry services', icon: '🪵', subcategories: ['furniture_repair', 'custom_build', 'cabinet_installation', 'trim_work', 'deck_building', 'shelving'], displayOrder: 7 },
  { key: 'flooring', name: 'Flooring Services', description: 'Floor installation and repair', icon: '🏠', subcategories: ['hardwood', 'tile', 'carpet', 'laminate', 'vinyl', 'floor_repair', 'refinishing'], displayOrder: 8 },
  { key: 'roofing', name: 'Roofing Services', description: 'Roof repair, installation, and maintenance', icon: '🏡', subcategories: ['roof_repair', 'roof_replacement', 'gutter_repair', 'roof_inspection', 'leak_repair', 'solar_installation'], displayOrder: 9 },
  { key: 'hvac', name: 'HVAC Services', description: 'Heating, ventilation, and air conditioning', icon: '❄️', subcategories: ['installation', 'repair', 'maintenance', 'duct_cleaning', 'thermostat_installation', 'air_quality'], displayOrder: 10 },
  { key: 'appliance_repair', name: 'Appliance Repair', description: 'Home appliance repair and maintenance', icon: '🔌', subcategories: ['refrigerator', 'washer_dryer', 'dishwasher', 'oven_range', 'microwave', 'garbage_disposal'], displayOrder: 11 },
  { key: 'locksmith', name: 'Locksmith Services', description: 'Lock installation, repair, and emergency services', icon: '🔐', subcategories: ['lock_installation', 'key_duplication', 'lockout_service', 'safe_services', 'access_control'], displayOrder: 12 },
  { key: 'handyman', name: 'Handyman Services', description: 'General repair and maintenance services', icon: '🔨', subcategories: ['general_repair', 'assembly', 'mounting', 'caulking', 'drywall_repair', 'fence_repair'], displayOrder: 13 },
  { key: 'home_security', name: 'Home Security', description: 'Security system installation and monitoring', icon: '🚨', subcategories: ['alarm_installation', 'camera_installation', 'smart_locks', 'motion_sensors', 'security_consultation'], displayOrder: 14 },
  { key: 'pool_maintenance', name: 'Pool Maintenance', description: 'Swimming pool cleaning and maintenance', icon: '🏊', subcategories: ['cleaning', 'chemical_balance', 'equipment_repair', 'winterization', 'pool_repair', 'opening_closing'], displayOrder: 15 },
  { key: 'pest_control', name: 'Pest Control', description: 'Pest elimination and prevention', icon: '🐛', subcategories: ['general_pest', 'termite_control', 'rodent_control', 'bed_bug', 'wildlife_removal', 'preventive_treatment'], displayOrder: 16 },
  { key: 'carpet_cleaning', name: 'Carpet Cleaning', description: 'Professional carpet and upholstery cleaning', icon: '🧼', subcategories: ['steam_cleaning', 'dry_cleaning', 'stain_removal', 'pet_odor', 'upholstery', 'area_rugs'], displayOrder: 17 },
  { key: 'window_cleaning', name: 'Window Cleaning', description: 'Window and glass cleaning services', icon: '🪟', subcategories: ['residential', 'commercial', 'interior_exterior', 'screen_cleaning', 'pressure_washing', 'storefront'], displayOrder: 18 },
  { key: 'gutter_cleaning', name: 'Gutter Cleaning', description: 'Gutter cleaning and maintenance', icon: '🌧️', subcategories: ['cleaning', 'repair', 'installation', 'leaf_removal', 'downspout_cleaning', 'gutter_guards'], displayOrder: 19 },
  { key: 'power_washing', name: 'Power Washing', description: 'Exterior surface pressure washing', icon: '💦', subcategories: ['driveway', 'siding', 'deck_patio', 'fence', 'roof', 'commercial'], displayOrder: 20 },
  { key: 'snow_removal', name: 'Snow Removal', description: 'Snow clearing and removal services', icon: '❄️', subcategories: ['driveway', 'sidewalk', 'commercial', 'roof', 'snow_plowing', 'ice_removal'], displayOrder: 21 },
  { key: 'other', name: 'Other Services', description: 'Other specialized services', icon: '📋', subcategories: [], displayOrder: 22 }
];

const seedServiceCategories = async () => {
  try {
    logger.info('🌱 Seeding service categories...');

    // Use updateOne with upsert to avoid duplicates
    for (const category of defaultServiceCategories) {
      await ServiceCategory.updateOne(
        { key: category.key },
        { $set: { ...category, isActive: true } },
        { upsert: true }
      );
    }

    const categories = await ServiceCategory.find({});
    logger.info(`✅ Seeded ${categories.length} service categories`);

    categories.forEach(cat => {
      logger.info(`   📋 ${cat.name} (${cat.key}) - ${cat.subcategories.length} subcategories`);
    });

    return categories;
  } catch (error) {
    console.error('❌ Error seeding service categories:', error);
    throw error;
  }
};

const seedAll = async () => {
  try {
    logger.info('🌱 Starting seed process for job categories, provider skills, and service categories...');
    
    await seedJobCategories();
    await seedProviderSkills();
    await seedServiceCategories();
    
    logger.info('✅ Seed process completed successfully!');
  } catch (error) {
    console.error('❌ Error in seed process:', error);
    throw error;
  }
};

const clearAll = async () => {
  try {
    logger.info('🧹 Clearing job categories, provider skills, and service categories...');
    await JobCategory.deleteMany({});
    await ProviderSkill.deleteMany({});
    await ServiceCategory.deleteMany({});
    logger.info('✅ Cleared all job categories, provider skills, and service categories');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};

module.exports = {
  seedJobCategories,
  seedProviderSkills,
  seedServiceCategories,
  seedAll,
  clearAll,
  defaultJobCategories,
  defaultProviderSkills,
  defaultServiceCategories
};


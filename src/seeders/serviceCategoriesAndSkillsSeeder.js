const ProviderSkill = require('../models/ProviderSkill');
const ServiceCategory = require('../models/ServiceCategory');
const logger = require('../config/logger');

const defaultProviderSkills = [
  // Construction & Building Trades -> mapped to various service categories
  { name: 'Carpenter', category: 'carpentry', displayOrder: 1 },
  { name: 'Electrician', category: 'electrical', displayOrder: 2 },
  { name: 'Plumber', category: 'plumbing', displayOrder: 3 },
  { name: 'Welder', category: 'handyman', displayOrder: 4 },
  { name: 'Heavy Equipment Operator', category: 'handyman', displayOrder: 5 },
  { name: 'HVAC Technician', category: 'hvac', displayOrder: 6 },
  { name: 'Roofer', category: 'roofing', displayOrder: 7 },
  { name: 'Drywaller', category: 'handyman', displayOrder: 8 },
  { name: 'Sheet Metal Worker', category: 'handyman', displayOrder: 9 },
  { name: 'Glazier', category: 'handyman', displayOrder: 10 },
  { name: 'Mason (Panday / Masonero)', category: 'handyman', displayOrder: 11 },
  { name: 'Painter (Construction)', category: 'painting', displayOrder: 12 },
  { name: 'Tiler (Tile Setter)', category: 'flooring', displayOrder: 13 },
  { name: 'Steelman (Rebar Worker)', category: 'handyman', displayOrder: 14 },
  { name: 'Laborer / Helper', category: 'handyman', displayOrder: 15 },
  
  // Mechanical & Industrial Trades
  { name: 'Machinist', category: 'handyman', displayOrder: 16 },
  { name: 'Millwright', category: 'handyman', displayOrder: 17 },
  { name: 'Tool and Die Maker', category: 'handyman', displayOrder: 18 },
  { name: 'CNC Operator', category: 'handyman', displayOrder: 19 },
  { name: 'Automotive Technician', category: 'appliance_repair', displayOrder: 20 },
  { name: 'Diesel Mechanic', category: 'appliance_repair', displayOrder: 21 },
  { name: 'Aircraft Maintenance Technician', category: 'appliance_repair', displayOrder: 22 },
  { name: 'Elevator Technician', category: 'handyman', displayOrder: 23 },
  { name: 'Boiler Operator', category: 'hvac', displayOrder: 24 },
  
  // Technology & Electrical Trades
  { name: 'Electronics Technician', category: 'electrical', displayOrder: 25 },
  { name: 'Line Installer/Repairer', category: 'electrical', displayOrder: 26 },
  { name: 'IT Technician/Support Specialist', category: 'home_security', displayOrder: 27 },
  { name: 'Network Technician', category: 'home_security', displayOrder: 28 },
  { name: 'Telecommunications Technician', category: 'electrical', displayOrder: 29 },
  
  // Service & Technical Trades
  { name: 'Chef/Cook', category: 'other', displayOrder: 30 },
  { name: 'Baker/Pastry Chef', category: 'other', displayOrder: 31 },
  { name: 'Butcher/Meat Cutter', category: 'other', displayOrder: 32 },
  { name: 'Cosmetologist', category: 'other', displayOrder: 33 },
  { name: 'Tattoo Artist', category: 'other', displayOrder: 34 },
  { name: 'Tailor/Seamstress', category: 'other', displayOrder: 35 },
  { name: 'Pet Groomer', category: 'other', displayOrder: 36 },
  
  // Transportation & Logistics
  { name: 'Commercial Driver', category: 'moving', displayOrder: 37 },
  { name: 'Crane Operator', category: 'moving', displayOrder: 38 },
  { name: 'Forklift Operator', category: 'moving', displayOrder: 39 },
  { name: 'Ship Captain or Marine Engineer', category: 'moving', displayOrder: 40 },
  { name: 'Train Conductor/Engineer', category: 'moving', displayOrder: 41 },
  
  // Health & Safety Trades
  { name: 'Paramedic/EMT', category: 'other', displayOrder: 42 },
  { name: 'Medical Laboratory Technician', category: 'other', displayOrder: 43 },
  { name: 'Dental Technician', category: 'other', displayOrder: 44 },
  { name: 'Pharmacy Technician', category: 'other', displayOrder: 45 },
  { name: 'Firefighter', category: 'other', displayOrder: 46 },
  { name: 'Security System Installer', category: 'home_security', displayOrder: 47 },
  
  // Beauty Services
  { name: 'Hairdresser / Barber', category: 'other', displayOrder: 48 },
  { name: 'Makeup Artist', category: 'other', displayOrder: 49 },
  { name: 'Nail Technician / Manicurist / Pedicurist', category: 'other', displayOrder: 50 },
  { name: 'Massage Therapist', category: 'other', displayOrder: 51 },
  { name: 'Esthetician', category: 'other', displayOrder: 52 },
  { name: 'Eyelash & Brow Technician', category: 'other', displayOrder: 53 },
  { name: 'Body Waxing Technician', category: 'other', displayOrder: 54 },
  
  // Cleaning Services
  { name: 'Housekeeper / Kasambahay', category: 'cleaning', displayOrder: 55 },
  { name: 'Janitor / Utility Worker', category: 'cleaning', displayOrder: 56 },
  { name: 'Window Cleaner', category: 'window_cleaning', displayOrder: 57 },
  { name: 'Carpet & Upholstery Cleaner', category: 'carpet_cleaning', displayOrder: 58 },
  { name: 'Post-Construction Cleaner', category: 'cleaning', displayOrder: 59 },
  { name: 'Laundry Worker', category: 'cleaning', displayOrder: 60 }
];

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

const seedProviderSkills = async () => {
  try {
    logger.info('🌱 Seeding provider skills...');

    // Get all service categories to map string values to ObjectIds
    const serviceCategories = await ServiceCategory.find({});
    const categoryMap = {};
    serviceCategories.forEach(cat => {
      categoryMap[cat.key] = cat._id;
    });

    // Use updateOne with upsert to avoid duplicates
    for (const skill of defaultProviderSkills) {
      // Map string category to ServiceCategory ObjectId
      const categoryId = categoryMap[skill.category];
      if (!categoryId) {
        logger.warn(`⚠️  ServiceCategory not found: ${skill.category} for skill: ${skill.name}`);
        continue;
      }

      await ProviderSkill.updateOne(
        { name: skill.name },
        { $set: { ...skill, category: categoryId, isActive: true } },
        { upsert: true }
      );
    }

    const skills = await ProviderSkill.find({}).populate('category', 'name key');
    logger.info(`✅ Seeded ${skills.length} provider skills`);

    // Group by category for logging
    const skillsByCategory = {};
    skills.forEach(skill => {
      const categoryName = skill.category?.name || 'Unknown';
      if (!skillsByCategory[categoryName]) {
        skillsByCategory[categoryName] = [];
      }
      skillsByCategory[categoryName].push(skill.name);
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

const seedAll = async () => {
  try {
    logger.info('🌱 Starting seed process for service categories and provider skills...');
    
    await seedServiceCategories();
    await seedProviderSkills();
    
    logger.info('✅ Seed process completed successfully!');
  } catch (error) {
    console.error('❌ Error in seed process:', error);
    throw error;
  }
};

const clearAll = async () => {
  try {
    logger.info('🧹 Clearing service categories and provider skills...');
    await ProviderSkill.deleteMany({});
    await ServiceCategory.deleteMany({});
    logger.info('✅ Cleared all service categories and provider skills');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};

module.exports = {
  seedServiceCategories,
  seedProviderSkills,
  seedAll,
  clearAll,
  defaultProviderSkills,
  defaultServiceCategories
};


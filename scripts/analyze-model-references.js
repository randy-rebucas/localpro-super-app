const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Map of all model names to their collection names
const modelCollectionMap = {
  // User related
  'User': 'users',
  'UserWallet': 'userwallets',
  'UserReferral': 'userreferrals',
  'UserTrust': 'usertrusts',
  'UserSettings': 'usersettings',
  'UserManagement': 'usermanagements',
  'UserActivity': 'useractivities',
  'UserAgency': 'useragencies',
  'UserSubscription': 'usersubscriptions',
  
  // Provider related
  'Provider': 'providers',
  'ProviderBusinessInfo': 'providerbusinessinfos',
  'ProviderProfessionalInfo': 'providerprofessionalinfos',
  'ProviderVerification': 'providerverifications',
  'ProviderFinancialInfo': 'providerfinancialinfos',
  'ProviderPerformance': 'providerperformances',
  'ProviderPreferences': 'providerpreferences',
  'ProviderSkill': 'providerskills',
  
  // Academy
  'AcademyCategory': 'academycategories',
  'Course': 'courses',
  'Enrollment': 'enrollments',
  'Certification': 'certifications',
  
  // Marketplace
  'Service': 'services',
  'Booking': 'bookings',
  'ServiceCategory': 'servicecategories',
  
  // Job
  'Job': 'jobs',
  'JobCategory': 'jobcategories',
  
  // Partner
  'Partner': 'partners',
  
  // Agency
  'Agency': 'agencies',
  
  // Supplies
  'Product': 'products',
  'SubscriptionKit': 'subscriptionkits',
  'Order': 'orders',
  
  // Rentals
  'RentalItem': 'rentalitems',
  'Rental': 'rentals',
  
  // Escrow
  'Escrow': 'escrows',
  'EscrowTransaction': 'escrowtransactions',
  
  // Wallet
  'WalletTransaction': 'wallettransactions',
  
  // Finance
  'Loan': 'loans',
  'SalaryAdvance': 'salaryadvances',
  'Transaction': 'transactions',
  'Finance': 'finances',
  
  // LocalPro Plus
  'SubscriptionPlan': 'subscriptionplans',
  
  // Communication
  'Conversation': 'conversations',
  'Message': 'messages',
  
  // Email
  'EmailCampaign': 'emailcampaigns',
  'EmailSubscriber': 'emailsubscribers',
  'EmailAnalytics': 'emailanalytics',
  
  // Ads
  'Advertiser': 'advertisers',
  'AdCampaign': 'adcampaigns',
  'AdImpression': 'adimpressions',
  
  // Other
  'Activity': 'activities',
  'Favorite': 'favorites',
  'LiveChat': 'livechats',
  'Announcement': 'announcements',
  'Analytics': 'analytics',
  'Referral': 'referrals',
  'TrustVerification': 'trustverifications',
  'Broadcaster': 'broadcasters',
  'FacilityCare': 'facilitycares',
  'FacilityCareService': 'facilitycareservices',
  'Contract': 'contracts',
  'Permission': 'permissions',
  'StaffPermission': 'staffpermissions',
  'AccessToken': 'accesstokens',
  'ApiKey': 'apikeys',
  'AppSettings': 'appsettings',
  'Communication': 'communications',
  'Log': 'logs',
  'Payout': 'payouts',
  'VerificationRequest': 'verificationrequests'
};

// Extract all references from a model file
function extractReferences(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const references = [];
  
  // Match ref: 'ModelName' or ref: "ModelName"
  const refRegex = /ref:\s*['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = refRegex.exec(content)) !== null) {
    references.push({
      modelName: match[1],
      line: content.substring(0, match.index).split('\n').length,
      context: content.substring(Math.max(0, match.index - 50), match.index + 100).trim()
    });
  }
  
  return references;
}

// Get all model files
function getModelFiles() {
  const modelsDir = path.join(__dirname, '..', 'src', 'models');
  return fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.js'))
    .map(file => ({
      name: file,
      path: path.join(modelsDir, file)
    }));
}

// Analyze all models
function analyzeModels() {
  const modelFiles = getModelFiles();
  const analysis = {
    totalModels: modelFiles.length,
    references: [],
    missingReferences: [],
    validReferences: [],
    modelNames: new Set(),
    referencedModels: new Set()
  };
  
  console.log('Analyzing model references...\n');
  
  // First pass: collect all references
  modelFiles.forEach(({ name, path: filePath }) => {
    const references = extractReferences(filePath);
    references.forEach(ref => {
      analysis.references.push({
        file: name,
        ...ref
      });
      analysis.referencedModels.add(ref.modelName);
    });
  });
  
  // Extract model names from exports
  modelFiles.forEach(({ name, path: filePath }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for mongoose.model('ModelName', ...)
    const modelRegex = /mongoose\.model\(['"]([^'"]+)['"]/g;
    let match;
    while ((match = modelRegex.exec(content)) !== null) {
      analysis.modelNames.add(match[1]);
    }
    
    // Check for module.exports = { ModelName: ... }
    const exportRegex = /(\w+):\s*mongoose\.model\(['"]([^'"]+)['"]/g;
    while ((match = exportRegex.exec(content)) !== null) {
      analysis.modelNames.add(match[2]);
    }
  });
  
  // Second pass: validate references
  analysis.references.forEach(ref => {
    if (analysis.modelNames.has(ref.modelName)) {
      analysis.validReferences.push(ref);
    } else {
      analysis.missingReferences.push(ref);
    }
  });
  
  return analysis;
}

// Generate report
function generateReport(analysis) {
  console.log('='.repeat(80));
  console.log('MODEL REFERENCE ANALYSIS REPORT');
  console.log('='.repeat(80));
  console.log(`\nTotal Models Found: ${analysis.modelNames.size}`);
  console.log(`Total References Found: ${analysis.references.length}`);
  console.log(`Valid References: ${analysis.validReferences.length}`);
  console.log(`Missing/Broken References: ${analysis.missingReferences.length}\n`);
  
  // List all model names
  console.log('='.repeat(80));
  console.log('ALL MODEL NAMES:');
  console.log('='.repeat(80));
  const sortedModels = Array.from(analysis.modelNames).sort();
  sortedModels.forEach((model, index) => {
    console.log(`${(index + 1).toString().padStart(3)}. ${model}`);
  });
  
  // List missing references
  if (analysis.missingReferences.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('MISSING/BROKEN REFERENCES:');
    console.log('='.repeat(80));
    analysis.missingReferences.forEach((ref, index) => {
      console.log(`\n${index + 1}. ${ref.modelName}`);
      console.log(`   File: ${ref.file}`);
      console.log(`   Line: ${ref.line}`);
      console.log(`   Context: ...${ref.context}...`);
    });
  } else {
    console.log('\n' + '='.repeat(80));
    console.log('✓ All references are valid!');
    console.log('='.repeat(80));
  }
  
  // Group references by model
  console.log('\n' + '='.repeat(80));
  console.log('REFERENCES BY MODEL:');
  console.log('='.repeat(80));
  const refsByModel = {};
  analysis.validReferences.forEach(ref => {
    if (!refsByModel[ref.modelName]) {
      refsByModel[ref.modelName] = [];
    }
    refsByModel[ref.modelName].push(ref);
  });
  
  Object.keys(refsByModel).sort().forEach(modelName => {
    const refs = refsByModel[modelName];
    console.log(`\n${modelName} (referenced ${refs.length} time${refs.length > 1 ? 's' : ''}):`);
    refs.forEach(ref => {
      console.log(`  - ${ref.file}:${ref.line}`);
    });
  });
  
  // Check for models that are referenced but not defined
  console.log('\n' + '='.repeat(80));
  console.log('MODELS REFERENCED BUT NOT DEFINED:');
  console.log('='.repeat(80));
  const undefinedModels = Array.from(analysis.referencedModels)
    .filter(model => !analysis.modelNames.has(model))
    .sort();
  
  if (undefinedModels.length > 0) {
    undefinedModels.forEach(model => {
      console.log(`  ✗ ${model}`);
      const refs = analysis.references.filter(r => r.modelName === model);
      refs.forEach(ref => {
        console.log(`    - Referenced in ${ref.file}:${ref.line}`);
      });
    });
  } else {
    console.log('  ✓ All referenced models are defined!');
  }
  
  // Check for models that are defined but never referenced
  console.log('\n' + '='.repeat(80));
  console.log('MODELS DEFINED BUT NEVER REFERENCED:');
  console.log('='.repeat(80));
  const unreferencedModels = Array.from(analysis.modelNames)
    .filter(model => !analysis.referencedModels.has(model))
    .sort();
  
  if (unreferencedModels.length > 0) {
    unreferencedModels.forEach(model => {
      console.log(`  - ${model} (defined but never referenced)`);
    });
  } else {
    console.log('  ✓ All models are referenced!');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

// Main execution
if (require.main === module) {
  try {
    const analysis = analyzeModels();
    generateReport(analysis);
    
    // Exit with error code if there are missing references
    if (analysis.missingReferences.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error analyzing models:', error);
    process.exit(1);
  }
}

module.exports = { analyzeModels, generateReport };

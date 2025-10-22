const fs = require('fs');
const path = require('path');

// List of controllers that need ObjectId validation fixes
const controllers = [
  'adsController.js',
  'rentalsController.js', 
  'facilityCareController.js',
  'jobController.js',
  'announcementController.js',
  'agencyController.js',
  'providerController.js'
];

// ObjectId validation code to add
const objectIdValidation = `    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ${'${paramName}'} ID format'
      });
    }

`;

// Function to add ObjectId validation to a controller
function addObjectIdValidation(controllerPath) {
  try {
    let content = fs.readFileSync(controllerPath, 'utf8');
    
    // Find the pattern for get functions that take an ID parameter
    const getFunctionPattern = /(const get\w+ = async \(req, res\) => \{\s*try \{\s*)(const \w+ = await \w+\.findById\(req\.params\.id\))/;
    
    if (getFunctionPattern.test(content)) {
      // Replace the pattern with validation added
      content = content.replace(
        getFunctionPattern,
        `$1${objectIdValidation}$2`
      );
      
      fs.writeFileSync(controllerPath, content);
      console.log(`✅ Fixed ObjectId validation in ${path.basename(controllerPath)}`);
      return true;
    } else {
      console.log(`⚠️  No get function with ID parameter found in ${path.basename(controllerPath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${controllerPath}:`, error.message);
    return false;
  }
}

// Process all controllers
console.log('🔧 Adding ObjectId validation to controllers...\n');

let fixedCount = 0;
controllers.forEach(controller => {
  const controllerPath = path.join('src/controllers', controller);
  if (fs.existsSync(controllerPath)) {
    if (addObjectIdValidation(controllerPath)) {
      fixedCount++;
    }
  } else {
    console.log(`⚠️  Controller not found: ${controller}`);
  }
});

console.log(`\n✅ Fixed ObjectId validation in ${fixedCount} controllers`);

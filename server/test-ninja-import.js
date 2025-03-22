require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const templateImportService = require('./services/templateImport');

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    // Get MongoDB URI from environment variable or use default
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/trading-dashboard';
    console.log(`Connecting to MongoDB at: ${mongoURI}`);
    
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
}

// NinjaTrader template directories
const NT_ATM_DIR = 'C:\\Users\\bridg\\Documents\\NinjaTrader 8\\templates\\ATM';
const NT_FLAZH_DIR = 'C:\\Users\\bridg\\Documents\\NinjaTrader 8\\templates\\Indicator\\RenkoKings_FlazhInfinity';

// Use the actual template files directly from NinjaTrader directories
const testFiles = [
  {
    path: path.join(NT_ATM_DIR, 'ATM_EA_LOW.xml'),
    type: 'ATM'
  },
  {
    path: path.join(NT_FLAZH_DIR, 'Flazh_EA_LOW.xml'),
    type: 'Flazh'
  }
];

// Ensure files exist before testing
function checkFiles() {
  testFiles.forEach(file => {
    if (!fs.existsSync(file.path)) {
      console.warn(`⚠️ Warning: Template file not found at: ${file.path}`);
    } else {
      console.log(`✓ Found ${file.type} template: ${path.basename(file.path)}`);
    }
  });
}

// Test a single template file
async function testTemplateFile(filePath, templateType) {
  console.log(`\n📄 Testing ${templateType} template: ${path.basename(filePath)}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: File not found at: ${filePath}`);
      return { success: false, error: 'File not found' };
    }
    
    // Read XML content
    const xmlContent = fs.readFileSync(filePath, 'utf8');
    console.log(`✓ Read XML file (${xmlContent.length} bytes)`);
    
    // Check for importFromXML function
    if (!templateImportService.importFromXML) {
      console.error('❌ importFromXML function not found in templateImportService');
      console.log('Adding temporary implementation...');
      
      // Add temporary implementation
      templateImportService.importFromXML = async (xmlContent, templateType, fileName) => {
        // Try to use the existing templateImport methods
        const tempFilePath = path.join(__dirname, 'temp-' + fileName);
        fs.writeFileSync(tempFilePath, xmlContent);
        
        try {
          const result = await templateImportService.importTemplate(tempFilePath);
          fs.unlinkSync(tempFilePath); // Clean up temp file
          return result;
        } catch (error) {
          fs.unlinkSync(tempFilePath); // Clean up temp file on error too
          return {
            success: false,
            message: `Error in temporary import: ${error.message}`,
            error: error.message
          };
        }
      };
    }
    
    // Import the template
    const result = await templateImportService.importFromXML(
      xmlContent, 
      templateType, 
      path.basename(filePath)
    );
    
    if (result.success) {
      console.log(`✅ Successfully imported template: ${result.message || 'No message'}`);
      if (result.template) {
        console.log(`   Template name: ${result.template.templateName}`);
        console.log(`   Market condition: ${result.template.marketCondition || 'Unknown'}`);
      }
      return result;
    } else {
      console.error(`❌ Failed to import template: ${result.message || 'Unknown error'}`);
      return result;
    }
  } catch (error) {
    console.error(`❌ Error processing template: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting NinjaTrader template tests...');
  console.log('========================================\n');
  
  // Connect to MongoDB
  const dbConnected = await connectToMongoDB();
  if (!dbConnected) {
    console.error('❌ Failed to connect to MongoDB. Exiting tests.');
    return;
  }
  
  // Check files
  checkFiles();
  
  // Test templates
  console.log('\n🧪 Testing template imports...');
  for (const template of testFiles) {
    // Test import
    await testTemplateFile(template.path, template.type);
    console.log('---------------------------------------------------');
  }
  
  // Close database connection
  console.log('\n👋 Closing database connection...');
  await mongoose.connection.close();
  
  console.log('\n✨ Template tests completed');
}

// Run the tests
runTests();
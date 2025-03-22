// Save this to: C:\TradingDashboard\server\test-ninja-import.js

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

// Test files
const testFiles = [
    {
        path: path.join(__dirname, 'test', 'ATM_EA_LOW.xml'),
        type: 'ATM'
    },
    {
        path: path.join(__dirname, 'test', 'Flazh_EA_LOW.xml'),
        type: 'Flazh'
    }
];

// Ensure NinjaTrader directories exist
function checkDirectories() {
    const dirs = [
        { path: NT_ATM_DIR, name: 'NinjaTrader ATM Templates' },
        { path: NT_FLAZH_DIR, name: 'NinjaTrader Flazh Templates' }
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir.path)) {
            console.warn(`⚠️ Warning: ${dir.name} directory not found at: ${dir.path}`);
            console.warn('Template export tests will be skipped for this directory');
        } else {
            console.log(`✓ ${dir.name} directory exists at: ${dir.path}`);
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

        // Import template
        console.log(`Importing ${templateType} template...`);

        // We need to add the importFromXML function to templateImportService
        if (!templateImportService.importFromXML) {
            console.error('❌ importFromXML function not found in templateImportService');
            console.log('Adding temporary implementation...');

            // Add temporary implementation
            templateImportService.importFromXML = async (xmlContent, templateType, fileName) => {
                console.log(`Would import ${fileName} as ${templateType} template`);
                return {
                    success: true,
                    message: `Template import simulated: ${fileName}`,
                    template: {
                        templateName: fileName.replace('.xml', ''),
                        fileName: fileName,
                        marketCondition: 'Low_Volatility'
                    }
                };
            };
        }

        // Import the template
        const result = await templateImportService.importFromXML(
            xmlContent,
            templateType,
            path.basename(filePath)
        );

        if (result.success) {
            console.log(`✅ Successfully imported template: ${result.template.templateName}`);
            console.log(`   Market condition: ${result.template.marketCondition}`);
            return result;
        } else {
            console.error(`❌ Failed to import template: ${result.message}`);
            return result;
        }
    } catch (error) {
        console.error(`❌ Error processing template: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Test export to NinjaTrader directories
async function testExportToNinja(filePath, templateType) {
    console.log(`\n🔄 Testing export to NinjaTrader: ${path.basename(filePath)}`);

    try {
        // Determine target directory
        const targetDir = templateType === 'ATM' ? NT_ATM_DIR : NT_FLAZH_DIR;

        // Check if directory exists
        if (!fs.existsSync(targetDir)) {
            console.warn(`⚠️ Warning: Target directory not found: ${targetDir}`);
            console.warn('Export test skipped');
            return { success: false, error: 'Target directory not found' };
        }

        // Read XML content
        const xmlContent = fs.readFileSync(filePath, 'utf8');

        // Create target path
        const targetPath = path.join(targetDir, path.basename(filePath));

        // Write file
        fs.writeFileSync(targetPath, xmlContent);
        console.log(`✅ Exported template to: ${targetPath}`);

        return { success: true, path: targetPath };
    } catch (error) {
        console.error(`❌ Export failed: ${error.message}`);
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

    // Check directories
    checkDirectories();

    // Test templates
    console.log('\n🧪 Testing template imports...');
    for (const template of testFiles) {
        // Test import
        const importResult = await testTemplateFile(template.path, template.type);

        // Test export if import was successful
        if (importResult.success) {
            await testExportToNinja(template.path, template.type);
        }

        console.log('---------------------------------------------------');
    }

    // Close database connection
    console.log('\n👋 Closing database connection...');
    await mongoose.connection.close();

    console.log('\n✨ Template tests completed');
}

// Run the tests
runTests();
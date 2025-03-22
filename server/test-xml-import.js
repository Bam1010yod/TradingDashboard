// Save this to: C:\TradingDashboard\server\test-ninja-import.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB } = require('./config/database');
const templateImportService = require('./services/templateImport');

// Connect to the database
connectDB();

// Array of test XML files
const testFiles = [
    path.join(__dirname, 'test', 'ATM_MORNING_TEST.xml'),
    path.join(__dirname, 'test', 'FLAZH_MORNING_TEST.xml'),
    path.join(__dirname, 'test', 'ATM_EA_LOW.xml'),
    path.join(__dirname, 'test', 'Flazh_EA_LOW.xml')
];

async function testTemplateImport() {
    console.log('Starting NinjaTrader template import test...');
    console.log('==============================================');

    for (const filePath of testFiles) {
        try {
            console.log(`Testing import of: ${filePath}`);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.error(`Error: File ${filePath} does not exist`);
                continue;
            }

            // Read XML file
            const xmlData = fs.readFileSync(filePath, 'utf8');

            // Get file name for logging
            const fileName = path.basename(filePath);

            // Determine template type from filename
            const isATM = fileName.toLowerCase().includes('atm');
            const isFlazh = fileName.toLowerCase().includes('flazh');

            console.log(`File type detection: ATM=${isATM}, Flazh=${isFlazh}`);

            // Import the template
            const templateType = isATM ? 'atm' : (isFlazh ? 'flazh' : 'unknown');
            console.log(`Attempting to import as ${templateType} template...`);

            const result = await templateImportService.importFromXML(xmlData, templateType);

            console.log('Import result:', result);
            console.log('------------------------------------------------');
        } catch (error) {
            console.error(`Error importing template from ${filePath}:`, error);
            console.log('------------------------------------------------');
        }
    }

    console.log('NinjaTrader template import test completed');
    mongoose.connection.close();
}

// Run the test
testTemplateImport();
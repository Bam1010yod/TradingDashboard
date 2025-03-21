const path = require('path');
require('dotenv').config();
const connectDB = require('./config/database');
const mongoose = require('mongoose');
const templateImport = require('./services/templateImport');
const AtmStrategy = require('./models/atmStrategy');
const FlazhInfinity = require('./models/flazhInfinity');

const testImport = async () => {
    try {
        // Connect to database
        console.log('Connecting to database...');
        await connectDB();
        console.log('Database connected');

        // Test individual import
        console.log('\n--- Testing individual template import ---');
        const samplePath = path.join(__dirname, 'test', 'sample.xml');
        console.log(`Importing template from: ${samplePath}`);
        const importResult = await templateImport.importTemplate(samplePath);
        console.log('Import result:', importResult);

        // Test template validation
        console.log('\n--- Testing template validation ---');
        const validationResult = await templateImport.validateTemplate(samplePath);
        console.log('Validation result:', validationResult);

        // Path to your XML files
        console.log('\n--- Testing batch import ---');
        const templateDir = path.join(__dirname, 'test', 'real');
        console.log(`Batch importing from directory: ${templateDir}`);

        // Import templates
        const batchResult = await templateImport.importTemplatesFromDirectory(templateDir);
        console.log('Batch import result:', batchResult);

        // Get all templates from database
        console.log('\n--- Fetching all templates ---');
        const atmTemplates = await AtmStrategy.find().lean();
        const flazhTemplates = await FlazhInfinity.find().lean();

        console.log(`Found ${atmTemplates.length} ATM templates`);
        console.log(`Found ${flazhTemplates.length} Flazh templates`);

        // Show template names
        if (atmTemplates.length > 0) {
            console.log('\nATM Templates:');
            atmTemplates.forEach(template => {
                console.log(`- ${template.templateName}`);
            });
        }

        if (flazhTemplates.length > 0) {
            console.log('\nFlazh Templates:');
            flazhTemplates.forEach(template => {
                console.log(`- ${template.templateName}`);
            });
        }

        console.log('\nTest completed successfully!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        try {
            await mongoose.disconnect();
        } catch (disconnectError) {
            console.error('Error disconnecting from database:', disconnectError);
        }
        process.exit(1);
    }
};

testImport();
// C:\TradingDashboard\server\import-all.js

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { importTemplatesFromDirectory } = require('./services/templateImport');

// Define paths to template directories
const ATM_TEMPLATES_PATH = process.env.ATM_TEMPLATES_PATH || 'C:/Users/bridg/Documents/NinjaTrader 8/templates/ATM';
const FLAZH_TEMPLATES_PATH = process.env.FLAZH_TEMPLATES_PATH || 'C:/Users/bridg/Documents/NinjaTrader 8/templates/Indicator/RenkoKings_FlazhInfinity';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trading-dashboard')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Function to import all templates
async function importAllTemplates() {
    try {
        console.log('Starting template import process...');

        // Import ATM templates
        console.log(`\nImporting ATM templates from: ${ATM_TEMPLATES_PATH}`);
        if (fs.existsSync(ATM_TEMPLATES_PATH)) {
            const atmResults = await importTemplatesFromDirectory(ATM_TEMPLATES_PATH);
            console.log('ATM Import results:');
            console.log(`Total templates: ${atmResults.total}`);
            console.log(`Successfully imported: ${atmResults.successful}`);
            console.log(`Failed to import: ${atmResults.failed}`);

            if (atmResults.failed > 0) {
                console.log('Errors:');
                atmResults.errors.forEach(err => {
                    console.log(`- ${err.file}: ${err.error}`);
                });
            }
        } else {
            console.error(`ATM templates directory not found: ${ATM_TEMPLATES_PATH}`);
        }

        // Import Flazh templates
        console.log(`\nImporting Flazh templates from: ${FLAZH_TEMPLATES_PATH}`);
        if (fs.existsSync(FLAZH_TEMPLATES_PATH)) {
            const flazhResults = await importTemplatesFromDirectory(FLAZH_TEMPLATES_PATH);
            console.log('Flazh Import results:');
            console.log(`Total templates: ${flazhResults.total}`);
            console.log(`Successfully imported: ${flazhResults.successful}`);
            console.log(`Failed to import: ${flazhResults.failed}`);

            if (flazhResults.failed > 0) {
                console.log('Errors:');
                flazhResults.errors.forEach(err => {
                    console.log(`- ${err.file}: ${err.error}`);
                });
            }
        } else {
            console.error(`Flazh templates directory not found: ${FLAZH_TEMPLATES_PATH}`);
        }

        console.log('\nTemplate import process completed!');
    } catch (error) {
        console.error('Error importing templates:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the import
importAllTemplates();
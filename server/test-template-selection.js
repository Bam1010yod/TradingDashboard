// C:\TradingDashboard\server\test-template-selection.js
const enhancedTemplateSelector = require('./services/enhancedTemplateSelector');
const marketConditionsService = require('./services/marketConditionsService');
const connectDB = require('./config/database');
const mongoose = require('mongoose');

const testTemplateSelection = async () => {
    try {
        // Connect to database
        await connectDB();

        // Get market conditions
        const marketConditions = marketConditionsService.analyzeMarketConditions();
        console.log('Current market conditions:', marketConditions);

        // Test ATM template selection
        console.log('\nTesting ATM template selection...');
        const atmTemplate = await enhancedTemplateSelector.getRecommendedTemplate('ATM');
        console.log('Selected ATM template:', atmTemplate ? atmTemplate.templateName : 'None');

        // Test Flazh template selection
        console.log('\nTesting Flazh template selection...');
        const flazhTemplate = await enhancedTemplateSelector.getRecommendedTemplate('Flazh');
        console.log('Selected Flazh template:', flazhTemplate ? flazhTemplate.templateName : 'None');

        // Disconnect from MongoDB
        await mongoose.disconnect();

    } catch (error) {
        console.error('Error testing template selection:', error);
    }
};

testTemplateSelection();
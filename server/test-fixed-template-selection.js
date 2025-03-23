// C:\TradingDashboard\server\test-fixed-template-selection.js
const mongoose = require('mongoose');
const connectDB = require('./config/database');

// After updating the enhancedTemplateSelector.js file, let's test it directly
const testTemplateSelection = async () => {
    try {
        console.log('Testing fixed template selection...');

        // Connect to database
        await connectDB();

        // Simulate market conditions similar to what the real service would provide
        const marketConditions = {
            currentTime: new Date().toISOString(),
            currentSession: 'US_OPEN',
            volatilityCategory: 'LOW_VOLATILITY',
            volatilityData: {
                volatilityLevel: 'LOW'
            }
        };

        console.log('Market conditions for test:', marketConditions);

        // Import the updated enhancedTemplateSelector
        const enhancedTemplateSelector = require('./services/enhancedTemplateSelector');

        // Test ATM template selection
        console.log('\nTesting ATM template selection...');
        const atmTemplate = await enhancedTemplateSelector.selectBestTemplate('ATM', marketConditions);

        if (atmTemplate) {
            console.log('\nATM Template Details:');
            console.log(`Name: ${atmTemplate.name}`);

            if (atmTemplate.brackets && atmTemplate.brackets.length > 0) {
                console.log(`Stop Loss: ${atmTemplate.brackets[0].stopLoss}`);
                console.log(`Target: ${atmTemplate.brackets[0].target}`);

                if (atmTemplate.brackets[0].stopStrategy) {
                    console.log(`Auto Break Even Plus: ${atmTemplate.brackets[0].stopStrategy.autoBreakEvenPlus}`);
                    console.log(`Auto Break Even Profit Trigger: ${atmTemplate.brackets[0].stopStrategy.autoBreakEvenProfitTrigger}`);
                }
            }
        } else {
            console.log('No ATM template found');
        }

        // Test Flazh template selection
        console.log('\nTesting Flazh template selection...');
        const flazhTemplate = await enhancedTemplateSelector.selectBestTemplate('Flazh', marketConditions);

        if (flazhTemplate) {
            console.log('\nFlazh Template Details:');
            console.log(`Name: ${flazhTemplate.name}`);
            console.log(`Fast Period: ${flazhTemplate.fastPeriod}`);
            console.log(`Fast Range: ${flazhTemplate.fastRange}`);
            console.log(`Medium Period: ${flazhTemplate.mediumPeriod}`);
            console.log(`Medium Range: ${flazhTemplate.mediumRange}`);
            console.log(`Slow Period: ${flazhTemplate.slowPeriod}`);
            console.log(`Slow Range: ${flazhTemplate.slowRange}`);
            console.log(`Filter Multiplier: ${flazhTemplate.filterMultiplier}`);
        } else {
            console.log('No Flazh template found');
        }

        // Test template adjustment
        if (atmTemplate) {
            console.log('\nTesting template adjustment...');
            const adjustedTemplate = enhancedTemplateSelector.adjustTemplateForMarketConditions(
                atmTemplate,
                { ...marketConditions, volatilityCategory: 'HIGH_VOLATILITY' }
            );

            console.log('\nAdjusted Template (for HIGH_VOLATILITY):');
            if (adjustedTemplate.brackets && adjustedTemplate.brackets.length > 0) {
                console.log(`Stop Loss: ${adjustedTemplate.brackets[0].stopLoss}`);
                console.log(`Target: ${adjustedTemplate.brackets[0].target}`);
            }
        }

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('\nTest complete.');

    } catch (error) {
        console.error('Error testing template selection:', error);
    }
};

testTemplateSelection();
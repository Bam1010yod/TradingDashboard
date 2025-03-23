// Full path: C:\TradingDashboard\server\test\test-filesystem-integration.js

const mongoose = require('mongoose');
const fileSystemService = require('../services/fileSystemService');
const improvedTemplateSelector = require('../services/improvedTemplateSelector');
const recommendationEngineService = require('../services/recommendationEngineService');

/**
 * Test the file system integration with improved template selection
 */
async function testFileSystemIntegration() {
    try {
        // Connect to database
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/trading-dashboard');
        console.log('Connected to database for testing');

        // Step 1: Test file system service reading templates
        console.log('\n=== Testing Template Reading ===');
        console.log('\nReading ATM templates:');
        const atmTemplates = await fileSystemService.readAtmTemplates();
        console.log(`Found ${atmTemplates.length} ATM templates in NinjaTrader folder`);

        if (atmTemplates.length > 0) {
            console.log('First ATM template example:');
            const atmSample = atmTemplates[0];
            console.log(`- Name: ${atmSample.name}`);
            if (atmSample.brackets && atmSample.brackets.length > 0) {
                console.log(`- Stop Loss: ${atmSample.brackets[0].stopLoss}`);
                console.log(`- Target: ${atmSample.brackets[0].target}`);
                if (atmSample.brackets[0].stopStrategy) {
                    console.log(`- Break Even Trigger: ${atmSample.brackets[0].stopStrategy.autoBreakEvenProfitTrigger}`);
                }
            }
        }

        console.log('\nReading Flazh templates:');
        const flazhTemplates = await fileSystemService.readFlazhTemplates();
        console.log(`Found ${flazhTemplates.length} Flazh templates in NinjaTrader folder`);

        if (flazhTemplates.length > 0) {
            console.log('First Flazh template example:');
            const flazhSample = flazhTemplates[0];
            console.log(`- Name: ${flazhSample.name}`);
            console.log(`- Fast Period: ${flazhSample.fastPeriod}`);
            console.log(`- Medium Period: ${flazhSample.mediumPeriod}`);
            console.log(`- Slow Period: ${flazhSample.slowPeriod}`);
            console.log(`- Filter Multiplier: ${flazhSample.filterMultiplier}`);
        }

        // Step 2: Test syncing templates to database
        console.log('\n=== Testing Database Sync ===');
        await fileSystemService.syncTemplatesWithDatabase();

        // Step 3: Test template selection for different market conditions
        console.log('\n=== Testing Template Selection ===');

        // Test different market scenarios
        const testCases = [
            {
                name: 'Morning High Volatility',
                conditions: {
                    currentSession: 'US_OPEN',
                    volatilityCategory: 'HIGH_VOLATILITY',
                    dayOfWeek: 'Monday',
                    volume: 'HIGH'
                }
            },
            {
                name: 'Afternoon Medium Volatility',
                conditions: {
                    currentSession: 'US_AFTERNOON',
                    volatilityCategory: 'MEDIUM_VOLATILITY',
                    dayOfWeek: 'Wednesday',
                    volume: 'MEDIUM'
                }
            },
            {
                name: 'Morning Low Volatility',
                conditions: {
                    currentSession: 'US_OPEN',
                    volatilityCategory: 'LOW_VOLATILITY',
                    dayOfWeek: 'Friday',
                    volume: 'LOW'
                }
            }
        ];

        // Test template selection for each case
        for (const testCase of testCases) {
            console.log(`\n--- Testing: ${testCase.name} ---`);

            // Get recommended templates
            console.log('\nGetting ATM template recommendation:');
            const atmRecommendation = await improvedTemplateSelector.getRecommendedTemplate('ATM', testCase.conditions);

            if (atmRecommendation) {
                console.log(`Selected ATM template: ${atmRecommendation.name}`);

                // Adjust template for market conditions
                const adjustedAtm = await improvedTemplateSelector.adjustTemplateForBacktestResults(
                    atmRecommendation,
                    testCase.conditions
                );

                // Show ATM parameter changes
                if (atmRecommendation.brackets && atmRecommendation.brackets.length > 0 &&
                    adjustedAtm.brackets && adjustedAtm.brackets.length > 0) {
                    console.log('\nATM Parameter Adjustments:');
                    console.log(`- Stop Loss: ${atmRecommendation.brackets[0].stopLoss} → ${adjustedAtm.brackets[0].stopLoss}`);
                    console.log(`- Target: ${atmRecommendation.brackets[0].target} → ${adjustedAtm.brackets[0].target}`);

                    if (atmRecommendation.brackets[0].stopStrategy && adjustedAtm.brackets[0].stopStrategy) {
                        console.log(`- Break Even Trigger: ${atmRecommendation.brackets[0].stopStrategy.autoBreakEvenProfitTrigger} → ${adjustedAtm.brackets[0].stopStrategy.autoBreakEvenProfitTrigger}`);
                        console.log(`- Break Even Plus: ${atmRecommendation.brackets[0].stopStrategy.autoBreakEvenPlus} → ${adjustedAtm.brackets[0].stopStrategy.autoBreakEvenPlus}`);
                    }
                }
            } else {
                console.log('No ATM template found for the current conditions.');
            }

            console.log('\nGetting Flazh template recommendation:');
            const flazhRecommendation = await improvedTemplateSelector.getRecommendedTemplate('Flazh', testCase.conditions);

            if (flazhRecommendation) {
                console.log(`Selected Flazh template: ${flazhRecommendation.name}`);

                // Adjust template for market conditions
                const adjustedFlazh = await improvedTemplateSelector.adjustTemplateForBacktestResults(
                    flazhRecommendation,
                    testCase.conditions
                );

                // Show Flazh parameter changes
                console.log('\nFlazh Parameter Adjustments:');
                console.log(`- Fast Period: ${flazhRecommendation.fastPeriod} → ${adjustedFlazh.fastPeriod}`);
                console.log(`- Fast Range: ${flazhRecommendation.fastRange} → ${adjustedFlazh.fastRange}`);
                console.log(`- Medium Period: ${flazhRecommendation.mediumPeriod} → ${adjustedFlazh.mediumPeriod}`);
                console.log(`- Medium Range: ${flazhRecommendation.mediumRange} → ${adjustedFlazh.mediumRange}`);
                console.log(`- Slow Period: ${flazhRecommendation.slowPeriod} → ${adjustedFlazh.slowPeriod}`);
                console.log(`- Slow Range: ${flazhRecommendation.slowRange} → ${adjustedFlazh.slowRange}`);
                console.log(`- Filter Multiplier: ${flazhRecommendation.filterMultiplier} → ${adjustedFlazh.filterMultiplier}`);
            } else {
                console.log('No Flazh template found for the current conditions.');
            }
        }

        // Step 4: Test recommendation engine integration
        console.log('\n=== Testing Recommendation Engine Integration ===');
        const recommendations = await recommendationEngineService.getRecommendations(testCases[0].conditions);

        console.log(`\nRecommendation timestamp: ${recommendations.timestamp}`);
        console.log(`ATM template: ${recommendations.atm.templateName}`);
        console.log(`Flazh template: ${recommendations.flazh.templateName}`);

        console.log('\nATM Performance Metrics:');
        console.log(`- Win Rate: ${recommendations.atm.performanceMetrics.winRate}%`);
        console.log(`- Profit Factor: ${recommendations.atm.performanceMetrics.profitFactor}`);
        console.log(`- Average R:R: ${recommendations.atm.performanceMetrics.averageRR}`);
        console.log(`- Confidence Score: ${recommendations.atm.confidenceScore}`);

        console.log('\nFlazh Performance Metrics:');
        console.log(`- Win Rate: ${recommendations.flazh.performanceMetrics.winRate}%`);
        console.log(`- Profit Factor: ${recommendations.flazh.performanceMetrics.profitFactor}`);
        console.log(`- Average R:R: ${recommendations.flazh.performanceMetrics.averageRR}`);
        console.log(`- Confidence Score: ${recommendations.flazh.confidenceScore}`);

        // Clean up
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        console.log('\nTest completed successfully!');

    } catch (error) {
        console.error(`Error during testing: ${error.message}`);
        console.error(error.stack);

        // Clean up if error occurs
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('\nDatabase connection closed after error');
        }

        console.error('Test failed');
        process.exit(1);
    }
}

// Run the test
testFileSystemIntegration();
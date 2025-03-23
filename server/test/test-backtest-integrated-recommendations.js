// Full path: C:\TradingDashboard\server\test\test-backtest-integrated-recommendations.js

const mongoose = require('mongoose');
const improvedTemplateSelector = require('../services/improvedTemplateSelector');
const marketConditionsService = require('../services/marketConditionsService');

/**
 * Test the improved template recommendation system with backtest integration
 */
async function testImprovedRecommendations() {
    try {
        // Connect to database with direct connection string
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/trading-dashboard');
        console.log('Connected to database for testing');

        // Test various market conditions
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

        // Test each case
        for (const testCase of testCases) {
            console.log(`\n=== Testing ${testCase.name} ===`);

            // Get ATM template recommendation
            console.log('\n-- ATM Template --');
            const atmTemplate = await improvedTemplateSelector.getRecommendedTemplate('ATM', testCase.conditions);

            if (atmTemplate) {
                console.log(`Recommended Template: ${atmTemplate.name}`);

                // Get template performance
                const atmPerformance = await improvedTemplateSelector.getTemplatePerformance(atmTemplate, testCase.conditions);
                const atmPerformanceScore = improvedTemplateSelector.calculatePerformanceScore(atmPerformance);
                console.log(`Performance Score: ${atmPerformanceScore}`);
                console.log(`Performance Metrics: Win Rate=${atmPerformance.winRate}%, Profit Factor=${atmPerformance.profitFactor}, Avg R:R=${atmPerformance.averageRR}`);

                // Apply backtest-based adjustments
                const adjustedAtmTemplate = await improvedTemplateSelector.adjustTemplateForBacktestResults(atmTemplate, testCase.conditions);

                // Log key parameters before and after adjustment
                console.log('\nParameter Adjustments:');
                if (atmTemplate.brackets && atmTemplate.brackets.length > 0 &&
                    adjustedAtmTemplate.brackets && adjustedAtmTemplate.brackets.length > 0) {
                    console.log(`Stop Loss: ${atmTemplate.brackets[0].stopLoss} -> ${adjustedAtmTemplate.brackets[0].stopLoss}`);
                    console.log(`Target: ${atmTemplate.brackets[0].target} -> ${adjustedAtmTemplate.brackets[0].target}`);

                    if (atmTemplate.brackets[0].stopStrategy && adjustedAtmTemplate.brackets[0].stopStrategy) {
                        console.log(`Break Even Trigger: ${atmTemplate.brackets[0].stopStrategy.autoBreakEvenProfitTrigger} -> ${adjustedAtmTemplate.brackets[0].stopStrategy.autoBreakEvenProfitTrigger}`);
                        console.log(`Break Even Plus: ${atmTemplate.brackets[0].stopStrategy.autoBreakEvenPlus} -> ${adjustedAtmTemplate.brackets[0].stopStrategy.autoBreakEvenPlus}`);
                    }
                }
            } else {
                console.log('No ATM template found');
            }

            // Get Flazh template recommendation
            console.log('\n-- Flazh Template --');
            const flazhTemplate = await improvedTemplateSelector.getRecommendedTemplate('Flazh', testCase.conditions);

            if (flazhTemplate) {
                console.log(`Recommended Template: ${flazhTemplate.name}`);

                // Get template performance
                const flazhPerformance = await improvedTemplateSelector.getTemplatePerformance(flazhTemplate, testCase.conditions);
                const flazhPerformanceScore = improvedTemplateSelector.calculatePerformanceScore(flazhPerformance);
                console.log(`Performance Score: ${flazhPerformanceScore}`);
                console.log(`Performance Metrics: Win Rate=${flazhPerformance.winRate}%, Profit Factor=${flazhPerformance.profitFactor}, Avg R:R=${flazhPerformance.averageRR}`);

                // Apply backtest-based adjustments
                const adjustedFlazhTemplate = await improvedTemplateSelector.adjustTemplateForBacktestResults(flazhTemplate, testCase.conditions);

                // Log key parameters before and after adjustment
                console.log('\nParameter Adjustments:');
                console.log(`Fast Period: ${flazhTemplate.fastPeriod} -> ${adjustedFlazhTemplate.fastPeriod}`);
                console.log(`Fast Range: ${flazhTemplate.fastRange} -> ${adjustedFlazhTemplate.fastRange}`);
                console.log(`Medium Period: ${flazhTemplate.mediumPeriod} -> ${adjustedFlazhTemplate.mediumPeriod}`);
                console.log(`Medium Range: ${flazhTemplate.mediumRange} -> ${adjustedFlazhTemplate.mediumRange}`);
                console.log(`Slow Period: ${flazhTemplate.slowPeriod} -> ${adjustedFlazhTemplate.slowPeriod}`);
                console.log(`Slow Range: ${flazhTemplate.slowRange} -> ${adjustedFlazhTemplate.slowRange}`);
                console.log(`Filter Multiplier: ${flazhTemplate.filterMultiplier} -> ${adjustedFlazhTemplate.filterMultiplier}`);
            } else {
                console.log('No Flazh template found');
            }
        }

        // Close database connection
        await mongoose.connection.close();
        console.log('\nClosed database connection');
        console.log('\nTest completed successfully!');
    } catch (error) {
        console.error('Error during testing:', error);

        // If error occurred during test, close database connection if open
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('Closed database connection after error');
        }

        console.error('Test failed');
        process.exit(1);
    }
}

// Run the test
testImprovedRecommendations();
/**
 * Test script for the improved backtesting analysis
 * Run with: node test-improved-backtest-analysis.js
 */

// Import required modules
const mongoose = require('mongoose');
const backtestingResultsService = require('./services/backtestingResultsService');
const Backtest = require('./models/backtest');

// MongoDB connection string
const dbConnection = 'mongodb://localhost:27017/trading-dashboard';

// Test parameters
const testScenarios = [
    { timeOfDay: 'Morning', sessionType: 'Regular', volatilityLevel: 5 },
    { timeOfDay: 'Morning', sessionType: 'High Volatility', volatilityLevel: 8 },
    { timeOfDay: 'Afternoon', sessionType: 'Regular', volatilityLevel: 4 },
    { timeOfDay: 'Evening', sessionType: 'Low Volatility', volatilityLevel: 3 }
];

// Main test function
async function runBacktestAnalysisTest() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(dbConnection);
        console.log('Connected to MongoDB');

        console.log('\n=======================================');
        console.log('IMPROVED BACKTEST ANALYSIS TEST');
        console.log('=======================================\n');

        // Run tests for each scenario
        for (const scenario of testScenarios) {
            console.log(`\nTesting scenario: ${scenario.timeOfDay} / ${scenario.sessionType} / Volatility ${scenario.volatilityLevel}`);
            console.log('---------------------------------------');

            // Get matching backtests count first
            const matchCount = await getMatchingBacktestsCount(scenario);
            console.log(`Found ${matchCount} potentially matching backtests in database`);

            if (matchCount === 0) {
                console.log('No matching backtests found - skipping this scenario');
                continue;
            }

            // Get performance metrics with the improved service
            console.log('Getting performance metrics...');
            const metrics = await backtestingResultsService.getPerformanceMetrics(
                scenario.timeOfDay,
                scenario.sessionType,
                scenario.volatilityLevel
            );

            // Display results
            console.log('\nResults:');
            if (metrics.success) {
                console.log(`- Sample size: ${metrics.sampleSize}`);
                console.log(`- Successful samples: ${metrics.successfulSamples}`);
                console.log(`- Confidence level: ${metrics.confidenceLevel}`);
                console.log(`- Average similarity: ${metrics.averageSimilarity ? metrics.averageSimilarity.toFixed(2) : 'N/A'}%`);
                console.log(`- Win rate: ${metrics.winRate ? (metrics.winRate * 100).toFixed(2) : 'N/A'}%`);
                console.log(`- Profit factor: ${metrics.profitFactor ? metrics.profitFactor.toFixed(2) : 'N/A'}`);
                console.log(`- Average R:R: ${metrics.averageRR ? metrics.averageRR.toFixed(2) : 'N/A'}`);

                console.log('\nRecommended Adjustments:');
                console.log(`- Stop Loss: ${metrics.adjustmentFactors.stopLossAdjustment.toFixed(2)}x`);
                console.log(`- Target: ${metrics.adjustmentFactors.targetAdjustment.toFixed(2)}x`);
                console.log(`- Trailing Stop: ${metrics.adjustmentFactors.trailingStopAdjustment.toFixed(2)}x`);
            } else {
                console.log('No valid performance metrics found');
                console.log(`Default adjustments: ${JSON.stringify(metrics.adjustmentFactors)}`);
            }

            // Test the performance trends feature
            console.log('\nChecking performance trends...');
            const trends = await backtestingResultsService.getPerformanceTrends(
                scenario.timeOfDay,
                scenario.sessionType
            );

            if (trends.success && trends.trends && trends.trends.length > 0) {
                console.log('Performance trends over time:');
                trends.trends.forEach(period => {
                    console.log(`- ${period.period}: Win Rate ${(period.avgWinRate * 100).toFixed(1)}%, Profit Factor ${period.avgProfitFactor.toFixed(2)} (${period.sampleSize} samples)`);
                });
            } else {
                console.log('Insufficient data for trend analysis');
            }
        }

        console.log('\n=======================================');
        console.log('TEST COMPLETED SUCCESSFULLY');
        console.log('=======================================\n');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Test failed with error:', error);
        try {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        } catch (e) {
            console.error('Error disconnecting from MongoDB:', e);
        }
    }
}

/**
 * Get count of matching backtests for a scenario
 * @param {Object} scenario - Test scenario
 * @returns {Number} - Count of matching backtests
 */
async function getMatchingBacktestsCount(scenario) {
    return await Backtest.countDocuments({
        $or: [
            { description: { $regex: scenario.timeOfDay, $options: 'i' } },
            { description: { $regex: scenario.sessionType, $options: 'i' } },
            { 'strategyParams.sessionTime': { $regex: scenario.timeOfDay, $options: 'i' } },
            { 'strategyParams.sessionType': { $regex: scenario.sessionType, $options: 'i' } }
        ]
    });
}

// Run the test
runBacktestAnalysisTest()
    .then(() => {
        console.log('Test script execution completed');
    })
    .catch(err => {
        console.error('Error running test script:', err);
    });
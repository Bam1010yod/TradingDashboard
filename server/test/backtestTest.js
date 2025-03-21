/**
 * Simple test methods for the backtesting module
 */

const backtestService = require('../services/backtestService');
const mongoose = require('mongoose');

// Make sure mongoose is connected before running tests
async function ensureMongooseConnection() {
    if (mongoose.connection.readyState !== 1) {
        // If mongoose isn't connected, set up a test connection
        try {
            // Use your actual MongoDB connection string here if available
            // Otherwise, this is just a placeholder that won't actually connect
            console.log('Setting up test database connection...');
            await mongoose.connect('mongodb://localhost:27017/tradingDashboard', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
        } catch (error) {
            console.warn('Could not connect to MongoDB, but proceeding with test anyway:', error.message);
            // Continue anyway as we're using mock data
        }
    }
}

/**
 * Run a test backtest with sample data
 */
async function testBacktest() {
    try {
        console.log('Running test backtest...');

        // Ensure mongoose connection
        await ensureMongooseConnection();

        // Sample backtest parameters
        const testParams = {
            name: 'Test Backtest',
            description: 'A test backtest for moving average crossover',
            instrument: 'ES', // E-mini S&P 500
            timeframe: '5m',
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-03'), // Shorter period for faster test
            strategyParams: {
                shortPeriod: 10,
                longPeriod: 30
            }
        };

        // Run the backtest
        const result = await backtestService.runBacktest(testParams);

        console.log('Backtest completed successfully!');
        console.log('Backtest ID:', result._id);
        console.log('Performance Metrics:', result.performanceMetrics);

        return result;
    } catch (error) {
        console.error('Error running test backtest:', error);
        throw error;
    }
}

/**
 * Test comparing multiple backtests
 */
async function testCompareBacktests(backtestIds) {
    try {
        console.log('Testing backtest comparison...');

        // Ensure mongoose connection
        await ensureMongooseConnection();

        const comparison = await backtestService.compareBacktests(backtestIds);

        console.log('Comparison completed successfully!');
        console.log('Comparison results:', comparison);

        return comparison;
    } catch (error) {
        console.error('Error testing backtest comparison:', error);
        throw error;
    }
}

// If this file is run directly
if (require.main === module) {
    testBacktest()
        .then(result => {
            console.log('Test completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = {
    testBacktest,
    testCompareBacktests
};
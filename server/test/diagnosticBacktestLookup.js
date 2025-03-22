/**
 * Diagnostic test to check backtest retrieval
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the database configuration
const connectDB = require('../config/database');

// Import models
const Backtest = require('../models/backtest');

// Test function
async function runTest() {
    try {
        console.log('Starting backtest diagnostic test...');

        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Check if our test backtest exists
        const testBacktest = await Backtest.findOne({ name: 'Test Morning Strategy Backtest' });
        console.log('\n=== CHECKING FOR TEST BACKTEST ===');
        if (testBacktest) {
            console.log('Found test backtest with the following properties:');
            console.log('- ID:', testBacktest._id);
            console.log('- Name:', testBacktest.name);
            console.log('- Time of Day:', testBacktest.timeOfDay);
            console.log('- Session Type:', testBacktest.sessionType);
            console.log('- Volatility Level:', testBacktest.marketConditions.volatilityLevel);
            console.log('- Performance:', testBacktest.performance);
        } else {
            console.log('Test backtest not found');
        }

        // Try the exact query used in backtestingResultsService.js
        console.log('\n=== TESTING BACKTEST QUERY ===');
        const backtestResults = await Backtest.find({
            timeOfDay: 'Morning',
            sessionType: 'Regular',
            'marketConditions.volatilityLevel': {
                $gte: 6, // 7-1 
                $lte: 8  // 7+1
            }
        });

        console.log('Query results:', backtestResults.length > 0 ? 'Found matches' : 'No matches found');
        console.log('Number of results:', backtestResults.length);

        if (backtestResults.length > 0) {
            console.log('First result:');
            console.log('- ID:', backtestResults[0]._id);
            console.log('- Name:', backtestResults[0].name);
        }

        // Try a more relaxed query to see what might be wrong
        console.log('\n=== TESTING RELAXED QUERY ===');
        const allMorningBacktests = await Backtest.find({ timeOfDay: 'Morning' });
        console.log('Morning backtests found:', allMorningBacktests.length);

        const allRegularBacktests = await Backtest.find({ sessionType: 'Regular' });
        console.log('Regular session backtests found:', allRegularBacktests.length);

        // Check all backtests in the database
        console.log('\n=== ALL BACKTESTS IN DATABASE ===');
        const allBacktests = await Backtest.find({});
        console.log('Total backtests in database:', allBacktests.length);
        allBacktests.forEach((backtest, index) => {
            console.log(`Backtest ${index + 1}:`);
            console.log('- ID:', backtest._id);
            console.log('- Name:', backtest.name);
            console.log('- Time of Day:', backtest.timeOfDay);
            console.log('- Session Type:', backtest.sessionType);
            if (backtest.marketConditions) {
                console.log('- Volatility Level:', backtest.marketConditions.volatilityLevel);
            }
        });

        // Disconnect from database
        await mongoose.disconnect();
        console.log('\nDiagnostic test completed. Disconnected from database.');

    } catch (error) {
        console.error('Test failed with error:', error);
        try {
            await mongoose.disconnect();
        } catch (err) {
            console.error('Error disconnecting from database:', err);
        }
    }
}

// Run the test
runTest();
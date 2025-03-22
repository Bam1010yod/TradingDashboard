/**
 * Test for Parameter Optimization Service
 * This script tests the parameter optimization functionality
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the database configuration - use the proper import
const connectDB = require('../config/database');

// Import the service to test
const parameterOptimizationService = require('../services/parameterOptimizationService');

// Mock market data for testing
const testMarketData = {
    symbol: 'NQ',
    currentPrice: 19245,
    dailyVolatility: 1.8,
    volume: 12500,
    atr: 35,
    trend: 'neutral', // Options: bullish, bearish, neutral
    priceRange: 65 // Add price range for testing
};

// Test optimization with different time periods and session types
async function runTest() {
    try {
        // Connect to database using the connectDB function instead of direct mongoose.connect
        await connectDB();
        console.log('Connected to database for parameter optimization test');

        // Test morning session
        console.log('\n=== TESTING MORNING SESSION PARAMETERS ===');
        const morningParams = await parameterOptimizationService.optimizeParameters(
            testMarketData,
            'Morning',
            'Regular'
        );
        console.log('Optimized Morning Parameters:');
        console.log('Flazh:', morningParams.flazhParameters);
        console.log('ATM:', morningParams.atmParameters);
        console.log('Confidence:', morningParams.confidence);
        console.log('Market Summary:', morningParams.marketConditionsSummary);

        // Test afternoon session
        console.log('\n=== TESTING AFTERNOON SESSION PARAMETERS ===');
        const afternoonParams = await parameterOptimizationService.optimizeParameters(
            testMarketData,
            'Afternoon',
            'High Volatility'
        );
        console.log('Optimized Afternoon Parameters:');
        console.log('Flazh:', afternoonParams.flazhParameters);
        console.log('ATM:', afternoonParams.atmParameters);
        console.log('Confidence:', afternoonParams.confidence);
        console.log('Market Summary:', afternoonParams.marketConditionsSummary);

        // Disconnect from database
        await mongoose.disconnect();
        console.log('Disconnected from database');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the test
runTest();
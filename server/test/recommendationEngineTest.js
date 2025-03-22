/**
 * Test for Recommendation Engine Service
 * This script tests the comprehensive recommendation engine
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the database configuration
const connectDB = require('../config/database');

// Import the service to test
const recommendationEngineService = require('../services/recommendationEngineService');

// Test the recommendation engine
async function runTest() {
    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database for recommendation engine test');

        // Test morning session recommendations
        console.log('\n=== TESTING MORNING SESSION RECOMMENDATIONS ===');
        const morningRecommendations = await recommendationEngineService.generateRecommendations(
            'Morning',
            'Regular'
        );
        console.log('Morning Recommendations Summary:');
        if (morningRecommendations && morningRecommendations.recommendations) {
            console.log('Flazh Parameters:', morningRecommendations.recommendations.flazh);
            console.log('ATM Parameters:', morningRecommendations.recommendations.atm);
            console.log('Confidence:', morningRecommendations.recommendations.confidence);
            console.log('Relevant News Items:', morningRecommendations.relevantNews ? morningRecommendations.relevantNews.length : 0);
        } else {
            console.log('Failed to generate morning recommendations');
        }

        // Test afternoon session recommendations
        console.log('\n=== TESTING AFTERNOON SESSION RECOMMENDATIONS ===');
        const afternoonRecommendations = await recommendationEngineService.generateRecommendations(
            'Afternoon',
            'High Volatility'
        );
        console.log('Afternoon Recommendations Summary:');
        if (afternoonRecommendations && afternoonRecommendations.recommendations) {
            console.log('Flazh Parameters:', afternoonRecommendations.recommendations.flazh);
            console.log('ATM Parameters:', afternoonRecommendations.recommendations.atm);
            console.log('Confidence:', afternoonRecommendations.recommendations.confidence);
            console.log('Relevant News Items:', afternoonRecommendations.relevantNews ? afternoonRecommendations.relevantNews.length : 0);
        } else {
            console.log('Failed to generate afternoon recommendations');
        }

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
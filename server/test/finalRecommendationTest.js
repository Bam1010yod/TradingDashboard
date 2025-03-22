/**
 * Final test for recommendation engine with backtest data
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Import the database configuration
const connectDB = require('../config/database');

// Import the service to test
const recommendationEngineService = require('../services/recommendationEngineService');

// Test function
async function runTest() {
    try {
        console.log('Starting final recommendation test...');

        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Create results directory if it doesn't exist
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir);
        }

        // Test Morning/Regular session recommendations
        console.log('\n=== TESTING MORNING/REGULAR SESSION RECOMMENDATIONS ===');
        const morningRecommendations = await recommendationEngineService.generateRecommendations(
            'Morning',
            'Regular'
        );

        console.log('Morning Recommendations Summary:');
        if (morningRecommendations && morningRecommendations.recommendations) {
            console.log('Flazh Parameters:', morningRecommendations.recommendations.flazh);
            console.log('ATM Parameters:', morningRecommendations.recommendations.atm);
            console.log('Confidence:', morningRecommendations.recommendations.confidence);

            if (morningRecommendations.backtestingInsights) {
                console.log('Backtesting Insights:');
                console.log('- Sample Size:', morningRecommendations.backtestingInsights.sampleSize);
                console.log('- Win Rate:', morningRecommendations.backtestingInsights.winRate);
                console.log('- Profit Factor:', morningRecommendations.backtestingInsights.profitFactor);
            }

            // Save to file
            fs.writeFileSync(
                path.join(resultsDir, 'final_morning_recommendations.json'),
                JSON.stringify(morningRecommendations, null, 2)
            );
            console.log('Saved to:', path.join(resultsDir, 'final_morning_recommendations.json'));
        }

        // Disconnect from database
        await mongoose.disconnect();
        console.log('\nTest completed. Disconnected from database.');
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
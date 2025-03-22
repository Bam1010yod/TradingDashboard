/**
 * Simple verification test for the Recommendation Engine
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

// Test the recommendation engine
async function runTest() {
    try {
        console.log('Starting verification test for recommendation engine...');

        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Create results directory if it doesn't exist
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir);
            console.log('Created results directory at:', resultsDir);
        }

        // Test morning session recommendations
        console.log('\nTesting Morning/Regular session recommendations:');
        try {
            const morningRecommendations = await recommendationEngineService.generateRecommendations(
                'Morning',
                'Regular'
            );

            console.log('Successfully generated Morning recommendations');

            // Save to file
            try {
                fs.writeFileSync(
                    path.join(resultsDir, 'morning_test.json'),
                    JSON.stringify(morningRecommendations, null, 2)
                );
                console.log('Saved morning recommendations to:', path.join(resultsDir, 'morning_test.json'));
            } catch (writeError) {
                console.error('Error saving morning recommendations to file:', writeError);
            }
        } catch (morningError) {
            console.error('Error generating morning recommendations:', morningError);
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
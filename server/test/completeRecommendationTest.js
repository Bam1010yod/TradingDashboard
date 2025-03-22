/**
 * Complete test for Recommendation Engine with backtesting results
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Import the database configuration
const connectDB = require('../config/database');

// Import the services
const recommendationEngineService = require('../services/recommendationEngineService');
const Backtest = require('../models/backtest');

// Test the recommendation engine
async function runTest() {
    try {
        console.log('Starting complete recommendation engine test...');

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

            if (morningRecommendations.backtestingInsights) {
                console.log('Backtesting Insights:');
                console.log('- Sample Size:', morningRecommendations.backtestingInsights.sampleSize);
                console.log('- Win Rate:', morningRecommendations.backtestingInsights.winRate);
                console.log('- Profit Factor:', morningRecommendations.backtestingInsights.profitFactor);
            }

            // Save to file
            try {
                fs.writeFileSync(
                    path.join(resultsDir, 'morning_recommendations.json'),
                    JSON.stringify(morningRecommendations, null, 2)
                );
                console.log('Saved to:', path.join(resultsDir, 'morning_recommendations.json'));
            } catch (writeError) {
                console.error('Error saving to file:', writeError);
            }
        }

        // Test high volatility session
        console.log('\n=== TESTING HIGH VOLATILITY SESSION RECOMMENDATIONS ===');
        const highVolRecommendations = await recommendationEngineService.generateRecommendations(
            'Afternoon',
            'High Volatility'
        );

        console.log('High Volatility Recommendations Summary:');
        if (highVolRecommendations && highVolRecommendations.recommendations) {
            console.log('Flazh Parameters:', highVolRecommendations.recommendations.flazh);
            console.log('ATM Parameters:', highVolRecommendations.recommendations.atm);
            console.log('Confidence:', highVolRecommendations.recommendations.confidence);

            // Save to file
            try {
                fs.writeFileSync(
                    path.join(resultsDir, 'high_volatility_recommendations.json'),
                    JSON.stringify(highVolRecommendations, null, 2)
                );
                console.log('Saved to:', path.join(resultsDir, 'high_volatility_recommendations.json'));
            } catch (writeError) {
                console.error('Error saving to file:', writeError);
            }
        }

        // Create a simulated backtest result
        console.log('\n=== CREATING SIMULATED BACKTEST DATA ===');

        // First delete any existing test data to avoid duplicates
        try {
            await Backtest.deleteMany({
                timeOfDay: 'Morning',
                sessionType: 'Regular',
                'performance.totalTrades': 25 // A unique identifier for our test data
            });
            console.log('Cleaned up any existing test backtest data');
        } catch (deleteError) {
            console.error('Error cleaning up test data:', deleteError);
        }

        // Create new simulated backtest
        const simulatedBacktest = new Backtest({
            timeOfDay: 'Morning',
            sessionType: 'Regular',
            parameters: {
                stopLossAdjustment: 1.2,
                targetAdjustment: 1.3,
                trailingStopAdjustment: 1.1
            },
            marketConditions: {
                volatilityLevel: 7,
                volatilityScore: 7,
                trendStrength: 'medium',
                priceRange: 50
            },
            performance: {
                wins: 18,
                losses: 7,
                totalTrades: 25,
                profitFactor: 2.4,
                averageWin: 35,
                averageLoss: 25
            },
            createdAt: new Date()
        });

        // Save the simulated backtest
        try {
            await simulatedBacktest.save();
            console.log('Saved simulated backtest to database');
        } catch (saveError) {
            console.error('Error saving simulated backtest:', saveError);
        }

        // Generate recommendations after adding simulated data
        console.log('\n=== TESTING MORNING RECOMMENDATIONS WITH BACKTEST DATA ===');
        const morningWithBacktestRecs = await recommendationEngineService.generateRecommendations(
            'Morning',
            'Regular'
        );

        console.log('Morning Recommendations With Backtest Data:');
        if (morningWithBacktestRecs && morningWithBacktestRecs.recommendations) {
            console.log('Flazh Parameters:', morningWithBacktestRecs.recommendations.flazh);
            console.log('ATM Parameters:', morningWithBacktestRecs.recommendations.atm);
            console.log('Confidence:', morningWithBacktestRecs.recommendations.confidence);

            if (morningWithBacktestRecs.backtestingInsights) {
                console.log('Backtesting Insights:');
                console.log('- Sample Size:', morningWithBacktestRecs.backtestingInsights.sampleSize);
                console.log('- Win Rate:', morningWithBacktestRecs.backtestingInsights.winRate);
                console.log('- Profit Factor:', morningWithBacktestRecs.backtestingInsights.profitFactor);
            }

            // Save to file
            try {
                fs.writeFileSync(
                    path.join(resultsDir, 'morning_recommendations_with_backtest.json'),
                    JSON.stringify(morningWithBacktestRecs, null, 2)
                );
                console.log('Saved to:', path.join(resultsDir, 'morning_recommendations_with_backtest.json'));
            } catch (writeError) {
                console.error('Error saving to file:', writeError);
            }
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
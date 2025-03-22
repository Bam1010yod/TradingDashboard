/**
 * Test for Recommendation Engine Service
 * This script tests the comprehensive recommendation engine with backtesting results
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Import the database configuration
const connectDB = require('../config/database');

// Import the services to test
const recommendationEngineService = require('../services/recommendationEngineService');
const backtestService = require('../services/backtestService');

// Test the recommendation engine
async function runTest() {
    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database for recommendation engine test');

        // Create test results directory if it doesn't exist
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir);
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
            console.log('Relevant News Items:', morningRecommendations.relevantNews ? morningRecommendations.relevantNews.length : 0);

            // Log backtesting insights
            if (morningRecommendations.backtestingInsights) {
                console.log('Backtesting Insights:');
                console.log('- Sample Size:', morningRecommendations.backtestingInsights.sampleSize);
                console.log('- Win Rate:', (morningRecommendations.backtestingInsights.winRate * 100).toFixed(2) + '%');
                console.log('- Profit Factor:', morningRecommendations.backtestingInsights.profitFactor.toFixed(2));
            }

            // Save results to file
            fs.writeFileSync(
                path.join(resultsDir, 'morning_recommendations.json'),
                JSON.stringify(morningRecommendations, null, 2)
            );
        } else {
            console.log('Failed to generate morning recommendations');
        }

        // Test high volatility session recommendations
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
            console.log('Relevant News Items:', highVolRecommendations.relevantNews ? highVolRecommendations.relevantNews.length : 0);

            // Log backtesting insights
            if (highVolRecommendations.backtestingInsights) {
                console.log('Backtesting Insights:');
                console.log('- Sample Size:', highVolRecommendations.backtestingInsights.sampleSize);
                console.log('- Win Rate:', (highVolRecommendations.backtestingInsights.winRate * 100).toFixed(2) + '%');
                console.log('- Profit Factor:', highVolRecommendations.backtestingInsights.profitFactor.toFixed(2));
            }

            // Save results to file
            fs.writeFileSync(
                path.join(resultsDir, 'high_volatility_recommendations.json'),
                JSON.stringify(highVolRecommendations, null, 2)
            );
        } else {
            console.log('Failed to generate high volatility recommendations');
        }

        // Test with a simulated backtest to validate algorithm
        console.log('\n=== CREATING AND USING SIMULATED BACKTEST DATA ===');

        // Create simulated backtest data
        const simulatedBacktest = {
            timeOfDay: 'Morning',
            sessionType: 'Regular',
            parameters: {
                stopLossAdjustment: 1.2,
                targetAdjustment: 1.3,
                trailingStopAdjustment: 1.1
            },
            marketConditions: {
                volatilityLevel: 7,
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
        };

        // Save simulated backtest to database
        try {
            await backtestService.saveBacktestResult(simulatedBacktest);
            console.log('Saved simulated backtest to database');
        } catch (error) {
            console.error('Error saving simulated backtest:', error);
        }

        // Generate recommendations after adding simulated data
        console.log('\n=== TESTING MORNING SESSION RECOMMENDATIONS WITH SIMULATED BACKTEST DATA ===');
        const morningRecommendationsAfterBacktest = await recommendationEngineService.generateRecommendations(
            'Morning',
            'Regular'
        );

        console.log('Morning Recommendations with Backtest Data:');
        if (morningRecommendationsAfterBacktest && morningRecommendationsAfterBacktest.recommendations) {
            console.log('Flazh Parameters:', morningRecommendationsAfterBacktest.recommendations.flazh);
            console.log('ATM Parameters:', morningRecommendationsAfterBacktest.recommendations.atm);
            console.log('Confidence:', morningRecommendationsAfterBacktest.recommendations.confidence);

            // Log backtesting insights
            if (morningRecommendationsAfterBacktest.backtestingInsights) {
                console.log('Backtesting Insights:');
                console.log('- Sample Size:', morningRecommendationsAfterBacktest.backtestingInsights.sampleSize);
                console.log('- Win Rate:', (morningRecommendationsAfterBacktest.backtestingInsights.winRate * 100).toFixed(2) + '%');
                console.log('- Profit Factor:', morningRecommendationsAfterBacktest.backtestingInsights.profitFactor.toFixed(2));
            }

            // Save results to file
            fs.writeFileSync(
                path.join(resultsDir, 'morning_recommendations_with_backtest.json'),
                JSON.stringify(morningRecommendationsAfterBacktest, null, 2)
            );
        } else {
            console.log('Failed to generate morning recommendations with backtest data');
        }

        // Disconnect from database
        await mongoose.disconnect();
        console.log('Disconnected from database');
        console.log('\nTest completed successfully. Results saved to test/results directory.');

    } catch (error) {
        console.error('Test failed:', error);
        // Try to disconnect from database in case of error
        try {
            await mongoose.disconnect();
        } catch (err) {
            console.error('Error disconnecting from database:', err);
        }
        process.exit(1);
    }
}

// Run the test
runTest();
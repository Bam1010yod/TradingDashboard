/**
 * Test for creating a backtest result and testing its impact on recommendations
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Import the database configuration
const connectDB = require('../config/database');

// Import models and services
const Backtest = require('../models/backtest');
const recommendationEngineService = require('../services/recommendationEngineService');

// Test function
async function runTest() {
    try {
        console.log('Starting backtest recommendation test...');

        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Create results directory if it doesn't exist
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir);
            console.log('Created results directory at:', resultsDir);
        }

        // First, run a recommendation without any specific backtest data
        console.log('\n=== GETTING BASELINE MORNING RECOMMENDATIONS ===');
        const baseRecommendations = await recommendationEngineService.generateRecommendations(
            'Morning',
            'Regular'
        );

        console.log('Baseline Morning Recommendations:');
        console.log('Flazh Parameters:', baseRecommendations.recommendations.flazh);
        console.log('ATM Parameters:', baseRecommendations.recommendations.atm);
        console.log('Confidence:', baseRecommendations.recommendations.confidence);

        // Clean up any previous test data
        console.log('\n=== CREATING SIMULATED BACKTEST DATA ===');
        try {
            await Backtest.deleteMany({ name: 'Test Morning Strategy Backtest' });
            console.log('Cleaned up any existing test backtest data');
        } catch (deleteError) {
            console.error('Error cleaning up test data:', deleteError);
        }

        // Create new simulated backtest with all required fields
        const currentDate = new Date();
        const oneWeekAgo = new Date(currentDate);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const simulatedBacktest = new Backtest({
            name: 'Test Morning Strategy Backtest',
            instrument: 'NQ',
            timeframe: '5min',
            strategyParams: {
                type: 'Trend Following',
                entryCondition: 'MA Crossover',
                exitCondition: 'Fixed Target',
            },
            timeOfDay: 'Morning',
            sessionType: 'Regular',
            startDate: oneWeekAgo,
            endDate: currentDate,
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
            }
        });

        // Save the simulated backtest
        try {
            await simulatedBacktest.save();
            console.log('Successfully saved simulated backtest to database');

            // Verify the backtest was saved
            const savedBacktest = await Backtest.findOne({ name: 'Test Morning Strategy Backtest' });
            if (savedBacktest) {
                console.log('Verified backtest saved with ID:', savedBacktest._id);
            } else {
                console.log('Could not verify backtest was saved');
            }
        } catch (saveError) {
            console.error('Error saving simulated backtest:', saveError.message);
            if (saveError.errors) {
                console.log('Validation errors:');
                Object.keys(saveError.errors).forEach(key => {
                    console.log(`- ${key}: ${saveError.errors[key].message}`);
                });
            }
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
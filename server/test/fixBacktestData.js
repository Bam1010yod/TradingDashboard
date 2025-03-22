/**
 * Fix backtest data schema issues
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import the database configuration
const connectDB = require('../config/database');

// Import models
const Backtest = require('../models/backtest');

// Test function
async function runTest() {
    try {
        console.log('Starting backtest schema diagnostic...');

        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Get the schema paths and required fields
        console.log('\n=== BACKTEST MODEL SCHEMA ===');
        const schemaPaths = Object.keys(Backtest.schema.paths);
        console.log('Schema paths:');
        schemaPaths.forEach(path => {
            const isRequired = Backtest.schema.paths[path].isRequired;
            console.log(`- ${path}${isRequired ? ' (required)' : ''}`);
        });

        // Clean up any previous test data
        await Backtest.deleteMany({ name: 'Test Morning Strategy Backtest' });
        console.log('\nRemoved previous test data');

        // Create a new backtest with the correct schema
        console.log('\n=== CREATING CORRECTLY STRUCTURED BACKTEST DATA ===');
        const currentDate = new Date();
        const oneWeekAgo = new Date(currentDate);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Create a backtest directly using lowercase field names to match schema
        const backtest = new Backtest({
            name: 'Test Morning Strategy Backtest',
            instrument: 'NQ',
            timeframe: '5min',
            strategyParams: {
                type: 'Trend Following',
                entryCondition: 'MA Crossover',
                exitCondition: 'Fixed Target'
            },
            // Use lowercase for these fields since that's likely what the schema expects
            timeofdday: 'Morning',
            sessiontype: 'Regular',
            startDate: oneWeekAgo,
            endDate: currentDate,
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
            }
        });

        // Try to save with both lowercase and camelCase options
        try {
            await backtest.save();
            console.log('Backtest saved successfully!');

            // Check if the backtest was saved properly
            const savedBacktest = await Backtest.findOne({ name: 'Test Morning Strategy Backtest' });
            if (savedBacktest) {
                console.log('\n=== SAVED BACKTEST DATA ===');
                console.log('Backtest ID:', savedBacktest._id);
                console.log('Field values:');
                for (const field of schemaPaths) {
                    if (field !== '_id' && field !== '__v') {
                        let value = savedBacktest.get(field);
                        // Format value for display
                        if (value && typeof value === 'object' && !(value instanceof Date)) {
                            value = JSON.stringify(value);
                        }
                        console.log(`- ${field}: ${value}`);
                    }
                }
            } else {
                console.log('Could not retrieve the saved backtest');
            }
        } catch (error) {
            console.error('Error saving backtest:', error.message);

            if (error.errors) {
                console.log('\nValidation errors:');
                Object.keys(error.errors).forEach(key => {
                    console.log(`- ${key}: ${error.errors[key].message}`);
                });
            }

            // Try alternative field names if first attempt failed
            console.log('\nTrying alternative field names...');
            try {
                // Create a new backtest with alternative field naming
                const altBacktest = new Backtest({
                    name: 'Test Morning Strategy Backtest',
                    instrument: 'NQ',
                    timeframe: '5min',
                    strategyParams: {
                        type: 'Trend Following',
                        entryCondition: 'MA Crossover',
                        exitCondition: 'Fixed Target'
                    },
                    // Try without these fields to see if they're case-sensitive
                    // timeOfDay and sessionType might be defined in code but not schema
                    startDate: oneWeekAgo,
                    endDate: currentDate,
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
                    }
                });

                await altBacktest.save();
                console.log('Backtest saved with alternative field names!');
            } catch (altError) {
                console.error('Error with alternative field names:', altError.message);
            }
        }

        // Disconnect from database
        await mongoose.disconnect();
        console.log('\nDiagnostic completed. Disconnected from database.');

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
/**
 * Simple script to check the Backtest model structure
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the database configuration
const connectDB = require('../config/database');

// Import models
const Backtest = require('../models/backtest');

// Check the model
async function checkModel() {
    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Log model schema details
        console.log('\nBacktest Schema Paths:');
        Object.keys(Backtest.schema.paths).forEach(path => {
            const isRequired = Backtest.schema.paths[path].isRequired;
            console.log(`- ${path}${isRequired ? ' (required)' : ''}`);
        });

        // Get existing test backtest
        const testBacktest = await Backtest.findOne({ name: 'Test Morning Strategy Backtest' });
        if (testBacktest) {
            console.log('\nExisting Test Backtest:');
            console.log(JSON.stringify(testBacktest, null, 2));
        } else {
            console.log('\nNo test backtest found');
        }

        // Disconnect from database
        await mongoose.disconnect();
        console.log('\nDisconnected from database');
    } catch (error) {
        console.error('Error:', error);
        try {
            await mongoose.disconnect();
        } catch (err) {
            console.error('Error disconnecting:', err);
        }
    }
}

// Run the function
checkModel();
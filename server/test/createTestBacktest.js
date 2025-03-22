/**
 * Create a test backtest with session information
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the database configuration
const connectDB = require('../config/database');

// Import models
const Backtest = require('../models/backtest');

// Create test backtest
async function createTestBacktest() {
    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Clean up any existing test data
        await Backtest.deleteMany({ name: 'Test Morning Regular Session Backtest' });
        console.log('Cleaned up any existing test backtest data');

        // Create start and end dates
        const currentDate = new Date();
        const oneWeekAgo = new Date(currentDate);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Create a new test backtest with session info in description and strategyParams
        const testBacktest = new Backtest({
            name: 'Test Morning Regular Session Backtest',
            description: 'Backtest for Morning session with Regular volatility',
            instrument: 'NQ',
            timeframe: '5min',
            strategyParams: {
                type: 'Trend Following',
                entryCondition: 'MA Crossover',
                exitCondition: 'Fixed Target',
                sessionTime: 'Morning',
                sessionType: 'Regular',
                stopLossAdjustment: 1.2,
                targetAdjustment: 1.3,
                trailingStopAdjustment: 1.1
            },
            startDate: oneWeekAgo,
            endDate: currentDate,
            performanceMetrics: {
                totalTrades: 25,
                winningTrades: 18,
                losingTrades: 7,
                winRate: 0.72,
                averageWin: 35,
                averageLoss: 25,
                netProfit: 405,
                maxDrawdown: 75,
                profitFactor: 2.4
            }
        });

        // Save the test backtest
        await testBacktest.save();
        console.log('Successfully saved test backtest with ID:', testBacktest._id);

        // Disconnect from database
        await mongoose.disconnect();
        console.log('Disconnected from database');
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
createTestBacktest();
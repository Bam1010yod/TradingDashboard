// C:\TradingDashboard\server\tools\fixUndefinedMarketData.js

/**
 * Fix Undefined Values in Market Data
 * Updates market data records with proper timeOfDay and sessionType values
 */

const mongoose = require('mongoose');

// MongoDB connection
const dbConnection = 'mongodb://localhost:27017/trading-dashboard';

// Create a schema for the market data
const marketDataSchema = new mongoose.Schema({
    timestamp: { type: Date, required: true },
    symbol: { type: String, required: true },
    atr: { type: Number, required: true },
    overnightRange: { type: Number, required: true },
    volatilityScore: { type: Number, required: true },
    volatilityLevel: { type: String, required: true },
    currentPrice: { type: Number },
    dailyVolatility: { type: Number },
    volume: { type: Number },
    trend: { type: String },
    priceRange: { type: Number },
    timeOfDay: { type: String },
    sessionType: { type: String }
});

// Get the models
let MarketData, Backtest;
try {
    MarketData = mongoose.model('MarketData');
} catch (e) {
    MarketData = mongoose.model('MarketData', marketDataSchema);
}

try {
    Backtest = mongoose.model('Backtest');
} catch (e) {
    const backtestSchema = new mongoose.Schema({}, { strict: false });
    Backtest = mongoose.model('Backtest', backtestSchema);
}

/**
 * Determine time of day based on timestamp hour
 * @param {Date} date - Timestamp
 * @returns {String} - Time of day
 */
function determineTimeOfDay(date) {
    const hour = date.getHours();

    if (hour >= 6 && hour < 10) {
        return 'Morning';
    } else if (hour >= 10 && hour < 14) {
        return 'Afternoon';
    } else if (hour >= 14 && hour < 17) {
        return 'Evening';
    } else {
        return 'Overnight';
    }
}

/**
 * Determine session type based on volatility
 * @param {String} volatilityLevel - Volatility level
 * @returns {String} - Session type
 */
function determineSessionType(volatilityLevel) {
    switch (volatilityLevel) {
        case 'HIGH':
            return 'High Volatility';
        case 'LOW':
            return 'Low Volatility';
        default:
            return 'Regular';
    }
}

/**
 * Fix undefined values in market data
 */
async function fixMarketData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(dbConnection);
        console.log('Connected to MongoDB');

        // Update market data
        console.log('Fixing market data records...');
        const marketDataPoints = await MarketData.find({
            $or: [
                { timeOfDay: { $exists: false } },
                { timeOfDay: null },
                { timeOfDay: 'undefined' },
                { sessionType: { $exists: false } },
                { sessionType: null },
                { sessionType: 'undefined' }
            ]
        });

        console.log(`Found ${marketDataPoints.length} market data points to fix`);

        let updatedCount = 0;

        for (const data of marketDataPoints) {
            const timeOfDay = determineTimeOfDay(data.timestamp);
            const sessionType = determineSessionType(data.volatilityLevel);

            await MarketData.findByIdAndUpdate(data._id, {
                timeOfDay,
                sessionType
            });

            updatedCount++;
            if (updatedCount % 10 === 0) {
                console.log(`Updated ${updatedCount} market data points`);
            }
        }

        console.log(`Updated ${updatedCount} market data points`);

        // Update backtests
        console.log('Fixing backtest records...');
        const backtests = await Backtest.find({
            $or: [
                { 'strategyParams.sessionTime': 'undefined' },
                { 'strategyParams.sessionType': 'undefined' },
                { name: /undefined/ }
            ]
        });

        console.log(`Found ${backtests.length} backtests to fix`);

        updatedCount = 0;

        for (const backtest of backtests) {
            // Try to get market conditions from the backtest
            const marketConditions = backtest.strategyParams?.marketConditions;

            // Determine timeOfDay and sessionType
            let timeOfDay = 'Morning';  // Default value
            let sessionType = 'Regular'; // Default value

            if (marketConditions) {
                if (marketConditions.timeOfDay && marketConditions.timeOfDay !== 'undefined') {
                    timeOfDay = marketConditions.timeOfDay;
                } else if (backtest.endDate) {
                    timeOfDay = determineTimeOfDay(new Date(backtest.endDate));
                }

                if (marketConditions.sessionType && marketConditions.sessionType !== 'undefined') {
                    sessionType = marketConditions.sessionType;
                } else if (marketConditions.volatilityLevel) {
                    sessionType = determineSessionType(marketConditions.volatilityLevel);
                }
            }

            // Update the backtest
            const updatedName = backtest.name.replace('undefined undefined', `${timeOfDay} ${sessionType}`);

            await Backtest.findByIdAndUpdate(backtest._id, {
                name: updatedName,
                'strategyParams.sessionTime': timeOfDay,
                'strategyParams.sessionType': sessionType,
                'strategyParams.marketConditions.timeOfDay': timeOfDay,
                'strategyParams.marketConditions.sessionType': sessionType
            });

            updatedCount++;
        }

        console.log(`Updated ${updatedCount} backtests`);

        console.log('Fixes completed successfully');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error fixing data:', error);
        try {
            await mongoose.disconnect();
        } catch (e) {
            // Ignore
        }
    }
}

// Run the fixer
fixMarketData()
    .then(() => {
        console.log('Data fix process completed');
    })
    .catch(err => {
        console.error('Error in data fix process:', err);
    });
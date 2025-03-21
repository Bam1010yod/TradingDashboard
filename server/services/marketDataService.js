/**
 * Market Data Service
 * Reads data exported by the NinjaTrader MarketDataExporter indicator
 * and makes it available to the trading system
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Path to the data file exported by the NinjaTrader indicator
const MARKET_DATA_PATH = 'C:\\NinjaTraderData\\VolatilityMetrics.json';

// How often to check for updates (in milliseconds)
const POLLING_INTERVAL = 5000; // 5 seconds

// In-memory cache of the latest market data
let currentMarketData = null;
let lastUpdateTime = null;

/**
 * Initialize the market data service
 * @param {Object} io - Socket.io instance for real-time updates
 */
const initialize = (io) => {
    console.log('Initializing Market Data Service...');

    // Create MongoDB schema for market data if it doesn't exist yet
    try {
        const MarketData = mongoose.model('MarketData');
        console.log('MarketData model already exists');
    } catch (error) {
        const marketDataSchema = new mongoose.Schema({
            timestamp: { type: Date, required: true },
            symbol: { type: String, required: true },
            atr: { type: Number, required: true },
            overnightRange: { type: Number, required: true },
            volatilityScore: { type: Number, required: true },
            volatilityLevel: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        });

        mongoose.model('MarketData', marketDataSchema);
        console.log('MarketData model created');
    }

    // Start the polling process
    startPolling(io);

    console.log('Market Data Service initialized');
    return true;
};

/**
 * Start polling for market data updates
 * @param {Object} io - Socket.io instance for real-time updates
 */
const startPolling = (io) => {
    setInterval(async () => {
        try {
            const updated = await checkForUpdates();

            if (updated && io) {
                // Emit the updated market data to connected clients
                io.emit('marketDataUpdate', currentMarketData);
                console.log('Market data update emitted to clients');
            }
        } catch (error) {
            console.error('Error in market data polling:', error);
        }
    }, POLLING_INTERVAL);

    console.log(`Market data polling started (interval: ${POLLING_INTERVAL}ms)`);
};

/**
 * Check for updates to the market data file
 * @returns {boolean} - Whether the data was updated
 */
const checkForUpdates = async () => {
    try {
        // Check if the file exists
        if (!fs.existsSync(MARKET_DATA_PATH)) {
            console.log(`Market data file not found at ${MARKET_DATA_PATH}`);
            return false;
        }

        // Get file stats to check modification time
        const stats = fs.statSync(MARKET_DATA_PATH);

        // If we've already processed this version of the file, skip
        if (lastUpdateTime && stats.mtime <= lastUpdateTime) {
            return false;
        }

        // Read and parse the file
        const rawData = fs.readFileSync(MARKET_DATA_PATH, 'utf8');
        const marketData = JSON.parse(rawData);

        // Update the timestamp to a proper Date object
        marketData.timestamp = new Date(marketData.timestamp);

        // Store the data in memory
        currentMarketData = marketData;
        lastUpdateTime = stats.mtime;

        // Save to database for historical tracking
        await saveToDatabase(marketData);

        console.log(`Market data updated: ${marketData.symbol} - Volatility: ${marketData.volatilityLevel}`);
        return true;
    } catch (error) {
        console.error('Error checking for market data updates:', error);
        return false;
    }
};

/**
 * Save market data to the database
 * @param {Object} marketData - The market data to save
 */
const saveToDatabase = async (marketData) => {
    try {
        const MarketData = mongoose.model('MarketData');

        // Create a new record
        const newMarketData = new MarketData(marketData);
        await newMarketData.save();

        console.log('Market data saved to database');
        return true;
    } catch (error) {
        console.error('Error saving market data to database:', error);
        return false;
    }
};

/**
 * Get the latest market data
 * @returns {Object} - The latest market data
 */
const getLatestMarketData = () => {
    return currentMarketData;
};

/**
 * Get historical market data for a specific time range
 * @param {Date} startDate - Start of the time range
 * @param {Date} endDate - End of the time range
 * @returns {Array} - Array of market data points
 */
const getHistoricalMarketData = async (startDate, endDate) => {
    try {
        const MarketData = mongoose.model('MarketData');

        const data = await MarketData.find({
            timestamp: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ timestamp: 1 });

        return data;
    } catch (error) {
        console.error('Error retrieving historical market data:', error);
        return [];
    }
};

module.exports = {
    initialize,
    getLatestMarketData,
    getHistoricalMarketData
};
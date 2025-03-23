/**
 * Market Data Collection Service
 * Monitors the NinjaTrader export file and stores market data in MongoDB
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// MongoDB connection
const dbConnection = 'mongodb://localhost:27017/trading-dashboard';

// Path to the NinjaTrader export file
const volatilityFilePath = 'C:\\NinjaTraderData\\VolatilityMetrics.json';

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

// Create indexes for efficient queries
marketDataSchema.index({ timestamp: 1 });
marketDataSchema.index({ timestamp: 1, symbol: 1 }, { unique: true });
marketDataSchema.index({ volatilityLevel: 1, timeOfDay: 1 });

// Create or get the model
let MarketData;
try {
    MarketData = mongoose.model('MarketData');
} catch (e) {
    MarketData = mongoose.model('MarketData', marketDataSchema);
}

/**
 * Determine time of day based on current hour
 * @param {Date} date - Current date
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
 * @param {String} volatilityLevel - Volatility level from export
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
 * Process the volatility file and store the data
 */
// Update to the processVolatilityFile function in collectMarketData.js
async function processVolatilityFile() {
    try {
        // Check if file exists
        if (!fs.existsSync(volatilityFilePath)) {
            console.log('Volatility file not found. Waiting for NinjaTrader to create it.');
            return;
        }

        // Read and parse the file
        const fileContent = fs.readFileSync(volatilityFilePath, 'utf8');
        const marketData = JSON.parse(fileContent);

        // Add additional fields
        const timestamp = new Date(marketData.timestamp);

        // Ensure timeOfDay is set properly
        const timeOfDay = determineTimeOfDay(timestamp);
        marketData.timeOfDay = timeOfDay;

        // Ensure sessionType is set properly
        const sessionType = determineSessionType(marketData.volatilityLevel);
        marketData.sessionType = sessionType;

        console.log(`Processing data point: Time: ${timeOfDay}, Session: ${sessionType}, Volatility: ${marketData.volatilityLevel}`);

        // For demonstration, add some random values for fields not in the export
        marketData.currentPrice = Math.round(Math.random() * 1000 + 18000); // Random NQ price
        marketData.dailyVolatility = marketData.volatilityScore / 5;
        marketData.volume = Math.round(Math.random() * 10000 + 5000);
        marketData.trend = Math.random() > 0.5 ? 'bullish' : 'bearish';
        marketData.priceRange = Math.round(marketData.atr * (0.8 + Math.random() * 0.4));

        // Store in database
        await MarketData.findOneAndUpdate(
            { timestamp: timestamp, symbol: marketData.symbol },
            marketData,
            { upsert: true, new: true }
        );

        console.log(`Stored market data for ${marketData.symbol} at ${timestamp}`);
        console.log(`Volatility: ${marketData.volatilityLevel}, Session: ${sessionType}, Time: ${timeOfDay}`);

    } catch (error) {
        console.error('Error processing volatility file:', error);
    }
}

/**
 * Main function to monitor and collect market data
 */
async function collectMarketData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(dbConnection);
        console.log('Connected to MongoDB');

        console.log('Starting market data collection service...');
        console.log(`Monitoring file: ${volatilityFilePath}`);

        // Process immediately if file exists
        await processVolatilityFile();

        // Set up file watcher
        fs.watch(path.dirname(volatilityFilePath), async (eventType, filename) => {
            if (filename === path.basename(volatilityFilePath) && eventType === 'change') {
                console.log('Volatility file updated');

                // Add a small delay to ensure file is completely written
                setTimeout(async () => {
                    await processVolatilityFile();
                }, 1000);
            }
        });

        console.log('File watcher set up. Waiting for updates...');

        // Set up interval processing as backup
        setInterval(async () => {
            await processVolatilityFile();
        }, 5 * 60 * 1000); // Every 5 minutes

    } catch (error) {
        console.error('Error in market data collection service:', error);
        try {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        } catch (e) {
            // Ignore
        }

        // Restart after a delay
        setTimeout(() => {
            collectMarketData();
        }, 60 * 1000);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('Shutting down market data collection service...');
    try {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (e) {
        // Ignore
    }
    process.exit(0);
});

// Start the collection service
collectMarketData()
    .then(() => {
        console.log('Market data collection service started');
    })
    .catch(err => {
        console.error('Error starting market data collection service:', err);
    });
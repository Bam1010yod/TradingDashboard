/**
 * Backtest Data Generator
 * Creates simulated backtests based on collected market data
 */

const mongoose = require('mongoose');
const Backtest = require('../models/backtest');

// MongoDB connection
const dbConnection = 'mongodb://localhost:27017/trading-dashboard';

// Get the MarketData model
let MarketData;
try {
    MarketData = mongoose.model('MarketData');
} catch (e) {
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

    MarketData = mongoose.model('MarketData', marketDataSchema);
}

/**
 * Generate simulated backtest results based on market conditions
 * @param {Object} marketData - Market data point
 * @returns {Object} - Simulated backtest performance
 */
function simulateBacktestPerformance(marketData) {
    // Base win rate and profit factor values
    let baseWinRate = 55; // 55%
    let baseProfitFactor = 1.2;

    // Adjust based on volatility
    if (marketData.volatilityLevel === 'HIGH') {
        // High volatility tends to be more challenging
        baseWinRate -= 10;
        baseProfitFactor -= 0.3;
    } else if (marketData.volatilityLevel === 'LOW') {
        // Low volatility may be more predictable
        baseWinRate += 5;
        baseProfitFactor += 0.1;
    }

    // Add some randomness
    const winRate = baseWinRate + (Math.random() * 20 - 10); // +/- 10%
    const profitFactor = baseProfitFactor + (Math.random() * 0.6 - 0.3); // +/- 0.3

    // Total trade count
    const totalTrades = Math.floor(Math.random() * 20) + 10; // 10-30 trades

    // Calculate winning and losing trades
    const winningTrades = Math.round(totalTrades * (winRate / 100));
    const losingTrades = totalTrades - winningTrades;

    // Average win and loss (in points for NQ)
    const averageWin = Math.round(Math.random() * 20) + 30; // 30-50 points
    const averageLoss = Math.round(Math.random() * 10) + 20; // 20-30 points

    // Calculate net profit
    const netProfit = (winningTrades * averageWin) - (losingTrades * averageLoss);

    // Calculate max drawdown (typically 30-70% of gross loss)
    const maxDrawdown = Math.round((losingTrades * averageLoss) * (0.3 + Math.random() * 0.4));

    return {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        averageWin,
        averageLoss,
        netProfit,
        maxDrawdown,
        profitFactor
    };
}

/**
 * Generate strategy parameters based on market conditions
 * @param {Object} marketData - Market data point
 * @returns {Object} - Strategy parameters
 */
function generateStrategyParams(marketData) {
    // Base parameter values
    let stopLoss = 25;
    let target = 50;
    let trailingStop = 20;

    // Adjust based on volatility
    if (marketData.volatilityLevel === 'HIGH') {
        // Wider parameters for high volatility
        stopLoss = Math.round(stopLoss * 1.4);
        target = Math.round(target * 1.3);
        trailingStop = Math.round(trailingStop * 1.5);
    } else if (marketData.volatilityLevel === 'LOW') {
        // Tighter parameters for low volatility
        stopLoss = Math.round(stopLoss * 0.8);
        target = Math.round(target * 0.9);
        trailingStop = Math.round(trailingStop * 0.7);
    }

    // Add some randomness
    stopLoss = Math.max(10, Math.round(stopLoss * (0.9 + Math.random() * 0.2)));
    target = Math.max(20, Math.round(target * (0.9 + Math.random() * 0.2)));
    trailingStop = Math.max(5, Math.round(trailingStop * (0.9 + Math.random() * 0.2)));

    return {
        sessionTime: marketData.timeOfDay,
        sessionType: marketData.sessionType,
        stopLoss,
        target,
        trailingStop,
        // Include market conditions from the data point
        marketConditions: {
            atr: marketData.atr,
            volume: marketData.volume || 0,
            volatilityScore: marketData.volatilityScore,
            volatilityLevel: marketData.volatilityLevel,
            trend: marketData.trend || 'neutral',
            overnightRange: marketData.overnightRange,
            priceRange: marketData.priceRange || 0,
            dailyVolatility: marketData.dailyVolatility || 0,
            sessionType: marketData.sessionType,
            timeOfDay: marketData.timeOfDay
        }
    };
}

/**
 * Main function to generate backtests from market data
 */
async function generateBacktests() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(dbConnection);
        console.log('Connected to MongoDB');

        // Get market data count
        const marketDataCount = await MarketData.countDocuments({});
        console.log(`Found ${marketDataCount} market data points`);

        if (marketDataCount === 0) {
            console.log('No market data available. Please run the data collection service first.');
            await mongoose.disconnect();
            return;
        }

        // Get existing backtest count
        const existingBacktests = await Backtest.countDocuments({});
        console.log(`Found ${existingBacktests} existing backtests`);

        // Define how many backtests to generate
        const targetCount = 50;
        const additionalNeeded = Math.max(0, targetCount - existingBacktests);

        if (additionalNeeded === 0) {
            console.log('Already have enough backtests. No new ones needed.');
            await mongoose.disconnect();
            return;
        }

        console.log(`Generating ${additionalNeeded} additional backtests`);

        // Get unique combinations of timeOfDay and sessionType
        const marketConditions = await MarketData.aggregate([
            {
                $group: {
                    _id: {
                        timeOfDay: "$timeOfDay",
                        sessionType: "$sessionType",
                        volatilityLevel: "$volatilityLevel"
                    },
                    count: { $sum: 1 }
                }
            },
            { $match: { count: { $gt: 0 } } },
            { $sort: { count: -1 } }
        ]);

        console.log(`Found ${marketConditions.length} unique market condition combinations`);

        // Determine how many backtests to generate per condition
        const backtestsPerCondition = Math.ceil(additionalNeeded / Math.max(1, marketConditions.length));

        let generatedCount = 0;

        // Process each condition
        for (const condition of marketConditions) {
            if (generatedCount >= additionalNeeded) break;

            const timeOfDay = condition._id.timeOfDay;
            const sessionType = condition._id.sessionType;
            const volatilityLevel = condition._id.volatilityLevel;

            console.log(`Generating backtests for ${timeOfDay} - ${sessionType} - ${volatilityLevel}`);

            // Get market data for this condition
            const marketData = await MarketData.find({
                timeOfDay,
                sessionType,
                volatilityLevel
            }).sort({ timestamp: -1 }).limit(backtestsPerCondition);

            console.log(`Found ${marketData.length} market data points for this condition`);

            // Generate backtests
            for (const data of marketData) {
                if (generatedCount >= additionalNeeded) break;

                // Generate strategy parameters
                const strategyParams = generateStrategyParams(data);

                // Simulate backtest performance
                const performanceMetrics = simulateBacktestPerformance(data);

                // Create the backtest
                const backtest = new Backtest({
                    name: `${timeOfDay} ${sessionType} Backtest ${new Date().toISOString().slice(0, 10)}`,
                    description: `Backtest for ${timeOfDay} session with ${sessionType} (${volatilityLevel} volatility)`,
                    strategyParams,
                    instrument: data.symbol || 'NQ',
                    timeframe: '5 min',
                    startDate: new Date(data.timestamp.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
                    endDate: data.timestamp,
                    trades: [], // Would be populated by actual backtest
                    performanceMetrics
                });

                // Save the backtest
                await backtest.save();
                generatedCount++;

                console.log(`Generated backtest ${generatedCount}/${additionalNeeded}: ${backtest.name}`);
            }
        }

        console.log(`Generated ${generatedCount} new backtests`);
        console.log(`Total backtests now: ${existingBacktests + generatedCount}`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error generating backtests:', error);
        try {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        } catch (e) {
            // Ignore
        }
    }
}

// Run the generator
generateBacktests()
    .then(() => {
        console.log('Backtest generation completed');
    })
    .catch(err => {
        console.error('Error in backtest generation process:', err);
    });
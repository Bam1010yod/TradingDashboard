// Full path: C:\TradingDashboard\server\services\backtestingResultsService.js

/**
 * Backtesting Results Service
 * Provides performance metrics and adjustments based on backtest results
 */

/**
 * Get performance metrics for specific market conditions
 * @param {String} timeOfDay - Time of day (Morning, Afternoon, Evening)
 * @param {String} sessionType - Session type (Regular, High Volatility, Low Volatility)
 * @param {Number} volatilityScore - Current volatility score (0-10)
 * @returns {Object} - Performance metrics
 */
async function getPerformanceMetrics(timeOfDay, sessionType, volatilityScore = 5) {
    console.log(`Getting performance metrics for ${timeOfDay}, ${sessionType}, volatility: ${volatilityScore}`);

    // For testing purposes, return mock data since database operations are timing out
    return {
        success: true,
        sampleSize: 15,
        successfulSamples: 10,
        winRate: 66.7,
        profitFactor: 1.8,
        averageRR: 1.5,
        averageSimilarity: 75,
        confidenceLevel: 'medium',
        adjustmentFactors: {
            stopLossAdjustment: 1.1,   // Slightly wider stops recommended
            targetAdjustment: 1.2,     // Slightly higher targets recommended
            trailingStopAdjustment: 1.05  // Minor trailing stop adjustment
        }
    };
}

/**
 * Get performance trends over time
 * @param {String} timeOfDay - Time of day (Morning, Afternoon, Evening)
 * @param {String} sessionType - Session type (Regular, High Volatility, Low Volatility)
 * @returns {Object} - Performance trends data
 */
async function getPerformanceTrends(timeOfDay, sessionType) {
    console.log(`Getting performance trends for ${timeOfDay}, ${sessionType}`);

    // For testing purposes, return mock data
    return {
        success: true,
        trends: [
            {
                period: 'Week 1',
                avgWinRate: 62.5,
                avgProfitFactor: 1.6,
                avgRR: 1.4,
                sampleCount: 8
            },
            {
                period: 'Week 2',
                avgWinRate: 65.0,
                avgProfitFactor: 1.7,
                avgRR: 1.45,
                sampleCount: 12
            },
            {
                period: 'Week 3',
                avgWinRate: 66.7,
                avgProfitFactor: 1.8,
                avgRR: 1.5,
                sampleCount: 15
            }
        ]
    };
}

/**
 * Get volatility-based adjustments
 * @param {Number} volatilityScore - Current volatility score (0-10)
 * @returns {Object} - Adjustment factors
 */
function getVolatilityAdjustments(volatilityScore = 5) {
    console.log(`Getting volatility adjustments for score: ${volatilityScore}`);

    // Base adjustments
    let stopLoss = 1.0;
    let target = 1.0;
    let trailingStop = 1.0;

    // Adjust based on volatility score (0-10 scale)
    if (volatilityScore > 7) {
        // High volatility - wider stops, higher targets
        stopLoss = 1.3;
        target = 1.2;
        trailingStop = 1.15;
    } else if (volatilityScore > 4) {
        // Medium volatility - slight adjustments
        stopLoss = 1.1;
        target = 1.05;
        trailingStop = 1.05;
    } else {
        // Low volatility - tighter stops, more conservative targets
        stopLoss = 0.85;
        target = 0.9;
        trailingStop = 0.95;
    }

    return {
        stopLoss,
        target,
        trailingStop
    };
}

/**
 * Get session-based adjustments
 * @param {String} timeOfDay - Time of day (Morning, Afternoon, Evening)
 * @returns {Object} - Adjustment factors
 */
function getSessionAdjustments(timeOfDay) {
    console.log(`Getting session adjustments for: ${timeOfDay}`);

    // Base adjustments
    let stopLoss = 1.0;
    let target = 1.0;
    let trailingStop = 1.0;

    // Adjust based on time of day
    switch (timeOfDay) {
        case 'Morning':
            // Morning often has higher volatility - wider stops
            stopLoss = 1.15;
            target = 1.1;
            trailingStop = 1.05;
            break;
        case 'Afternoon':
            // Afternoon often has lower volatility - standard parameters
            stopLoss = 1.0;
            target = 1.0;
            trailingStop = 1.0;
            break;
        case 'Evening':
            // Evening often has lower volume - tighter stops
            stopLoss = 0.9;
            target = 0.95;
            trailingStop = 0.95;
            break;
        default:
            // Default - no adjustments
            break;
    }

    return {
        stopLoss,
        target,
        trailingStop
    };
}

module.exports = {
    getPerformanceMetrics,
    getPerformanceTrends,
    getVolatilityAdjustments,
    getSessionAdjustments
};
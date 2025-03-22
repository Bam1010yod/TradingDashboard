/**
 * Backtesting Results Service
 * This service analyzes backtesting results to improve recommendation accuracy
 */

const mongoose = require('mongoose');
const Backtest = require('../models/backtest');

/**
 * Get performance metrics for specific market conditions
 * @param {String} timeOfDay - Time of day (Morning, Afternoon, Evening)
 * @param {String} sessionType - Session type (Regular, High Volatility, Low Volatility)
 * @param {Number} volatilityLevel - Volatility level (1-10)
 * @returns {Object} - Performance metrics
 */
async function getPerformanceMetrics(timeOfDay, sessionType, volatilityLevel) {
    try {
        console.log(`Looking for backtests matching: ${timeOfDay} session, ${sessionType} type, volatility ~${volatilityLevel}`);

        // Since timeOfDay and sessionType aren't schema fields, we need to look for them in the description
        // or strategyParams which might contain this information
        const backtestResults = await Backtest.find({
            $or: [
                { description: { $regex: timeOfDay, $options: 'i' } },
                { description: { $regex: sessionType, $options: 'i' } },
                { 'strategyParams.sessionTime': { $regex: timeOfDay, $options: 'i' } },
                { 'strategyParams.sessionType': { $regex: sessionType, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 }).limit(20);

        console.log(`Found ${backtestResults.length} potential matching backtests`);

        if (!backtestResults || backtestResults.length === 0) {
            console.log('No backtest results found for the specified conditions');
            return {
                success: false,
                adjustmentFactors: getDefaultAdjustmentFactors(),
                confidenceLevel: 'low'
            };
        }

        // Calculate performance metrics
        let totalWinRate = 0;
        let totalProfitFactor = 0;
        let optimalStopLossAdjustment = 0;
        let optimalTargetAdjustment = 0;
        let optimalTrailingStopAdjustment = 0;
        let successfulBacktests = 0;

        backtestResults.forEach(result => {
            // Extract metrics from performanceMetrics if available
            if (result.performanceMetrics) {
                const winRate = result.performanceMetrics.winRate ||
                    (result.performanceMetrics.winningTrades / result.performanceMetrics.totalTrades) || 0;

                totalWinRate += winRate;
                totalProfitFactor += result.performanceMetrics.profitFactor || 1;

                // Consider a backtest successful if win rate > 50%
                if (winRate > 0.5) {
                    successfulBacktests++;

                    // Extract adjustment factors from strategyParams if available
                    if (result.strategyParams) {
                        optimalStopLossAdjustment += result.strategyParams.stopLossAdjustment || 1;
                        optimalTargetAdjustment += result.strategyParams.targetAdjustment || 1;
                        optimalTrailingStopAdjustment += result.strategyParams.trailingStopAdjustment || 1;
                    }
                }
            }
        });

        // Calculate average metrics
        const avgWinRate = backtestResults.length > 0 ? totalWinRate / backtestResults.length : 0;
        const avgProfitFactor = backtestResults.length > 0 ? totalProfitFactor / backtestResults.length : 0;

        // Calculate optimal adjustment factors based on successful backtests
        const adjustmentFactors = {
            stopLossAdjustment: successfulBacktests > 0
                ? optimalStopLossAdjustment / successfulBacktests
                : 1,
            targetAdjustment: successfulBacktests > 0
                ? optimalTargetAdjustment / successfulBacktests
                : 1,
            trailingStopAdjustment: successfulBacktests > 0
                ? optimalTrailingStopAdjustment / successfulBacktests
                : 1
        };

        // Determine confidence level based on number of relevant backtests
        let confidenceLevel = 'low';
        if (backtestResults.length >= 10) {
            confidenceLevel = 'high';
        } else if (backtestResults.length >= 5) {
            confidenceLevel = 'medium';
        }

        return {
            success: true,
            winRate: avgWinRate,
            profitFactor: avgProfitFactor,
            sampleSize: backtestResults.length,
            successfulSamples: successfulBacktests,
            adjustmentFactors,
            confidenceLevel,
            timeOfDay,
            sessionType,
            volatilityLevel
        };
    } catch (error) {
        console.error('Error getting backtest performance metrics:', error);
        return {
            success: false,
            adjustmentFactors: getDefaultAdjustmentFactors(),
            confidenceLevel: 'low'
        };
    }
}

/**
 * Get default adjustment factors when no backtest data is available
 * @returns {Object} - Default adjustment factors
 */
function getDefaultAdjustmentFactors() {
    return {
        stopLossAdjustment: 1,
        targetAdjustment: 1,
        trailingStopAdjustment: 1
    };
}

/**
 * Get optimal parameter adjustments based on volatility
 * @param {Number} volatilityLevel - Volatility level (1-10)
 * @returns {Object} - Volatility-based adjustment recommendations
 */
function getVolatilityAdjustments(volatilityLevel) {
    // Map volatility level to adjustment factors
    const volatilityMap = {
        // Very low volatility (1-2)
        1: { stopLoss: 0.8, target: 0.8, trailingStop: 0.8 },
        2: { stopLoss: 0.9, target: 0.9, trailingStop: 0.9 },
        // Low volatility (3-4)
        3: { stopLoss: 0.95, target: 0.95, trailingStop: 0.95 },
        4: { stopLoss: 1.0, target: 1.0, trailingStop: 1.0 },
        // Medium volatility (5-6)
        5: { stopLoss: 1.0, target: 1.0, trailingStop: 1.0 },
        6: { stopLoss: 1.05, target: 1.05, trailingStop: 1.05 },
        // High volatility (7-8)
        7: { stopLoss: 1.1, target: 1.1, trailingStop: 1.1 },
        8: { stopLoss: 1.2, target: 1.2, trailingStop: 1.2 },
        // Very high volatility (9-10)
        9: { stopLoss: 1.3, target: 1.3, trailingStop: 1.3 },
        10: { stopLoss: 1.4, target: 1.4, trailingStop: 1.4 }
    };

    const level = Math.max(1, Math.min(10, Math.round(volatilityLevel)));
    return volatilityMap[level] || volatilityMap[5]; // Default to medium volatility if level not found
}

/**
 * Get session-based parameter adjustments
 * @param {String} timeOfDay - Time of day (Morning, Afternoon, Evening)
 * @returns {Object} - Session-based adjustment recommendations
 */
function getSessionAdjustments(timeOfDay) {
    const sessionAdjustments = {
        'Morning': {
            stopLoss: 1.1,    // Morning often has higher volatility at open
            target: 1.15,     // Potentially larger moves at open
            trailingStop: 1.1
        },
        'Afternoon': {
            stopLoss: 1.0,    // Mid-day often more stable
            target: 1.0,
            trailingStop: 1.0
        },
        'Evening': {
            stopLoss: 1.05,   // Can have late day volatility
            target: 1.05,
            trailingStop: 1.05
        }
    };

    return sessionAdjustments[timeOfDay] || sessionAdjustments['Afternoon'];
}

module.exports = {
    getPerformanceMetrics,
    getVolatilityAdjustments,
    getSessionAdjustments
};
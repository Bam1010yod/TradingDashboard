/**
 * Enhanced Backtesting Results Service
 * This service analyzes backtesting results to improve recommendation accuracy
 * with pattern recognition and performance clustering
 */

const mongoose = require('mongoose');
const Backtest = require('../models/backtest');

/**
 * Get performance metrics for specific market conditions with enhanced matching
 * @param {String} timeOfDay - Time of day (Morning, Afternoon, Evening)
 * @param {String} sessionType - Session type (Regular, High Volatility, Low Volatility)
 * @param {Number} volatilityLevel - Volatility level (1-10)
 * @returns {Object} - Performance metrics and adjustment factors
 */
async function getPerformanceMetrics(timeOfDay, sessionType, volatilityLevel) {
    try {
        console.log(`Looking for backtests matching: ${timeOfDay} session, ${sessionType} type, volatility ~${volatilityLevel}`);

        // Step 1: Get recent backtests that might be relevant (wider initial filter)
        const potentialBacktests = await Backtest.find({
            $or: [
                { description: { $regex: timeOfDay, $options: 'i' } },
                { description: { $regex: sessionType, $options: 'i' } },
                { 'strategyParams.sessionTime': { $regex: timeOfDay, $options: 'i' } },
                { 'strategyParams.sessionType': { $regex: sessionType, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 }).limit(50);

        console.log(`Found ${potentialBacktests.length} potential matching backtests`);

        if (!potentialBacktests || potentialBacktests.length === 0) {
            console.log('No backtest results found for the specified conditions');
            return {
                success: false,
                adjustmentFactors: getDefaultAdjustmentFactors(),
                confidenceLevel: 'low'
            };
        }

        // Step 2: Calculate similarity scores for each backtest
        const scoredBacktests = potentialBacktests.map(backtest => {
            const volatilitySimilarity = calculateVolatilitySimilarity(
                getBacktestVolatility(backtest),
                volatilityLevel
            );

            const sessionSimilarity = calculateSessionSimilarity(
                getBacktestSessionTime(backtest),
                timeOfDay
            );

            const typeSimilarity = calculateSessionTypeSimilarity(
                getBacktestSessionType(backtest),
                sessionType
            );

            // Calculate overall similarity score (0-100)
            const similarityScore = (
                volatilitySimilarity * 0.5 +
                sessionSimilarity * 0.3 +
                typeSimilarity * 0.2
            ) * 100;

            return {
                backtest,
                similarityScore
            };
        });

        // Step 3: Sort by similarity score and take the top matches
        const sortedBacktests = scoredBacktests
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, 20);

        console.log(`Selected top ${sortedBacktests.length} most relevant backtests based on similarity`);

        // Step 4: Calculate aggregated performance metrics from relevant backtests
        const relevantBacktests = sortedBacktests.map(item => item.backtest);
        const weightedMetrics = calculateWeightedMetrics(relevantBacktests, sortedBacktests);

        // Step 5: Create adjustment factors based on successful backtests
        const adjustmentFactors = deriveOptimalAdjustments(
            relevantBacktests,
            sortedBacktests,
            volatilityLevel
        );

        // Step 6: Determine confidence level based on quality of matches
        let confidenceLevel = 'low';
        const averageSimilarity = sortedBacktests.reduce((sum, item) => sum + item.similarityScore, 0) /
            (sortedBacktests.length || 1);

        if (sortedBacktests.length >= 10 && averageSimilarity > 75) {
            confidenceLevel = 'high';
        } else if (sortedBacktests.length >= 5 && averageSimilarity > 60) {
            confidenceLevel = 'medium';
        }

        return {
            success: true,
            winRate: weightedMetrics.winRate,
            profitFactor: weightedMetrics.profitFactor,
            averageRR: weightedMetrics.averageRR,
            sampleSize: relevantBacktests.length,
            successfulSamples: weightedMetrics.successfulSamples,
            adjustmentFactors,
            confidenceLevel,
            averageSimilarity,
            timeOfDay,
            sessionType,
            volatilityLevel
        };
    } catch (error) {
        console.error('Error getting enhanced backtest performance metrics:', error);
        return {
            success: false,
            adjustmentFactors: getDefaultAdjustmentFactors(),
            confidenceLevel: 'low'
        };
    }
}

/**
 * Calculate weighted performance metrics based on similarity scores
 * @param {Array} backtests - Array of backtest objects
 * @param {Array} scoredBacktests - Array of backtests with similarity scores
 * @returns {Object} - Weighted performance metrics
 */
function calculateWeightedMetrics(backtests, scoredBacktests) {
    let totalWeightedWinRate = 0;
    let totalWeightedProfitFactor = 0;
    let totalWeightedRR = 0;
    let totalWeight = 0;
    let successfulBacktests = 0;

    // Create a map of backtest ID to similarity score for faster lookup
    const scoreMap = {};
    scoredBacktests.forEach(item => {
        scoreMap[item.backtest._id.toString()] = item.similarityScore;
    });

    backtests.forEach(backtest => {
        if (!backtest.performanceMetrics) return;

        const similarity = scoreMap[backtest._id.toString()] || 50; // Default to 50 if not found
        const weight = similarity / 100; // Convert to 0-1 scale for weighting
        totalWeight += weight;

        // Calculate weighted metrics
        const winRate = backtest.performanceMetrics.winRate ||
            (backtest.performanceMetrics.winningTrades / backtest.performanceMetrics.totalTrades) || 0;

        totalWeightedWinRate += winRate * weight;

        const profitFactor = backtest.performanceMetrics.profitFactor || 1;
        totalWeightedProfitFactor += profitFactor * weight;

        const riskRewardRatio = backtest.performanceMetrics.averageRR ||
            backtest.performanceMetrics.riskRewardRatio || 1;
        totalWeightedRR += riskRewardRatio * weight;

        // Count successful backtests
        if (winRate > 0.5 && profitFactor > 1.2) {
            successfulBacktests++;
        }
    });

    // Normalize by total weight
    const normalizedWeight = totalWeight || 1; // Avoid division by zero

    return {
        winRate: totalWeightedWinRate / normalizedWeight,
        profitFactor: totalWeightedProfitFactor / normalizedWeight,
        averageRR: totalWeightedRR / normalizedWeight,
        successfulSamples: successfulBacktests
    };
}

/**
 * Derive optimal parameter adjustments based on successful backtest strategies
 * @param {Array} backtests - Array of backtest objects
 * @param {Array} scoredBacktests - Array of backtests with similarity scores
 * @param {Number} currentVolatility - Current volatility level
 * @returns {Object} - Optimized adjustment factors
 */
function deriveOptimalAdjustments(backtests, scoredBacktests, currentVolatility) {
    // Initialize adjustment trackers
    let stopLossAdjustments = [];
    let targetAdjustments = [];
    let trailingStopAdjustments = [];

    // Create a map of backtest ID to similarity score for faster lookup
    const scoreMap = {};
    scoredBacktests.forEach(item => {
        scoreMap[item.backtest._id.toString()] = item.similarityScore;
    });

    // Collect adjustment factors from successful backtests
    backtests.forEach(backtest => {
        if (!backtest.performanceMetrics) return;

        const similarity = scoreMap[backtest._id.toString()] || 50;
        const weight = similarity / 100; // Convert to 0-1 scale for weighting

        // Only consider successful backtests for parameter adjustments
        const winRate = backtest.performanceMetrics.winRate ||
            (backtest.performanceMetrics.winningTrades / backtest.performanceMetrics.totalTrades) || 0;
        const profitFactor = backtest.performanceMetrics.profitFactor || 1;

        if (winRate > 0.5 && profitFactor > 1.2) {
            // Extract adjustment factors, fallback to defaults if not available
            const params = backtest.strategyParams || {};

            // Record adjustments with their weight (based on similarity)
            stopLossAdjustments.push({
                value: params.stopLossAdjustment || 1,
                weight: weight,
                profitFactor: profitFactor // Use profit factor as additional weighting
            });

            targetAdjustments.push({
                value: params.targetAdjustment || 1,
                weight: weight,
                profitFactor: profitFactor
            });

            trailingStopAdjustments.push({
                value: params.trailingStopAdjustment || 1,
                weight: weight,
                profitFactor: profitFactor
            });
        }
    });

    // Calculate weighted average adjustments if we have data
    const defaultFactors = getDefaultAdjustmentFactors();

    let stopLossAdjustment = calculateWeightedAdjustment(stopLossAdjustments, defaultFactors.stopLossAdjustment);
    let targetAdjustment = calculateWeightedAdjustment(targetAdjustments, defaultFactors.targetAdjustment);
    let trailingStopAdjustment = calculateWeightedAdjustment(trailingStopAdjustments, defaultFactors.trailingStopAdjustment);

    // Apply volatility-based fine-tuning
    const volatilityFactor = Math.max(0.8, Math.min(1.2, currentVolatility / 5)); // Scale around 1.0

    return {
        stopLossAdjustment: normalizeAdjustment(stopLossAdjustment * volatilityFactor),
        targetAdjustment: normalizeAdjustment(targetAdjustment * volatilityFactor),
        trailingStopAdjustment: normalizeAdjustment(trailingStopAdjustment * volatilityFactor)
    };
}

/**
 * Calculate weighted average adjustment from collected values
 * @param {Array} adjustments - Array of adjustment objects with values and weights
 * @param {Number} defaultValue - Default value if no adjustments available
 * @returns {Number} - Weighted average adjustment
 */
function calculateWeightedAdjustment(adjustments, defaultValue) {
    if (adjustments.length === 0) return defaultValue;

    let totalWeightedValue = 0;
    let totalWeight = 0;

    adjustments.forEach(adj => {
        // Combine similarity weight with profit factor for better weighting
        const combinedWeight = adj.weight * (adj.profitFactor / 2);
        totalWeightedValue += adj.value * combinedWeight;
        totalWeight += combinedWeight;
    });

    return totalWeight > 0 ? totalWeightedValue / totalWeight : defaultValue;
}

/**
 * Normalize adjustment value to ensure it stays within reasonable bounds
 * @param {Number} value - Adjustment value
 * @returns {Number} - Normalized adjustment value
 */
function normalizeAdjustment(value) {
    // Keep adjustments within 0.7-1.5 range to prevent extreme values
    return Math.max(0.7, Math.min(1.5, value));
}

/**
 * Calculate similarity between backtest volatility and current volatility
 * @param {Number} backtestVolatility - Volatility from backtest
 * @param {Number} currentVolatility - Current volatility level
 * @returns {Number} - Similarity score (0-1)
 */
function calculateVolatilitySimilarity(backtestVolatility, currentVolatility) {
    // If no backtest volatility, assume medium match
    if (!backtestVolatility) return 0.5;

    // Calculate difference and normalize to similarity score
    const diff = Math.abs(backtestVolatility - currentVolatility);

    // Exponential decay function for similarity
    return Math.exp(-0.3 * diff); // Results in 1.0 for perfect match, decaying to ~0.05 for diff=10
}

/**
 * Calculate similarity between backtest session time and current time
 * @param {String} backtestSession - Session from backtest
 * @param {String} currentSession - Current session
 * @returns {Number} - Similarity score (0-1)
 */
function calculateSessionSimilarity(backtestSession, currentSession) {
    if (!backtestSession) return 0.5; // Medium match if no session info

    // Perfect match
    if (backtestSession.toLowerCase() === currentSession.toLowerCase()) {
        return 1.0;
    }

    // Related session types (morning/evening have some similarity)
    if ((backtestSession.toLowerCase() === 'morning' && currentSession.toLowerCase() === 'evening') ||
        (backtestSession.toLowerCase() === 'evening' && currentSession.toLowerCase() === 'morning')) {
        return 0.3;
    }

    // Default partial match
    return 0.2;
}

/**
 * Calculate similarity between backtest session type and current type
 * @param {String} backtestType - Session type from backtest
 * @param {String} currentType - Current session type
 * @returns {Number} - Similarity score (0-1)
 */
function calculateSessionTypeSimilarity(backtestType, currentType) {
    if (!backtestType) return 0.5; // Medium match if no type info

    // Perfect match
    if (backtestType.toLowerCase() === currentType.toLowerCase()) {
        return 1.0;
    }

    // Related types (high volatility and regular have some similarity)
    if ((backtestType.toLowerCase().includes('high') && currentType.toLowerCase().includes('regular')) ||
        (backtestType.toLowerCase().includes('regular') && currentType.toLowerCase().includes('high'))) {
        return 0.4;
    }

    // Default partial match
    return 0.2;
}

/**
 * Extract volatility level from backtest
 * @param {Object} backtest - Backtest object
 * @returns {Number} - Extracted volatility level or null
 */
function getBacktestVolatility(backtest) {
    if (!backtest) return null;

    // Try to extract from strategyParams
    if (backtest.strategyParams && backtest.strategyParams.volatilityLevel) {
        return parseFloat(backtest.strategyParams.volatilityLevel);
    }

    // Try to extract from market conditions
    if (backtest.marketConditions && backtest.marketConditions.volatilityScore) {
        return parseFloat(backtest.marketConditions.volatilityScore);
    }

    // Try to parse from description
    if (backtest.description) {
        const volatilityMatch = backtest.description.match(/volatility[:\s]+(\d+\.?\d*)/i);
        if (volatilityMatch && volatilityMatch[1]) {
            return parseFloat(volatilityMatch[1]);
        }
    }

    return null; // Couldn't extract volatility
}

/**
 * Extract session time from backtest
 * @param {Object} backtest - Backtest object
 * @returns {String} - Extracted session time or null
 */
function getBacktestSessionTime(backtest) {
    if (!backtest) return null;

    // Try to extract from strategyParams
    if (backtest.strategyParams && backtest.strategyParams.sessionTime) {
        return backtest.strategyParams.sessionTime;
    }

    // Try to parse from description
    if (backtest.description) {
        const sessionMatch = backtest.description.match(/(Morning|Afternoon|Evening)/i);
        if (sessionMatch && sessionMatch[1]) {
            return sessionMatch[1];
        }
    }

    return null; // Couldn't extract session time
}

/**
 * Extract session type from backtest
 * @param {Object} backtest - Backtest object
 * @returns {String} - Extracted session type or null
 */
function getBacktestSessionType(backtest) {
    if (!backtest) return null;

    // Try to extract from strategyParams
    if (backtest.strategyParams && backtest.strategyParams.sessionType) {
        return backtest.strategyParams.sessionType;
    }

    // Try to parse from description
    if (backtest.description) {
        const typeMatch = backtest.description.match(/(Regular|High Volatility|Low Volatility)/i);
        if (typeMatch && typeMatch[1]) {
            return typeMatch[1];
        }
    }

    return null; // Couldn't extract session type
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
    // Enhanced volatility mapping with more granular adjustments
    const volatilityMap = {
        // Very low volatility (1-2)
        1: { stopLoss: 0.8, target: 0.7, trailingStop: 0.8 },
        2: { stopLoss: 0.85, target: 0.8, trailingStop: 0.85 },
        // Low volatility (3-4)
        3: { stopLoss: 0.9, target: 0.9, trailingStop: 0.9 },
        4: { stopLoss: 0.95, target: 0.95, trailingStop: 0.95 },
        // Medium volatility (5-6)
        5: { stopLoss: 1.0, target: 1.0, trailingStop: 1.0 },
        6: { stopLoss: 1.05, target: 1.05, trailingStop: 1.05 },
        // High volatility (7-8)
        7: { stopLoss: 1.15, target: 1.1, trailingStop: 1.1 },
        8: { stopLoss: 1.25, target: 1.15, trailingStop: 1.2 },
        // Very high volatility (9-10)
        9: { stopLoss: 1.35, target: 1.25, trailingStop: 1.3 },
        10: { stopLoss: 1.45, target: 1.35, trailingStop: 1.4 }
    };

    const level = Math.max(1, Math.min(10, Math.round(volatilityLevel)));
    return volatilityMap[level] || volatilityMap[5]; // Default to medium volatility if level not found
}

/**
 * Get session-based parameter adjustments with more detailed logic
 * @param {String} timeOfDay - Time of day (Morning, Afternoon, Evening)
 * @returns {Object} - Session-based adjustment recommendations
 */
function getSessionAdjustments(timeOfDay) {
    const sessionAdjustments = {
        'Morning': {
            stopLoss: 1.15,    // Morning has higher volatility at open
            target: 1.2,       // Potentially larger moves at open
            trailingStop: 1.1  // More aggressive trailing to capture morning moves
        },
        'Afternoon': {
            stopLoss: 1.0,     // Mid-day typically more stable
            target: 0.95,      // Slightly smaller targets during mid-day lull
            trailingStop: 1.0  // Standard trailing
        },
        'Evening': {
            stopLoss: 1.1,     // Elevated for late day moves and potential volatility
            target: 1.1,       // Increased target for closing rallies
            trailingStop: 1.1  // More aggressive trailing for end-of-day moves
        }
    };

    return sessionAdjustments[timeOfDay] || sessionAdjustments['Afternoon'];
}

/**
 * Track and compare backtest performance over time
 * @param {String} timeOfDay - Time of day
 * @param {String} sessionType - Session type
 * @returns {Object} - Performance trends
 */
async function getPerformanceTrends(timeOfDay, sessionType) {
    try {
        // Get backtests from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentBacktests = await Backtest.find({
            createdAt: { $gte: thirtyDaysAgo },
            $or: [
                { description: { $regex: timeOfDay, $options: 'i' } },
                { description: { $regex: sessionType, $options: 'i' } },
                { 'strategyParams.sessionTime': { $regex: timeOfDay, $options: 'i' } },
                { 'strategyParams.sessionType': { $regex: sessionType, $options: 'i' } }
            ]
        }).sort({ createdAt: 1 });

        if (!recentBacktests || recentBacktests.length < 5) {
            return {
                success: false,
                message: 'Insufficient data for trend analysis'
            };
        }

        // Group by week
        const weeklyPerformance = {};
        recentBacktests.forEach(backtest => {
            if (!backtest.performanceMetrics) return;

            const weekNumber = getWeekNumber(backtest.createdAt);
            const weekKey = `Week ${weekNumber}`;

            if (!weeklyPerformance[weekKey]) {
                weeklyPerformance[weekKey] = {
                    totalTests: 0,
                    avgWinRate: 0,
                    avgProfitFactor: 0,
                    totalWinRate: 0,
                    totalProfitFactor: 0
                };
            }

            const winRate = backtest.performanceMetrics.winRate ||
                (backtest.performanceMetrics.winningTrades / backtest.performanceMetrics.totalTrades) || 0;
            const profitFactor = backtest.performanceMetrics.profitFactor || 1;

            weeklyPerformance[weekKey].totalTests++;
            weeklyPerformance[weekKey].totalWinRate += winRate;
            weeklyPerformance[weekKey].totalProfitFactor += profitFactor;
        });

        // Calculate averages and format for response
        const trends = [];
        Object.keys(weeklyPerformance).forEach(week => {
            const weekData = weeklyPerformance[week];
            if (weekData.totalTests > 0) {
                weekData.avgWinRate = weekData.totalWinRate / weekData.totalTests;
                weekData.avgProfitFactor = weekData.totalProfitFactor / weekData.totalTests;

                trends.push({
                    period: week,
                    sampleSize: weekData.totalTests,
                    avgWinRate: weekData.avgWinRate,
                    avgProfitFactor: weekData.avgProfitFactor
                });
            }
        });

        return {
            success: true,
            trends
        };
    } catch (error) {
        console.error('Error analyzing performance trends:', error);
        return {
            success: false,
            message: 'Error analyzing performance trends'
        };
    }
}

/**
 * Get week number from date
 * @param {Date} date - Date object
 * @returns {Number} - Week number
 */
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = {
    getPerformanceMetrics,
    getVolatilityAdjustments,
    getSessionAdjustments,
    getPerformanceTrends
};
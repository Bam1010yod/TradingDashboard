/**
 * Parameter Optimization Service
 * This service analyzes market conditions and historical performance
 * to recommend optimal parameters for Flazh Infinity and ATM strategies
 */

const mongoose = require('mongoose');
const FlazhTemplate = require('../models/flazhTemplate');
const AtmTemplate = require('../models/atmTemplate');
const PerformanceRecord = require('../models/performanceRecord');
const SessionAnalysis = require('../models/sessionAnalysis');
const marketConditionsService = require('./marketConditionsService');

/**
 * Optimize parameters based on current market conditions and historical performance
 * @param {Object} marketData - Current market data
 * @param {String} timeOfDay - Time of day (Morning, Afternoon, Evening)
 * @param {String} sessionType - Session type (Regular, High Volatility, Low Volatility)
 * @returns {Object} - Optimized parameters for Flazh Infinity and ATM strategies
 */
async function optimizeParameters(marketData, timeOfDay, sessionType) {
    try {
        console.log('Starting parameter optimization...');
        console.log(`Time of day: ${timeOfDay}, Session type: ${sessionType}`);

        // Convert timeOfDay to session format
        const session = timeOfDayToSession(timeOfDay);

        // 1. Get current market conditions
        const currentConditions = await marketConditionsService.analyzeMarketConditions();
        console.log('Current market conditions analyzed');

        // 2. Get recent session analysis
        const recentSessions = await getRecentSessionAnalysis(session);
        console.log(`Found ${recentSessions.length} recent session analyses`);

        // 3. Find templates that have performed well in similar conditions
        const similarTemplates = await findSimilarTemplates(currentConditions, session, sessionType);
        console.log(`Found ${similarTemplates.length} templates with good performance in similar conditions`);

        // 4. Calculate optimal parameters based on successful templates
        const optimizedParameters = calculateOptimalParameters(similarTemplates, currentConditions, recentSessions);
        console.log('Calculated optimized parameters');

        return {
            flazhParameters: optimizedParameters.flazh,
            atmParameters: optimizedParameters.atm,
            confidence: optimizedParameters.confidence,
            marketConditionsSummary: currentConditions.summary
        };
    } catch (error) {
        console.error('Error during parameter optimization:', error);
        throw new Error('Failed to optimize parameters');
    }
}

/**
 * Convert time of day to session format
 * @param {String} timeOfDay - Time of day (Morning, Afternoon, Evening)
 * @returns {String} - Session format (preMarket, regularHours, postMarket, overnight)
 */
function timeOfDayToSession(timeOfDay) {
    switch (timeOfDay) {
        case 'Morning':
            return 'preMarket';
        case 'Afternoon':
            return 'regularHours';
        case 'Evening':
            return 'postMarket';
        default:
            return 'regularHours';
    }
}

/**
 * Get recent session analysis
 * @param {String} session - Session type
 * @returns {Array} - Recent session analyses
 */
async function getRecentSessionAnalysis(session) {
    try {
        // Get the most recent 5 session analyses for the specified session
        const recentSessions = await SessionAnalysis.find({ session })
            .sort({ date: -1 })
            .limit(5);

        return recentSessions;
    } catch (error) {
        console.error('Error getting recent session analysis:', error);
        return [];
    }
}

/**
 * Find templates that have performed well in similar market conditions
 * @param {Object} currentConditions - Current market conditions
 * @param {String} session - Session type
 * @param {String} sessionType - Session volatility type
 * @returns {Array} - Array of successful templates
 */
async function findSimilarTemplates(currentConditions, session, sessionType) {
    try {
        // Get performance records for templates used in similar conditions
        const performanceRecords = await PerformanceRecord.find({
            'marketConditions.volatility': {
                $gte: currentConditions.volatility * 0.8,
                $lte: currentConditions.volatility * 1.2
            },
            'marketConditions.trend': currentConditions.trend,
            session: session,
            profitFactor: { $gte: 1.5 } // Only consider profitable template usage
        })
            .populate('flazhTemplate')
            .populate('atmTemplate')
            .sort({ profitFactor: -1 }) // Sort by performance
            .limit(10);

        return performanceRecords;
    } catch (error) {
        console.error('Error finding similar templates:', error);
        return [];
    }
}

/**
 * Calculate optimal parameters based on successful templates and session analysis
 * @param {Array} similarTemplates - Array of templates that performed well in similar conditions
 * @param {Object} currentConditions - Current market conditions
 * @param {Array} recentSessions - Recent session analyses
 * @returns {Object} - Optimized parameters
 */
function calculateOptimalParameters(similarTemplates, currentConditions, recentSessions) {
    // If no similar templates found, return default parameters
    if (similarTemplates.length === 0) {
        return {
            flazh: getDefaultFlazhParameters(),
            atm: getDefaultAtmParameters(),
            confidence: 'low'
        };
    }

    // Extract Flazh parameters from successful templates
    const flazhParams = similarTemplates
        .filter(record => record.flazhTemplate)
        .map(record => record.flazhTemplate);

    // Extract ATM parameters from successful templates
    const atmParams = similarTemplates
        .filter(record => record.atmTemplate)
        .map(record => record.atmTemplate);

    // Calculate average volatility from recent sessions
    let avgSessionVolatility = 0;
    if (recentSessions.length > 0) {
        avgSessionVolatility = recentSessions.reduce((sum, session) => sum + session.averageVolatility, 0) / recentSessions.length;
    }

    // Calculate average price range from recent sessions
    let avgPriceRange = 0;
    if (recentSessions.length > 0) {
        avgPriceRange = recentSessions.reduce((sum, session) => sum + session.priceRange.range, 0) / recentSessions.length;
    }

    // Calculate optimized Flazh parameters
    const optimizedFlazh = optimizeFlazhParameters(flazhParams, currentConditions, avgSessionVolatility, avgPriceRange);

    // Calculate optimized ATM parameters
    const optimizedAtm = optimizeAtmParameters(atmParams, currentConditions, avgSessionVolatility, avgPriceRange);

    // Calculate confidence level based on number of similar templates and consistency
    const confidence = calculateConfidence(similarTemplates);

    return {
        flazh: optimizedFlazh,
        atm: optimizedAtm,
        confidence: confidence
    };
}

/**
 * Optimize Flazh Infinity parameters
 * @param {Array} flazhTemplates - Array of successful Flazh templates
 * @param {Object} currentConditions - Current market conditions
 * @param {Number} avgSessionVolatility - Average session volatility
 * @param {Number} avgPriceRange - Average price range
 * @returns {Object} - Optimized Flazh parameters
 */
function optimizeFlazhParameters(flazhTemplates, currentConditions, avgSessionVolatility, avgPriceRange) {
    // If no templates provided, return default parameters
    if (flazhTemplates.length === 0) {
        return getDefaultFlazhParameters();
    }

    // Calculate average values for numeric parameters
    const optimizedParams = {
        entryOffset: calculateAverageParameter(flazhTemplates, 'entryOffset'),
        stopLoss: calculateAverageParameter(flazhTemplates, 'stopLoss'),
        targetProfit: calculateAverageParameter(flazhTemplates, 'targetProfit'),
        trailingStop: calculateAverageParameter(flazhTemplates, 'trailingStop'),
        contractSize: calculateMostCommonParameter(flazhTemplates, 'contractSize'),
        timeFrame: calculateMostCommonParameter(flazhTemplates, 'timeFrame')
    };

    // Adjust parameters based on current volatility
    const volatilityAdjustment = calculateVolatilityAdjustment(currentConditions.volatility, avgSessionVolatility);

    // Apply volatility adjustment to stop loss and target profit
    optimizedParams.stopLoss = Math.round(optimizedParams.stopLoss * volatilityAdjustment);
    optimizedParams.targetProfit = Math.round(optimizedParams.targetProfit * volatilityAdjustment);
    optimizedParams.trailingStop = Math.round(optimizedParams.trailingStop * volatilityAdjustment);

    // Adjust parameters based on price range relative to average
    if (avgPriceRange > 0 && currentConditions.priceRange) {
        const rangeRatio = currentConditions.priceRange / avgPriceRange;

        // If current range is significantly wider than average, adjust parameters
        if (rangeRatio > 1.2) {
            optimizedParams.stopLoss = Math.round(optimizedParams.stopLoss * 1.1);
            optimizedParams.targetProfit = Math.round(optimizedParams.targetProfit * 1.1);
            optimizedParams.trailingStop = Math.round(optimizedParams.trailingStop * 1.1);
        }
        // If current range is significantly narrower than average, adjust parameters
        else if (rangeRatio < 0.8) {
            optimizedParams.stopLoss = Math.round(optimizedParams.stopLoss * 0.9);
            optimizedParams.targetProfit = Math.round(optimizedParams.targetProfit * 0.9);
            optimizedParams.trailingStop = Math.round(optimizedParams.trailingStop * 0.9);
        }
    }

    return optimizedParams;
}

/**
 * Optimize ATM Strategy parameters
 * @param {Array} atmTemplates - Array of successful ATM templates
 * @param {Object} currentConditions - Current market conditions
 * @param {Number} avgSessionVolatility - Average session volatility
 * @param {Number} avgPriceRange - Average price range
 * @returns {Object} - Optimized ATM parameters
 */
function optimizeAtmParameters(atmTemplates, currentConditions, avgSessionVolatility, avgPriceRange) {
    // If no templates provided, return default parameters
    if (atmTemplates.length === 0) {
        return getDefaultAtmParameters();
    }

    // Calculate average values for numeric parameters
    const optimizedParams = {
        stopLoss: calculateAverageParameter(atmTemplates, 'stopLoss'),
        target1: calculateAverageParameter(atmTemplates, 'target1'),
        target2: calculateAverageParameter(atmTemplates, 'target2'),
        breakEvenLevel: calculateAverageParameter(atmTemplates, 'breakEvenLevel'),
        autoBreakEven: calculateMostCommonParameter(atmTemplates, 'autoBreakEven'),
        activeStrategy: calculateMostCommonParameter(atmTemplates, 'activeStrategy')
    };

    // Adjust parameters based on current volatility
    const volatilityAdjustment = calculateVolatilityAdjustment(currentConditions.volatility, avgSessionVolatility);

    // Apply volatility adjustment to stop loss and targets
    optimizedParams.stopLoss = Math.round(optimizedParams.stopLoss * volatilityAdjustment);
    optimizedParams.target1 = Math.round(optimizedParams.target1 * volatilityAdjustment);
    optimizedParams.target2 = Math.round(optimizedParams.target2 * volatilityAdjustment);
    optimizedParams.breakEvenLevel = Math.round(optimizedParams.breakEvenLevel * volatilityAdjustment);

    // Adjust parameters based on price range
    if (avgPriceRange > 0 && currentConditions.priceRange) {
        const rangeRatio = currentConditions.priceRange / avgPriceRange;

        // If current range is significantly wider than average, adjust parameters
        if (rangeRatio > 1.2) {
            optimizedParams.stopLoss = Math.round(optimizedParams.stopLoss * 1.1);
            optimizedParams.target1 = Math.round(optimizedParams.target1 * 1.1);
            optimizedParams.target2 = Math.round(optimizedParams.target2 * 1.1);
        }
        // If current range is significantly narrower than average, adjust parameters
        else if (rangeRatio < 0.8) {
            optimizedParams.stopLoss = Math.round(optimizedParams.stopLoss * 0.9);
            optimizedParams.target1 = Math.round(optimizedParams.target1 * 0.9);
            optimizedParams.target2 = Math.round(optimizedParams.target2 * 0.9);
        }
    }

    return optimizedParams;
}

/**
 * Calculate average value for a numeric parameter
 * @param {Array} templates - Array of templates
 * @param {String} paramName - Parameter name
 * @returns {Number} - Average value
 */
function calculateAverageParameter(templates, paramName) {
    const values = templates
        .filter(template => template[paramName] !== undefined)
        .map(template => template[paramName]);

    if (values.length === 0) return 0;

    const sum = values.reduce((total, value) => total + value, 0);
    return Math.round((sum / values.length) * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate most common value for a parameter
 * @param {Array} templates - Array of templates
 * @param {String} paramName - Parameter name
 * @returns {*} - Most common value
 */
function calculateMostCommonParameter(templates, paramName) {
    const valueCount = {};

    templates.forEach(template => {
        if (template[paramName] !== undefined) {
            const value = template[paramName];
            valueCount[value] = (valueCount[value] || 0) + 1;
        }
    });

    let mostCommonValue;
    let maxCount = 0;

    for (const [value, count] of Object.entries(valueCount)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommonValue = value;
        }
    }

    return mostCommonValue;
}

/**
 * Calculate volatility adjustment factor
 * @param {Number} currentVolatility - Current market volatility
 * @param {Number} avgSessionVolatility - Average session volatility
 * @returns {Number} - Adjustment factor
 */
function calculateVolatilityAdjustment(currentVolatility, avgSessionVolatility) {
    // If we have historical session volatility data, compare current to average
    if (avgSessionVolatility > 0) {
        const volatilityRatio = currentVolatility / avgSessionVolatility;

        // Scale based on ratio of current to historical volatility
        if (volatilityRatio > 1.5) {
            return 1.3; // Much higher volatility
        } else if (volatilityRatio > 1.2) {
            return 1.2; // Higher volatility
        } else if (volatilityRatio < 0.8) {
            return 0.8; // Lower volatility
        } else if (volatilityRatio < 0.5) {
            return 0.7; // Much lower volatility
        } else {
            return 1.0; // Similar volatility
        }
    }
    // Fallback to absolute volatility levels if no historical data
    else {
        if (currentVolatility < 10) {
            return 0.8; // Low volatility - tighter parameters
        } else if (currentVolatility > 30) {
            return 1.2; // High volatility - wider parameters
        } else {
            return 1.0; // Normal volatility - no adjustment
        }
    }
}

/**
 * Calculate confidence level based on template consistency
 * @param {Array} templates - Array of templates
 * @returns {String} - Confidence level (high, medium, low)
 */
function calculateConfidence(templates) {
    if (templates.length >= 5) {
        return 'high';
    } else if (templates.length >= 2) {
        return 'medium';
    } else {
        return 'low';
    }
}

/**
 * Get default Flazh Infinity parameters
 * @returns {Object} - Default parameters
 */
function getDefaultFlazhParameters() {
    return {
        entryOffset: 3,
        stopLoss: 8,
        targetProfit: 16,
        trailingStop: 4,
        contractSize: 1,
        timeFrame: '5min'
    };
}

/**
 * Get default ATM Strategy parameters
 * @returns {Object} - Default parameters
 */
function getDefaultAtmParameters() {
    return {
        stopLoss: 12,
        target1: 12,
        target2: 24,
        breakEvenLevel: 6,
        autoBreakEven: true,
        activeStrategy: 'Standard'
    };
}

module.exports = {
    optimizeParameters
};
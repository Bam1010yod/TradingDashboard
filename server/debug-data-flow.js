/**
 * Enhanced Template Selector Service
 * 
 * This service provides improved template selection based on current market conditions
 * with fallback options to ensure the UI always has data to display.
 */

const mongoose = require('mongoose');
const FlazhTemplate = require('../models/flazhTemplate');
const ATMTemplate = require('../models/atmTemplate');

// Simple logger
const logger = {
    info: (message, data) => {
        console.log(`INFO: ${message}`, data ? '' : '');
    },
    warn: (message) => {
        console.log(`WARNING: ${message}`);
    },
    error: (message, error) => {
        console.log(`ERROR: ${message}`, error);
    }
};

/**
 * Calculates similarity score between market conditions and template conditions
 * @param {Object} marketConditions - Current market conditions
 * @param {Object} templateConditions - Template's ideal conditions
 * @returns {Number} - Similarity score (0-100)
 */
function calculateSimilarityScore(marketConditions, templateConditions) {
    // Default score starts at 100 (perfect match)
    let score = 100;

    // Define weights for different factors
    const weights = {
        volatility: 30,
        trend: 25,
        volume: 20,
        session: 15,
        dayOfWeek: 10
    };

    // Check each condition and adjust score
    if (marketConditions.volatility !== templateConditions.volatility) {
        // Volatility penalty depends on how far off it is
        const volatilityLevels = ['low', 'medium', 'high'];
        const marketIndex = volatilityLevels.indexOf(marketConditions.volatility);
        const templateIndex = volatilityLevels.indexOf(templateConditions.volatility);

        if (marketIndex !== -1 && templateIndex !== -1) {
            const difference = Math.abs(marketIndex - templateIndex);
            score -= (difference * weights.volatility / volatilityLevels.length);
        } else {
            score -= weights.volatility;
        }
    }

    if (marketConditions.trend !== templateConditions.trend) {
        // Trend penalty depends on direction difference
        const trendTypes = ['strong_down', 'down', 'neutral', 'up', 'strong_up'];
        const marketIndex = trendTypes.indexOf(marketConditions.trend);
        const templateIndex = trendTypes.indexOf(templateConditions.trend);

        if (marketIndex !== -1 && templateIndex !== -1) {
            const difference = Math.abs(marketIndex - templateIndex);
            score -= (difference * weights.trend / trendTypes.length);
        } else {
            score -= weights.trend;
        }
    }

    if (marketConditions.volume !== templateConditions.volume) {
        // Volume penalty
        score -= weights.volume;
    }

    if (marketConditions.session !== templateConditions.session) {
        // Session penalty
        score -= weights.session;
    }

    if (marketConditions.dayOfWeek && templateConditions.dayOfWeek &&
        marketConditions.dayOfWeek !== templateConditions.dayOfWeek) {
        // Day of week penalty
        score -= weights.dayOfWeek;
    }

    // Ensure score doesn't go below 0
    return Math.max(0, score);
}

/**
 * Get fallback templates to ensure UI always has data
 * @param {Object} marketConditions - Current market conditions
 * @returns {Object} - Fallback templates
 */
function getFallbackTemplates(marketConditions) {
    // Create sensible defaults based on provided market conditions
    const volatility = marketConditions?.volatility || 'medium';
    const trend = marketConditions?.trend || 'neutral';

    return {
        flazh: {
            name: `Fallback Flazh (${volatility} volatility)`,
            description: "System-generated fallback template when no matching templates found",
            conditions: {
                volatility: volatility,
                trend: trend,
                volume: 'normal',
                session: 'regular'
            },
            parameters: {
                // Default parameters based on volatility
                stopLoss: volatility === 'high' ? 15 : (volatility === 'low' ? 8 : 12),
                takeProfit: volatility === 'high' ? 30 : (volatility === 'low' ? 16 : 24),
                trailStop: volatility === 'high' ? 8 : (volatility === 'low' ? 4 : 6),
                entryFilter: 50,
                marketNoiseFilter: volatility === 'high' ? 70 : (volatility === 'low' ? 30 : 50),
                trendStrengthThreshold: trend.includes('strong') ? 80 : 50
            },
            matchScore: 0,
            isFallback: true
        },
        atm: {
            name: `Fallback ATM (${volatility} volatility)`,
            description: "System-generated fallback template when no matching templates found",
            conditions: {
                volatility: volatility,
                trend: trend,
                volume: 'normal',
                session: 'regular'
            },
            parameters: {
                // Default parameters based on volatility
                stopLoss: volatility === 'high' ? 12 : (volatility === 'low' ? 6 : 9),
                profit1: volatility === 'high' ? 20 : (volatility === 'low' ? 10 : 15),
                profit2: volatility === 'high' ? 30 : (volatility === 'low' ? 18 : 25),
                autoBreakEven: true,
                breakEvenTicks: volatility === 'high' ? 8 : (volatility === 'low' ? 4 : 6)
            },
            matchScore: 0,
            isFallback: true
        }
    };
}

/**
 * Gets recommended templates based on current market conditions
 * @param {Object} marketConditions - Current market conditions
 * @returns {Promise<Object>} - Object containing recommended Flazh and ATM templates
 */
async function getRecommendedTemplate(marketConditions) {
    logger.info('Getting recommended templates for market conditions:', marketConditions);

    // Validate market conditions
    if (!marketConditions || Object.keys(marketConditions).length === 0) {
        logger.warn('No market conditions provided, using defaults');
        marketConditions = {
            volatility: 'medium',
            trend: 'neutral',
            volume: 'normal',
            session: 'regular',
            timestamp: new Date().toISOString()
        };
    }

    try {
        // Get all templates
        const flazhTemplates = await FlazhTemplate.find({}).lean();
        const atmTemplates = await ATMTemplate.find({}).lean();

        logger.info(`Found ${flazhTemplates.length} Flazh templates and ${atmTemplates.length} ATM templates`);

        // If no templates found, return fallbacks
        if (flazhTemplates.length === 0 || atmTemplates.length === 0) {
            logger.warn('No templates found in database, using fallbacks');
            return getFallbackTemplates(marketConditions);
        }

        // Calculate similarity scores for each template
        const scoredFlazhTemplates = flazhTemplates.map(template => {
            const score = calculateSimilarityScore(marketConditions, template.conditions);
            return { ...template, matchScore: score };
        });

        const scoredATMTemplates = atmTemplates.map(template => {
            const score = calculateSimilarityScore(marketConditions, template.conditions);
            return { ...template, matchScore: score };
        });

        // Sort by score (descending)
        scoredFlazhTemplates.sort((a, b) => b.matchScore - a.matchScore);
        scoredATMTemplates.sort((a, b) => b.matchScore - a.matchScore);

        // Get best templates
        const bestFlazh = scoredFlazhTemplates[0];
        const bestATM = scoredATMTemplates[0];

        // Log selected templates
        logger.info(`Selected Flazh template: ${bestFlazh.name} (Score: ${bestFlazh.matchScore})`);
        logger.info(`Selected ATM template: ${bestATM.name} (Score: ${bestATM.matchScore})`);

        // Return recommended templates
        const result = {
            flazh: bestFlazh,
            atm: bestATM,
            marketConditions: marketConditions
        };

        // If scores are too low, add a warning flag
        if (bestFlazh.matchScore < 50 || bestATM.matchScore < 50) {
            result.warning = 'Low matching score. Consider adding more templates for current market conditions.';
        }

        return result;
    } catch (error) {
        logger.error('Error getting recommended templates:', error);

        // Return fallback templates in case of error
        logger.warn('Using fallback templates due to error');
        return getFallbackTemplates(marketConditions);
    }
}

// Export the function
module.exports = {
    getRecommendedTemplate
};
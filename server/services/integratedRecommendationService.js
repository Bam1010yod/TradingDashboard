// Full path: C:\TradingDashboard\server\services\integratedRecommendationService.js

const enhancedTemplateSelector = require('./enhancedTemplateSelector');
const marketConditionsService = require('./marketConditionsService');
const recommendationEngineService = require('./recommendationEngineService');

/**
 * Integrated Recommendation Service
 * Combines market regime detection with enhanced template selection
 */

/**
 * Get comprehensive template recommendations with market regime integration
 * @param {String} timeOfDay - Time of day (Morning, Afternoon, Evening)
 * @returns {Promise<Object>} - Comprehensive recommendations
 */
async function getIntegratedRecommendations(timeOfDay) {
    // 1. Analyze current market conditions using the market regime detection
    const marketConditions = marketConditionsService.analyzeMarketConditions();
    console.log('Market regime analysis complete');

    // 2. Map the market conditions to session type for the recommendation engine
    const sessionType = mapVolatilityToSessionType(marketConditions.volatilityCategory);

    // 3. Generate comprehensive recommendations from the main engine
    const baseRecommendations = await recommendationEngineService.generateRecommendations(
        timeOfDay,
        sessionType
    );
    console.log('Base recommendations generated');

    // 4. Use enhanced template selector to find the best matching templates
    const bestAtmTemplate = await enhancedTemplateSelector.getRecommendedTemplate('ATM', marketConditions);
    const bestFlazhTemplate = await enhancedTemplateSelector.getRecommendedTemplate('Flazh', marketConditions);
    console.log('Best matching templates selected');

    // 5. Adjust the templates based on current market conditions
    const adjustedAtmTemplate = enhancedTemplateSelector.adjustTemplateForMarketConditions(
        bestAtmTemplate,
        marketConditions
    );

    const adjustedFlazhTemplate = enhancedTemplateSelector.adjustTemplateForMarketConditions(
        bestFlazhTemplate,
        marketConditions
    );
    console.log('Templates adjusted for current market conditions');

    // 6. Calculate similarity scores for confidence rating
    const atmSimilarity = bestAtmTemplate ?
        enhancedTemplateSelector.calculateMarketSimilarity(marketConditions, {
            session: bestAtmTemplate.session,
            volatilityCategory: bestAtmTemplate.volatility
        }) : 0;

    const flazhSimilarity = bestFlazhTemplate ?
        enhancedTemplateSelector.calculateMarketSimilarity(marketConditions, {
            session: bestFlazhTemplate.session,
            volatilityCategory: bestFlazhTemplate.volatility
        }) : 0;

    // 7. Combine all recommendations into an integrated response
    const integratedRecommendations = {
        marketRegime: {
            currentSession: marketConditions.currentSession,
            sessionInfo: marketConditionsService.TRADING_SESSIONS[marketConditions.currentSession],
            volatilityCategory: marketConditions.volatilityCategory,
            timestamp: new Date().toISOString()
        },
        baseRecommendations: baseRecommendations,
        enhancedTemplates: {
            atm: {
                template: adjustedAtmTemplate,
                templateName: adjustedAtmTemplate?.templateName || 'No template found',
                similarityScore: atmSimilarity,
                confidence: getSimilarityConfidence(atmSimilarity)
            },
            flazh: {
                template: adjustedFlazhTemplate,
                templateName: adjustedFlazhTemplate?.templateName || 'No template found',
                similarityScore: flazhSimilarity,
                confidence: getSimilarityConfidence(flazhSimilarity)
            }
        },
        integratedParameters: {
            atm: combineParameters(
                baseRecommendations.recommendations.atm,
                adjustedAtmTemplate,
                atmSimilarity
            ),
            flazh: combineParameters(
                baseRecommendations.recommendations.flazh,
                adjustedFlazhTemplate,
                flazhSimilarity
            )
        },
        rationale: generateRationale(
            marketConditions,
            baseRecommendations,
            atmSimilarity,
            flazhSimilarity
        ),
        generatedAt: new Date().toISOString()
    };

    console.log('Integrated recommendations complete');
    return integratedRecommendations;
}

/**
 * Map volatility category to session type
 * @param {String} volatilityCategory - LOW_VOLATILITY, MEDIUM_VOLATILITY, HIGH_VOLATILITY
 * @returns {String} - Session type for recommendation engine
 */
function mapVolatilityToSessionType(volatilityCategory) {
    switch (volatilityCategory) {
        case 'HIGH_VOLATILITY':
            return 'High Volatility';
        case 'LOW_VOLATILITY':
            return 'Low Volatility';
        case 'MEDIUM_VOLATILITY':
        default:
            return 'Regular';
    }
}

/**
 * Get confidence level based on similarity score
 * @param {Number} similarityScore - Template similarity score (0-100)
 * @returns {String} - Confidence level
 */
function getSimilarityConfidence(similarityScore) {
    if (similarityScore >= 80) {
        return 'high';
    } else if (similarityScore >= 60) {
        return 'medium-high';
    } else if (similarityScore >= 40) {
        return 'medium';
    } else if (similarityScore >= 20) {
        return 'medium-low';
    } else {
        return 'low';
    }
}

/**
 * Combine parameters from recommendation engine and template
 * @param {Object} engineParams - Parameters from recommendation engine
 * @param {Object} templateParams - Parameters from template
 * @param {Number} similarityScore - Template similarity score
 * @returns {Object} - Combined parameters
 */
function combineParameters(engineParams, templateParams, similarityScore) {
    // If template similarity is low, use engine parameters
    if (!templateParams || similarityScore < 30) {
        return engineParams;
    }

    // Create a deep copy
    const combinedParams = JSON.parse(JSON.stringify(engineParams));

    // Calculate blend weight based on similarity score
    // Higher similarity = more weight to template, max 70%
    const templateWeight = Math.min(0.7, similarityScore / 100);
    const engineWeight = 1 - templateWeight;

    console.log(`Combining parameters with template weight: ${(templateWeight * 100).toFixed(1)}%`);

    // Blend numeric parameters (weighting based on similarity)
    // This is a simple example - you'll need to adapt this to your specific parameters
    for (const key in combinedParams) {
        if (typeof combinedParams[key] === 'number' && templateParams[key] !== undefined) {
            combinedParams[key] = Math.round(
                (combinedParams[key] * engineWeight) + (templateParams[key] * templateWeight)
            );
        }
    }

    return combinedParams;
}

/**
 * Generate explanation rationale for recommendations
 * @param {Object} marketConditions - Current market conditions
 * @param {Object} baseRecommendations - Base recommendations from engine
 * @param {Number} atmSimilarity - ATM template similarity score
 * @param {Number} flazhSimilarity - Flazh template similarity score
 * @returns {String} - Rationale explanation
 */
function generateRationale(marketConditions, baseRecommendations, atmSimilarity, flazhSimilarity) {
    const sessionInfo = marketConditionsService.TRADING_SESSIONS[marketConditions.currentSession];

    let rationale = `Recommendations optimized for ${sessionInfo.name} trading session with `;
    rationale += `${marketConditions.volatilityCategory.toLowerCase().replace('_', ' ')}. `;

    // Add template similarity information
    if (atmSimilarity > 70 || flazhSimilarity > 70) {
        rationale += 'High similarity to previously successful templates found. ';
    } else if (atmSimilarity > 40 || flazhSimilarity > 40) {
        rationale += 'Moderate similarity to previously successful templates found. ';
    } else {
        rationale += 'Using algorithmically generated parameters based on current conditions. ';
    }

    // Add session-specific advice
    if (sessionInfo.noteableFeatures && sessionInfo.noteableFeatures.length > 0) {
        rationale += `This session typically features: ${sessionInfo.noteableFeatures.join(', ')}. `;
    }

    // Add volatility-specific advice
    if (marketConditions.volatilityCategory === 'HIGH_VOLATILITY') {
        rationale += 'Parameters adjusted for wider stops and targets due to high volatility. ';
    } else if (marketConditions.volatilityCategory === 'LOW_VOLATILITY') {
        rationale += 'Parameters adjusted for tighter stops and targets due to low volatility. ';
    }

    return rationale;
}

module.exports = {
    getIntegratedRecommendations
};
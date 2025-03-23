// Full path: C:\TradingDashboard\server\services\enhancedTemplateSelector.js

const mongoose = require('mongoose');
const AtmStrategy = require('../models/atmStrategy');
const FlazhInfinity = require('../models/flazhInfinity');
const marketConditionsService = require('./marketConditionsService');

/**
 * Enhanced Template Selector Service
 * Integrates market regime detection to improve template selection
 */

/**
 * Calculate similarity score between two market conditions
 * @param {Object} conditionA - First market condition
 * @param {Object} conditionB - Second market condition
 * @returns {Number} - Similarity score (0-100)
 */
const calculateMarketSimilarity = (conditionA, conditionB) => {
    if (!conditionA || !conditionB) {
        return 0; // No similarity if either condition is missing
    }

    let similarityScore = 0;
    let totalFactors = 0;

    // Calculate session similarity
    if (conditionA.session && conditionB.session) {
        totalFactors += 40; // Sessions are very important

        // Exact session match
        if (conditionA.session === conditionB.session) {
            similarityScore += 40;
        } else {
            // Check related sessions (morning sessions are similar, afternoon sessions are similar)
            const morningGroups = ['ASIA', 'EUROPE', 'US_OPEN'];
            const afternoonGroups = ['US_MIDDAY', 'US_AFTERNOON', 'OVERNIGHT'];

            const isAMorning = morningGroups.includes(conditionA.session);
            const isBMorning = morningGroups.includes(conditionB.session);
            const isAAfternoon = afternoonGroups.includes(conditionA.session);
            const isBAfternoon = afternoonGroups.includes(conditionB.session);

            if ((isAMorning && isBMorning) || (isAAfternoon && isBAfternoon)) {
                similarityScore += 20; // Related session match
            }
        }
    }

    // Calculate volatility similarity
    if (conditionA.volatilityCategory && conditionB.volatilityCategory) {
        totalFactors += 40; // Volatility is very important

        // Exact volatility match
        if (conditionA.volatilityCategory === conditionB.volatilityCategory) {
            similarityScore += 40;
        } else {
            // Check for adjacent volatility levels
            const volatilityLevels = ['LOW_VOLATILITY', 'MEDIUM_VOLATILITY', 'HIGH_VOLATILITY'];
            const indexA = volatilityLevels.indexOf(conditionA.volatilityCategory);
            const indexB = volatilityLevels.indexOf(conditionB.volatilityCategory);

            if (indexA !== -1 && indexB !== -1) {
                // Check how far apart they are (0=same, 1=adjacent, 2=opposite)
                const difference = Math.abs(indexA - indexB);
                if (difference === 1) {
                    similarityScore += 20; // Adjacent volatility
                }
            }
        }
    }

    // Add additional factors if available

    // Check for day of week similarity (5% weight)
    if (conditionA.dayOfWeek && conditionB.dayOfWeek) {
        totalFactors += 10;
        if (conditionA.dayOfWeek === conditionB.dayOfWeek) {
            similarityScore += 10;
        }
    }

    // Check for volume similarity (5% weight)
    if (conditionA.volume && conditionB.volume) {
        totalFactors += 10;
        if (conditionA.volume === conditionB.volume) {
            similarityScore += 10;
        }
    }

    // If we don't have enough factors, return a low score
    if (totalFactors < 50) {
        return 20; // Base similarity score
    }

    // Convert to 0-100 scale
    return Math.round((similarityScore / totalFactors) * 100);
};

/**
 * Helper function to extract session and volatility information from template name
 * @param {Object} template - The template document from database
 * @returns {Object} - Extracted market conditions 
 */
const extractMarketConditionsFromTemplate = (template) => {
    // Default values
    const conditions = {
        session: null,
        volatilityCategory: null,
        dayOfWeek: null,
        volume: null
    };

    if (!template || !template.name) {
        return conditions;
    }

    // Extract from template name (e.g., "ATM_EA_LOW" or "Flazh_EA_LOW")
    const nameParts = template.name.split('_');

    // Look for session indicators (EA = Early Afternoon, etc.)
    if (nameParts.includes('EA')) {
        conditions.session = 'US_AFTERNOON';
    } else if (nameParts.includes('MO')) {
        conditions.session = 'US_OPEN';
    } else if (nameParts.includes('MI')) {
        conditions.session = 'US_MIDDAY';
    }

    // Look for volatility indicators
    if (nameParts.includes('LOW')) {
        conditions.volatilityCategory = 'LOW_VOLATILITY';
    } else if (nameParts.includes('MED')) {
        conditions.volatilityCategory = 'MEDIUM_VOLATILITY';
    } else if (nameParts.includes('HIGH')) {
        conditions.volatilityCategory = 'HIGH_VOLATILITY';
    }

    return conditions;
};

/**
 * Selects the best template based on current market conditions using enhanced similarity matching
 * @param {string} templateType - 'ATM' or 'Flazh'
 * @param {Object} marketConditions - Current market conditions
 * @returns {Promise<Object>} - The selected template
 */
const selectBestTemplate = async (templateType, marketConditions) => {
    console.log(`Selecting ${templateType} template with enhanced market regime detection`);
    console.log(`Market conditions: Session=${marketConditions.currentSession}, Volatility=${marketConditions.volatilityCategory}`);

    try {
        // Select the appropriate collection based on template type
        const collection = templateType.toUpperCase() === 'ATM'
            ? mongoose.connection.db.collection('atmtemplates')
            : mongoose.connection.db.collection('flazhtemplates');

        // Get all templates from the database
        const templates = await collection.find({}).toArray();

        if (!templates || templates.length === 0) {
            console.log(`No ${templateType} templates found in database`);
            return null;
        }

        console.log(`Found ${templates.length} ${templateType} templates to evaluate`);

        // Calculate similarity scores for each template
        const templatesWithScores = templates.map(template => {
            // Extract template market conditions from name and metadata
            const templateConditions = extractMarketConditionsFromTemplate(template);

            // Calculate similarity score
            const similarityScore = calculateMarketSimilarity(marketConditions, templateConditions);

            return {
                template,
                similarityScore
            };
        });

        // Sort by similarity score (highest first)
        templatesWithScores.sort((a, b) => b.similarityScore - a.similarityScore);

        // Log the top 3 templates for debugging
        const topTemplates = templatesWithScores.slice(0, Math.min(3, templatesWithScores.length));
        console.log('Top matching templates:');
        topTemplates.forEach((item, index) => {
            console.log(`${index + 1}. ${item.template.name} (Score: ${item.similarityScore})`);
        });

        // Select the best template
        const bestMatch = templatesWithScores[0];

        if (bestMatch && bestMatch.similarityScore > 40) {
            console.log(`Selected template: ${bestMatch.template.name} with similarity score: ${bestMatch.similarityScore}`);
            return bestMatch.template;
        }

        // If no good match found, use first template as fallback
        console.log('No template with good similarity found, using first template as fallback');
        return templates[0];
    } catch (error) {
        console.error(`Error selecting best template: ${error.message}`);
        console.error('Using fallback to mock templates as temporary measure');

        // Use mock templates as fallback in case of database error
        const mockTemplates = createMockTemplates(templateType);
        return mockTemplates[0];
    }
};

/**
 * Helper function to create mock templates (used as fallback only)
 * @param {string} templateType - 'ATM' or 'Flazh'
 * @returns {Array} - Array of mock templates
 */
function createMockTemplates(templateType) {
    if (templateType.toUpperCase() === 'ATM') {
        return [
            {
                name: 'ATM_MO_HIGH',
                calculationMode: 'Ticks',
                brackets: [
                    {
                        quantity: 1,
                        stopLoss: 28,
                        target: 56,
                        stopStrategy: {
                            autoBreakEvenPlus: 15,
                            autoBreakEvenProfitTrigger: 28
                        }
                    }
                ]
            },
            {
                name: 'ATM_MO_MED',
                calculationMode: 'Ticks',
                brackets: [
                    {
                        quantity: 1,
                        stopLoss: 21,
                        target: 42,
                        stopStrategy: {
                            autoBreakEvenPlus: 10,
                            autoBreakEvenProfitTrigger: 21
                        }
                    }
                ]
            },
            {
                name: 'ATM_EA_MED',
                calculationMode: 'Ticks',
                brackets: [
                    {
                        quantity: 1,
                        stopLoss: 19,
                        target: 38,
                        stopStrategy: {
                            autoBreakEvenPlus: 9,
                            autoBreakEvenProfitTrigger: 19
                        }
                    }
                ]
            }
        ];
    } else {
        return [
            {
                name: 'Flazh_MO_HIGH',
                fastPeriod: 14,
                fastRange: 4,
                mediumPeriod: 28,
                mediumRange: 5,
                slowPeriod: 50,
                slowRange: 6,
                filterMultiplier: 15
            },
            {
                name: 'Flazh_MO_MED',
                fastPeriod: 21,
                fastRange: 3,
                mediumPeriod: 41,
                mediumRange: 4,
                slowPeriod: 70,
                slowRange: 5,
                filterMultiplier: 10
            },
            {
                name: 'Flazh_EA_MED',
                fastPeriod: 24,
                fastRange: 3,
                mediumPeriod: 45,
                mediumRange: 4,
                slowPeriod: 75,
                slowRange: 5,
                filterMultiplier: 9
            }
        ];
    }
}

/**
 * Gets the recommended template based on current market conditions
 * @param {string} templateType - 'ATM' or 'Flazh'
 * @param {Object} [overrideConditions] - Optional market conditions override
 * @returns {Promise<Object>} - The recommended template
 */
const getRecommendedTemplate = async (templateType, overrideConditions = null) => {
    // Get current market conditions from service or use override
    const marketConditions = overrideConditions || marketConditionsService.analyzeMarketConditions();

    // Select the best template based on conditions
    return await selectBestTemplate(templateType, marketConditions);
};

/**
 * Adjust template parameters based on market conditions
 * @param {Object} template - Template to adjust
 * @param {Object} marketConditions - Current market conditions
 * @returns {Object} - Adjusted template
 */
const adjustTemplateForMarketConditions = (template, marketConditions) => {
    if (!template || !marketConditions) {
        return template;
    }

    // Determine template type
    const templateType = template.name && template.name.startsWith('ATM_') ? 'ATM' : 'Flazh';
    const volatility = marketConditions.volatilityCategory || 'MEDIUM_VOLATILITY';

    // Create a deep copy of the template to avoid modifying the original
    const adjustedTemplate = JSON.parse(JSON.stringify(template));

    // Get parameter adjustments from market conditions service
    const volatilityAdjustments = marketConditionsService.PARAMETER_ADJUSTMENTS[volatility];

    if (!volatilityAdjustments) {
        console.log(`No adjustments found for volatility: ${volatility}`);
        return adjustedTemplate;
    }

    console.log(`Applying ${volatility} adjustments to ${templateType} template`);

    // Apply adjustments based on template type
    if (templateType.toUpperCase() === 'ATM') {
        const atmAdjustments = volatilityAdjustments.atm;

        // Apply ATM-specific adjustments (adjusting for your structure)
        if (adjustedTemplate.brackets && adjustedTemplate.brackets.length > 0) {
            if (atmAdjustments.StopLoss) {
                adjustedTemplate.brackets[0].stopLoss = atmAdjustments.StopLoss;
            }

            if (atmAdjustments.Target) {
                adjustedTemplate.brackets[0].target = atmAdjustments.Target;
            }

            if (adjustedTemplate.brackets[0].stopStrategy && atmAdjustments.AutoBreakEvenProfitTrigger) {
                adjustedTemplate.brackets[0].stopStrategy.autoBreakEvenProfitTrigger = atmAdjustments.AutoBreakEvenProfitTrigger;
            }

            if (adjustedTemplate.brackets[0].stopStrategy && atmAdjustments.AutoBreakEvenPlus) {
                adjustedTemplate.brackets[0].stopStrategy.autoBreakEvenPlus = atmAdjustments.AutoBreakEvenPlus;
            }
        }
    } else {
        // Flazh template adjustments
        const flazhAdjustments = volatilityAdjustments.flazh;

        // Apply Flazh-specific adjustments
        if (adjustedTemplate.fastPeriod && flazhAdjustments.FastPeriod) {
            adjustedTemplate.fastPeriod = flazhAdjustments.FastPeriod;
        }

        if (adjustedTemplate.fastRange && flazhAdjustments.FastRange) {
            adjustedTemplate.fastRange = flazhAdjustments.FastRange;
        }

        if (adjustedTemplate.mediumPeriod && flazhAdjustments.MediumPeriod) {
            adjustedTemplate.mediumPeriod = flazhAdjustments.MediumPeriod;
        }

        if (adjustedTemplate.mediumRange && flazhAdjustments.MediumRange) {
            adjustedTemplate.mediumRange = flazhAdjustments.MediumRange;
        }

        if (adjustedTemplate.slowPeriod && flazhAdjustments.SlowPeriod) {
            adjustedTemplate.slowPeriod = flazhAdjustments.SlowPeriod;
        }

        if (adjustedTemplate.slowRange && flazhAdjustments.SlowRange) {
            adjustedTemplate.slowRange = flazhAdjustments.SlowRange;
        }

        if (adjustedTemplate.filterMultiplier && flazhAdjustments.FilterMultiplier) {
            adjustedTemplate.filterMultiplier = flazhAdjustments.FilterMultiplier;
        }
    }

    console.log(`Template adjusted for ${volatility}`);
    return adjustedTemplate;
};

module.exports = {
    getRecommendedTemplate,
    selectBestTemplate,
    calculateMarketSimilarity,
    adjustTemplateForMarketConditions
};
// Full path: C:\TradingDashboard\server\services\improvedTemplateSelector.js

const mongoose = require('mongoose');
const AtmStrategy = require('../models/atmStrategy');
const FlazhInfinity = require('../models/flazhInfinity');
const marketConditionsService = require('./marketConditionsService');
const backtestingResultsService = require('./backtestingResultsService');
const fileSystemService = require('./fileSystemService');
const Backtest = require('../models/backtest');

/**
 * Improved Template Selector Service
 * Integrates backtest results and market regime detection to improve template selection
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
    } else if (nameParts.includes('LM')) {
        conditions.session = 'US_MIDDAY';
    } else if (nameParts.includes('PC')) {
        conditions.session = 'US_AFTERNOON';
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
 * Get historical backtest performance for a template
 * @param {Object} template - Template to check
 * @param {Object} marketConditions - Current market conditions
 * @returns {Promise<Object>} - Performance metrics
 */
const getTemplatePerformance = async (template, marketConditions) => {
    if (!template || !template.name) {
        return {
            winRate: 0,
            profitFactor: 0,
            averageRR: 0,
            sampleSize: 0
        };
    }

    try {
        // Convert market conditions to backtest parameters
        const timeOfDay = getTimeOfDayFromSession(marketConditions.session);
        const sessionType = getSessionTypeFromVolatility(marketConditions.volatilityCategory);
        const volatilityScore = getVolatilityScore(marketConditions.volatilityCategory);

        // Get performance metrics from backtest results service
        const metrics = await backtestingResultsService.getPerformanceMetrics(
            timeOfDay,
            sessionType,
            volatilityScore
        );

        return {
            winRate: metrics.winRate || 0,
            profitFactor: metrics.profitFactor || 0,
            averageRR: metrics.averageRR || 0,
            sampleSize: metrics.sampleSize || 0
        };
    } catch (error) {
        console.error(`Error getting template performance: ${error.message}`);
        return {
            winRate: 0,
            profitFactor: 0,
            averageRR: 0,
            sampleSize: 0
        };
    }
};

/**
 * Helper functions to convert between market conditions and backtest parameters
 */
const getTimeOfDayFromSession = (session) => {
    const morningGroups = ['ASIA', 'EUROPE', 'US_OPEN'];
    const afternoonGroups = ['US_MIDDAY', 'US_AFTERNOON'];
    const eveningGroups = ['OVERNIGHT'];

    if (morningGroups.includes(session)) return 'Morning';
    if (afternoonGroups.includes(session)) return 'Afternoon';
    if (eveningGroups.includes(session)) return 'Evening';
    return 'Afternoon'; // Default
};

const getSessionTypeFromVolatility = (volatilityCategory) => {
    if (volatilityCategory === 'HIGH_VOLATILITY') return 'High Volatility';
    if (volatilityCategory === 'LOW_VOLATILITY') return 'Low Volatility';
    return 'Regular'; // Default or MEDIUM_VOLATILITY
};

const getVolatilityScore = (volatilityCategory) => {
    if (volatilityCategory === 'HIGH_VOLATILITY') return 8;
    if (volatilityCategory === 'MEDIUM_VOLATILITY') return 5;
    if (volatilityCategory === 'LOW_VOLATILITY') return 2;
    return 5; // Default
};

/**
 * Calculate a performance score for a template based on backtest results
 * @param {Object} performance - Performance metrics
 * @returns {Number} - Performance score (0-100)
 */
const calculatePerformanceScore = (performance) => {
    if (!performance || performance.sampleSize === 0) {
        return 0;
    }

    // Weight factors
    const winRateWeight = 0.4;
    const profitFactorWeight = 0.4;
    const averageRRWeight = 0.2;

    // Score each metric (0-100 scale)
    const winRateScore = Math.min(performance.winRate * 1.5, 100); // 50% win rate = 75 points
    const profitFactorScore = Math.min(performance.profitFactor * 33, 100); // 3.0 profit factor = 100 points
    const averageRRScore = Math.min(performance.averageRR * 40, 100); // 2.5 R:R = 100 points

    // Weight by sample size (more samples = more reliable)
    const sampleSizeFactor = Math.min(performance.sampleSize / 20, 1); // 20 samples = full weight

    // Calculate weighted score
    const weightedScore =
        (winRateScore * winRateWeight) +
        (profitFactorScore * profitFactorWeight) +
        (averageRRScore * averageRRWeight);

    // Apply sample size factor (reduces score for small sample sizes)
    return Math.round(weightedScore * (0.4 + (0.6 * sampleSizeFactor)));
};

/**
 * Selects the best template based on current market conditions and historical performance
 * @param {string} templateType - 'ATM' or 'Flazh'
 * @param {Object} marketConditions - Current market conditions
 * @returns {Promise<Object>} - The selected template
 */
const selectBestTemplate = async (templateType, marketConditions) => {
    console.log(`Selecting ${templateType} template with backtest performance integration`);
    console.log(`Market conditions: Session=${marketConditions.currentSession}, Volatility=${marketConditions.volatilityCategory}`);

    try {
        // Load templates from both database and file system
        let templates = [];

        // First try to get templates from MongoDB
        const collection = templateType.toUpperCase() === 'ATM'
            ? mongoose.connection.db.collection('atmtemplates')
            : mongoose.connection.db.collection('flazhtemplates');

        const dbTemplates = await collection.find({}).toArray();
        console.log(`Found ${dbTemplates.length} ${templateType} templates in database`);

        if (dbTemplates && dbTemplates.length > 0) {
            templates = dbTemplates;
        } else {
            // If no templates in database, get them from file system
            console.log(`No templates found in database, loading from file system`);
            templates = templateType.toUpperCase() === 'ATM'
                ? await fileSystemService.readAtmTemplates()
                : await fileSystemService.readFlazhTemplates();
        }

        if (!templates || templates.length === 0) {
            console.log(`No ${templateType} templates found in database or file system`);
            return null;
        }

        console.log(`Found ${templates.length} ${templateType} templates to evaluate`);

        // Calculate similarity and performance scores for each template
        const scoredTemplates = await Promise.all(templates.map(async (template) => {
            // Extract template market conditions from name and metadata
            const templateConditions = extractMarketConditionsFromTemplate(template);

            // Calculate similarity score
            const similarityScore = calculateMarketSimilarity(marketConditions, templateConditions);

            // Get template performance from backtest results
            const performance = await getTemplatePerformance(template, marketConditions);

            // Calculate performance score
            const performanceScore = calculatePerformanceScore(performance);

            // Calculate combined score (70% similarity, 30% performance)
            // As we collect more backtest data, we could shift this weighting towards performance
            const combinedScore = (similarityScore * 0.7) + (performanceScore * 0.3);

            return {
                template,
                similarityScore,
                performanceScore,
                combinedScore,
                performance
            };
        }));

        // Sort by combined score (highest first)
        scoredTemplates.sort((a, b) => b.combinedScore - a.combinedScore);

        // Log the top 3 templates for debugging
        const topTemplates = scoredTemplates.slice(0, Math.min(3, scoredTemplates.length));
        console.log('Top matching templates:');
        topTemplates.forEach((item, index) => {
            console.log(`${index + 1}. ${item.template.name} (Combined Score: ${item.combinedScore.toFixed(1)}, Similarity: ${item.similarityScore}, Performance: ${item.performanceScore})`);
            console.log(`   Performance: Win Rate=${item.performance.winRate}%, Profit Factor=${item.performance.profitFactor}, Avg R:R=${item.performance.averageRR}, Samples=${item.performance.sampleSize}`);
        });

        // Select the best template
        const bestMatch = scoredTemplates[0];

        if (bestMatch && bestMatch.combinedScore > 40) {
            console.log(`Selected template: ${bestMatch.template.name} with combined score: ${bestMatch.combinedScore.toFixed(1)}`);
            return bestMatch.template;
        }

        // If no good match found, use first template as fallback
        console.log('No template with good combined score found, using first template as fallback');
        return templates[0];
    } catch (error) {
        console.error(`Error selecting best template: ${error.message}`);
        console.error('Using fallback to mock templates as temporary measure');

        // Use mock templates as fallback in case of error
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
    const marketConditions = overrideConditions || await marketConditionsService.analyzeMarketConditions();

    // Select the best template based on conditions and backtest performance
    return await selectBestTemplate(templateType, marketConditions);
};

/**
 * Get backtest-based parameter adjustments
 * @param {Object} template - Template to adjust
 * @param {Object} marketConditions - Current market conditions
 * @returns {Promise<Object>} - Adjustment factors
 */
const getBacktestAdjustments = async (template, marketConditions) => {
    try {
        // Convert market conditions to backtest parameters
        const timeOfDay = getTimeOfDayFromSession(marketConditions.session);
        const volatilityScore = getVolatilityScore(marketConditions.volatilityCategory);

        // Get volatility and session adjustments
        const volatilityAdjustments = backtestingResultsService.getVolatilityAdjustments(volatilityScore);
        const sessionAdjustments = backtestingResultsService.getSessionAdjustments(timeOfDay);

        // Combine adjustments (multiply factors)
        return {
            stopLoss: volatilityAdjustments.stopLoss * sessionAdjustments.stopLoss,
            target: volatilityAdjustments.target * sessionAdjustments.target,
            trailingStop: volatilityAdjustments.trailingStop * sessionAdjustments.trailingStop
        };
    } catch (error) {
        console.error(`Error getting backtest adjustments: ${error.message}`);
        return {
            stopLoss: 1.0,
            target: 1.0,
            trailingStop: 1.0
        };
    }
};

/**
 * Adjust template parameters based on market conditions and backtest performance
 * @param {Object} template - Template to adjust
 * @param {Object} marketConditions - Current market conditions
 * @returns {Promise<Object>} - Adjusted template
 */
const adjustTemplateForBacktestResults = async (template, marketConditions) => {
    if (!template || !marketConditions) {
        return template;
    }

    // Determine template type
    const templateType = template.name && template.name.startsWith('ATM_') ? 'ATM' : 'Flazh';

    // Create a deep copy of the template to avoid modifying the original
    const adjustedTemplate = JSON.parse(JSON.stringify(template));

    try {
        // Get backtest-based adjustments
        const adjustments = await getBacktestAdjustments(template, marketConditions);

        console.log(`Applying backtest-based adjustments to ${templateType} template`);
        console.log(`Adjustments: StopLoss=${adjustments.stopLoss.toFixed(2)}, Target=${adjustments.target.toFixed(2)}, TrailingStop=${adjustments.trailingStop.toFixed(2)}`);

        // Apply adjustments based on template type
        if (templateType.toUpperCase() === 'ATM') {
            // Apply ATM-specific adjustments
            if (adjustedTemplate.brackets && adjustedTemplate.brackets.length > 0) {
                // Apply stop loss adjustment
                if (adjustedTemplate.brackets[0].stopLoss) {
                    const originalStopLoss = adjustedTemplate.brackets[0].stopLoss;
                    adjustedTemplate.brackets[0].stopLoss = Math.round(originalStopLoss * adjustments.stopLoss);
                }

                // Apply target adjustment
                if (adjustedTemplate.brackets[0].target) {
                    const originalTarget = adjustedTemplate.brackets[0].target;
                    adjustedTemplate.brackets[0].target = Math.round(originalTarget * adjustments.target);
                }

                // Apply trailing stop adjustment if present
                if (adjustedTemplate.brackets[0].stopStrategy) {
                    if (adjustedTemplate.brackets[0].stopStrategy.autoBreakEvenProfitTrigger) {
                        const originalTrigger = adjustedTemplate.brackets[0].stopStrategy.autoBreakEvenProfitTrigger;
                        adjustedTemplate.brackets[0].stopStrategy.autoBreakEvenProfitTrigger =
                            Math.round(originalTrigger * adjustments.trailingStop);
                    }

                    if (adjustedTemplate.brackets[0].stopStrategy.autoBreakEvenPlus) {
                        const originalPlus = adjustedTemplate.brackets[0].stopStrategy.autoBreakEvenPlus;
                        adjustedTemplate.brackets[0].stopStrategy.autoBreakEvenPlus =
                            Math.round(originalPlus * adjustments.trailingStop);
                    }
                }
            }
        } else {
            // Flazh template adjustments

            // Apply filter multiplier adjustment (correlates with volatility)
            if (adjustedTemplate.filterMultiplier) {
                const originalMultiplier = adjustedTemplate.filterMultiplier;
                adjustedTemplate.filterMultiplier = Math.round(originalMultiplier * adjustments.stopLoss);
            }

            // For high volatility, increase ranges
            if (marketConditions.volatilityCategory === 'HIGH_VOLATILITY') {
                if (adjustedTemplate.fastRange) {
                    adjustedTemplate.fastRange = Math.max(adjustedTemplate.fastRange, Math.round(adjustedTemplate.fastRange * 1.2));
                }
                if (adjustedTemplate.mediumRange) {
                    adjustedTemplate.mediumRange = Math.max(adjustedTemplate.mediumRange, Math.round(adjustedTemplate.mediumRange * 1.15));
                }
                if (adjustedTemplate.slowRange) {
                    adjustedTemplate.slowRange = Math.max(adjustedTemplate.slowRange, Math.round(adjustedTemplate.slowRange * 1.1));
                }
            }

            // For low volatility, adjust periods
            if (marketConditions.volatilityCategory === 'LOW_VOLATILITY') {
                if (adjustedTemplate.fastPeriod) {
                    adjustedTemplate.fastPeriod = Math.max(adjustedTemplate.fastPeriod, Math.round(adjustedTemplate.fastPeriod * 1.1));
                }
                if (adjustedTemplate.mediumPeriod) {
                    adjustedTemplate.mediumPeriod = Math.max(adjustedTemplate.mediumPeriod, Math.round(adjustedTemplate.mediumPeriod * 1.05));
                }
                if (adjustedTemplate.slowPeriod) {
                    adjustedTemplate.slowPeriod = Math.max(adjustedTemplate.slowPeriod, Math.round(adjustedTemplate.slowPeriod * 1.05));
                }
            }
        }

        console.log(`Template parameters adjusted based on backtest results`);

        // Save adjusted template to file system if file paths are available
        if (template.sourceFilePath) {
            if (templateType.toUpperCase() === 'ATM') {
                await fileSystemService.writeAtmTemplate(adjustedTemplate);
            } else {
                await fileSystemService.writeFlazhTemplate(adjustedTemplate);
            }
        }

        return adjustedTemplate;
    } catch (error) {
        console.error(`Error adjusting template for backtest results: ${error.message}`);
        return adjustedTemplate; // Return unadjusted template on error
    }
};

module.exports = {
    getRecommendedTemplate,
    selectBestTemplate,
    calculateMarketSimilarity,
    adjustTemplateForBacktestResults,
    getTemplatePerformance,
    calculatePerformanceScore,
    extractMarketConditionsFromTemplate
};
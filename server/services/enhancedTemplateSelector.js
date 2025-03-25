// C:\TradingDashboard\server\services\enhancedTemplateSelector.js

const templateSelector = require('../services/templateSelector');;
const marketDataService = require('./marketDataService');
const backtestingResultsService = require('./backtestingResultsService');

/**
 * Enhanced Template Selector Service
 * Provides enhanced template recommendations based on market conditions and performance data
 */
const enhancedTemplateSelector = {
    /**
     * Overloaded getRecommendedTemplate function that supports both:
     * - Single parameter: market conditions (used by the root endpoint)
     * - Two parameters: template type and market conditions (used by your existing endpoints)
     * 
     * @param {string|object} param1 - Either template type (string) or market conditions (object)
     * @param {object|null} param2 - Market conditions object or null
     * @returns {Promise<object>} - Template object or object with both template types
     */
    getRecommendedTemplate: async function (param1, param2 = null) {
        // Case 1: Called with just market conditions (from root endpoint)
        if (typeof param1 === 'object' && param1 !== null && param2 === null) {
            const marketConditions = param1;
            console.log('Enhanced template selector called with market conditions:', marketConditions);

            // Validate market conditions
            const validatedConditions = marketConditions || {
                volatility: 'medium',
                trend: 'neutral',
                volume: 'normal',
                session: 'regular',
                timestamp: new Date().toISOString()
            };

            try {
                // Get both template types
                const basicSelector = require('./templateSelector');

                // Get Flazh template
                let flazhTemplate;
                try {
                    flazhTemplate = await basicSelector.getTemplateForConditions(
                        'Flazh',
                        validatedConditions.session || 'regular',
                        validatedConditions.volatility || 'medium'
                    );
                } catch (flazhError) {
                    console.error('Error getting Flazh template:', flazhError);
                    flazhTemplate = null;
                }

                // Get ATM template
                let atmTemplate;
                try {
                    atmTemplate = await basicSelector.getTemplateForConditions(
                        'ATM',
                        validatedConditions.session || 'regular',
                        validatedConditions.volatility || 'medium'
                    );
                } catch (atmError) {
                    console.error('Error getting ATM template:', atmError);
                    atmTemplate = null;
                }

                // Ensure we have templates, use fallbacks if needed
                if (!flazhTemplate) {
                    console.warn('No Flazh template found, using fallback');
                    flazhTemplate = this._getFallbackTemplate('Flazh', validatedConditions);
                }

                if (!atmTemplate) {
                    console.warn('No ATM template found, using fallback');
                    atmTemplate = this._getFallbackTemplate('ATM', validatedConditions);
                }

                // Return both templates in the expected format
                return {
                    flazh: flazhTemplate,
                    atm: atmTemplate,
                    marketConditions: validatedConditions
                };
            } catch (error) {
                console.error('Error in getRecommendedTemplate:', error);

                // Return fallback templates in case of error
                return {
                    flazh: this._getFallbackTemplate('Flazh', validatedConditions),
                    atm: this._getFallbackTemplate('ATM', validatedConditions),
                    marketConditions: validatedConditions,
                    error: 'Error retrieving templates, using fallbacks'
                };
            }
        }
        // Case 2: Called with template type and market conditions (existing behavior)
        else {
            const templateType = param1;
            const marketConditions = param2;

            try {
                // This is the original implementation
                const basicSelector = require('./templateSelector');
                let template;

                if (marketConditions) {
                    // If custom market conditions are provided, use them
                    template = await basicSelector.getTemplateForConditions(
                        templateType,
                        marketConditions.currentSession || marketConditions.session,
                        marketConditions.volatilityCategory || marketConditions.volatility
                    );
                } else {
                    // Otherwise get for current conditions
                    template = await basicSelector.getRecommendedTemplate(templateType);
                }

                return template || this._getFallbackTemplate(templateType, marketConditions);
            } catch (error) {
                console.error(`Error in getRecommendedTemplate for ${templateType}:`, error);
                return this._getFallbackTemplate(templateType, marketConditions);
            }
        }
    },

    /**
     * Get enhanced template with performance-based adjustments
     * 
     * @param {string} templateType - Type of template (ATM or Flazh)
     * @param {Date} timestamp - Timestamp for market conditions
     * @param {object} marketData - Current market data
     * @returns {Promise<object>} - Enhanced template object
     */
    getEnhancedTemplate: async (templateType, timestamp, marketData) => {
        try {
            // Get base template from the basic selector
            const basicSelector = require('./templateSelector');
            const baseTemplate = await basicSelector.getRecommendedTemplate(templateType);

            if (!baseTemplate) {
                console.log(`No base template found for ${templateType}`);
                return null;
            }

            // Determine market conditions
            const conditions = basicSelector.determineMarketConditions(timestamp, marketData);

            // Map conditions to performance metrics
            const timeOfDay = enhancedTemplateSelector.mapSessionToTimeOfDay(conditions.session);
            const sessionType = enhancedTemplateSelector.mapVolatilityToSessionType(conditions.volatility);
            const volatilityScore = enhancedTemplateSelector.calculateVolatilityScore(conditions.volatility, marketData);

            // Get performance metrics for these conditions
            const performanceMetrics = await backtestingResultsService.getPerformanceMetrics(
                timeOfDay,
                sessionType,
                volatilityScore
            );

            // Apply adjustments to template based on performance metrics
            const adjustedTemplate = enhancedTemplateSelector.adjustTemplateParameters(
                baseTemplate,
                performanceMetrics,
                volatilityScore
            );

            return {
                originalTemplate: baseTemplate,
                adjustedTemplate,
                performanceMetrics,
                adjustmentNote: "Enhanced template adjusted based on historical performance"
            };
        } catch (error) {
            console.error(`Error in getEnhancedTemplate for ${templateType}:`, error);
            return null;
        }
    },

    /**
     * Get custom enhanced template based on specified conditions
     * 
     * @param {object} options - Template options
     * @param {string} options.templateType - Type of template (ATM or Flazh)
     * @param {string} options.session - Market session
     * @param {string} options.volatility - Volatility level
     * @returns {Promise<object>} - Enhanced template object
     */
    getCustomEnhancedTemplate: async (options) => {
        try {
            const { templateType, session, volatility } = options;

            // Get base template for these conditions
            const basicSelector = require('./templateSelector');
            const baseTemplate = await basicSelector.getTemplateForConditions(
                templateType,
                session,
                volatility
            );

            if (!baseTemplate) {
                console.log(`No base template found for ${templateType} with session=${session}, volatility=${volatility}`);
                return null;
            }

            // Map conditions to performance metrics
            const timeOfDay = enhancedTemplateSelector.mapSessionToTimeOfDay(session);
            const sessionType = enhancedTemplateSelector.mapVolatilityToSessionType(volatility);

            // Calculate volatility score (mocked here, would be based on real data)
            let volatilityScore = 5; // Medium default
            if (volatility.includes('HIGH')) {
                volatilityScore = 8;
            } else if (volatility.includes('LOW')) {
                volatilityScore = 2;
            }

            // Get performance metrics for these conditions
            const performanceMetrics = await backtestingResultsService.getPerformanceMetrics(
                timeOfDay,
                sessionType,
                volatilityScore
            );

            // Apply adjustments to template based on performance metrics
            const adjustedTemplate = enhancedTemplateSelector.adjustTemplateParameters(
                baseTemplate,
                performanceMetrics,
                volatilityScore
            );

            return {
                originalTemplate: baseTemplate,
                adjustedTemplate,
                performanceMetrics,
                adjustmentNote: "Custom enhanced template adjusted based on historical performance"
            };
        } catch (error) {
            console.error('Error in getCustomEnhancedTemplate:', error);
            return null;
        }
    },

    /**
     * Map session to time of day for performance analysis
     * 
     * @param {string} session - Market session
     * @returns {string} - Time of day category
     */
    mapSessionToTimeOfDay: (session) => {
        if (session.includes('US_OPEN') || session.includes('MORNING')) {
            return 'Morning';
        } else if (session.includes('US_MIDDAY') || session.includes('US_AFTERNOON')) {
            return 'Afternoon';
        } else if (session.includes('OVERNIGHT') || session.includes('ASIA') || session.includes('EUROPE')) {
            return 'Evening';
        } else {
            return 'Morning'; // Default fallback
        }
    },

    /**
     * Map volatility to session type for performance analysis
     * 
     * @param {string} volatility - Volatility level
     * @returns {string} - Session type category
     */
    mapVolatilityToSessionType: (volatility) => {
        if (volatility.includes('HIGH')) {
            return 'High Volatility';
        } else if (volatility.includes('LOW')) {
            return 'Low Volatility';
        } else {
            return 'Regular';
        }
    },

    /**
     * Calculate volatility score based on market data
     * 
     * @param {string} volatilityCategory - Volatility category
     * @param {object} marketData - Market data
     * @returns {number} - Volatility score (1-10)
     */
    calculateVolatilityScore: (volatilityCategory, marketData) => {
        // In a real implementation, this would use actual market data
        // For now, use category as a rough proxy
        if (volatilityCategory.includes('HIGH')) {
            return 7 + (Math.random() * 3); // 7-10
        } else if (volatilityCategory.includes('MEDIUM')) {
            return 4 + (Math.random() * 3); // 4-7
        } else {
            return 1 + (Math.random() * 3); // 1-4
        }
    },

    /**
     * Adjust template parameters based on performance metrics
     * 
     * @param {object} baseTemplate - Original template
     * @param {object} performanceMetrics - Performance metrics
     * @param {number} volatilityScore - Volatility score
     * @returns {object} - Adjusted template
     */
    adjustTemplateParameters: (baseTemplate, performanceMetrics, volatilityScore) => {
        // Create a deep copy of the template to avoid modifying the original
        const adjustedTemplate = JSON.parse(JSON.stringify(baseTemplate));

        // If we don't have performance metrics, return the original template
        if (!performanceMetrics || !performanceMetrics.adjustmentFactors) {
            return adjustedTemplate;
        }

        // Rename the template to indicate it's enhanced
        if (adjustedTemplate.name) {
            adjustedTemplate.templateName = `${adjustedTemplate.name} (Enhanced)`;
        } else if (adjustedTemplate.templateName) {
            adjustedTemplate.templateName = `${adjustedTemplate.templateName} (Enhanced)`;
        }

        // Apply adjustment factors to different parameters based on template type
        const { stopLossAdjustment, targetAdjustment, trailingStopAdjustment } = performanceMetrics.adjustmentFactors;

        // Apply common adjustments for both template types
        if (adjustedTemplate.stopLoss) {
            adjustedTemplate.stopLoss = Math.round(adjustedTemplate.stopLoss * stopLossAdjustment);
        }

        if (adjustedTemplate.target) {
            adjustedTemplate.target = Math.round(adjustedTemplate.target * targetAdjustment);
        }

        if (adjustedTemplate.trailingStop) {
            adjustedTemplate.trailingStop = Math.round(adjustedTemplate.trailingStop * trailingStopAdjustment);
        }

        // Apply template-specific adjustments
        if (baseTemplate.fastPeriod) {
            // This is a Flazh template

            // Adjust periods based on volatility
            if (volatilityScore > 6) {
                // Higher volatility - decrease periods
                adjustedTemplate.fastPeriod = Math.max(3, Math.round(adjustedTemplate.fastPeriod * 0.8));
                adjustedTemplate.mediumPeriod = Math.max(6, Math.round(adjustedTemplate.mediumPeriod * 0.85));
                adjustedTemplate.slowPeriod = Math.max(10, Math.round(adjustedTemplate.slowPeriod * 0.9));
            } else if (volatilityScore < 4) {
                // Lower volatility - increase periods
                adjustedTemplate.fastPeriod = Math.round(adjustedTemplate.fastPeriod * 1.2);
                adjustedTemplate.mediumPeriod = Math.round(adjustedTemplate.mediumPeriod * 1.15);
                adjustedTemplate.slowPeriod = Math.round(adjustedTemplate.slowPeriod * 1.1);
            }

            // Adjust ranges based on performance
            const winRateAdjustment = performanceMetrics.winRate > 60 ? 0.9 : 1.1;
            adjustedTemplate.fastRange = Math.round(adjustedTemplate.fastRange * winRateAdjustment);
            adjustedTemplate.mediumRange = Math.round(adjustedTemplate.mediumRange * winRateAdjustment);
            adjustedTemplate.slowRange = Math.round(adjustedTemplate.slowRange * winRateAdjustment);

            // Adjust filter multiplier based on profit factor
            if (performanceMetrics.profitFactor < 1.3) {
                // Increase filter to reduce false signals
                adjustedTemplate.filterMultiplier = Math.min(5, Math.round(adjustedTemplate.filterMultiplier * 1.2));
            } else if (performanceMetrics.profitFactor > 1.8) {
                // Decrease filter to capture more opportunities
                adjustedTemplate.filterMultiplier = Math.max(1, Math.round(adjustedTemplate.filterMultiplier * 0.9));
            }
        } else if (baseTemplate.brackets || baseTemplate.calculationMode) {
            // This is an ATM template

            // Adjust brackets based on volatility
            if (adjustedTemplate.brackets) {
                if (volatilityScore > 7) {
                    // For high volatility, use wider brackets
                    adjustedTemplate.brackets = "Wide";
                } else if (volatilityScore < 3) {
                    // For low volatility, use narrower brackets
                    adjustedTemplate.brackets = "Narrow";
                } else {
                    // For medium volatility, use standard brackets
                    adjustedTemplate.brackets = "Standard";
                }
            }

            // Adjust calculation mode based on win rate
            if (adjustedTemplate.calculationMode && performanceMetrics.winRate) {
                if (performanceMetrics.winRate > 65) {
                    // Higher win rate - use percentage-based calculation
                    adjustedTemplate.calculationMode = "Percentage";
                } else {
                    // Lower win rate - use tick-based calculation
                    adjustedTemplate.calculationMode = "Ticks";
                }
            }
        }

        return adjustedTemplate;
    },

    /**
     * Internal helper to create fallback templates
     * @private
     */
    _getFallbackTemplate: function (templateType, marketConditions = {}) {
        // Create sensible defaults based on provided market conditions
        const volatility = marketConditions?.volatility || 'medium';
        const trend = marketConditions?.trend || 'neutral';

        if (templateType.toLowerCase().includes('flazh')) {
            return {
                name: `Fallback Flazh (${volatility} volatility)`,
                description: "System-generated fallback template when no matching templates found",
                conditions: {
                    volatility: volatility,
                    trend: trend,
                    volume: 'normal',
                    session: 'regular'
                },
                parameters: {
                    stopLoss: volatility === 'high' ? 15 : (volatility === 'low' ? 8 : 12),
                    takeProfit: volatility === 'high' ? 30 : (volatility === 'low' ? 16 : 24),
                    trailStop: volatility === 'high' ? 8 : (volatility === 'low' ? 4 : 6),
                    entryFilter: 50,
                    marketNoiseFilter: volatility === 'high' ? 70 : (volatility === 'low' ? 30 : 50),
                    trendStrengthThreshold: trend.includes('strong') ? 80 : 50,
                    fastPeriod: 5,
                    mediumPeriod: 10,
                    slowPeriod: 20,
                    fastRange: 6,
                    mediumRange: 12,
                    slowRange: 24,
                    filterMultiplier: 2
                },
                matchScore: 0,
                isFallback: true
            };
        } else {
            // ATM template
            return {
                name: `Fallback ATM (${volatility} volatility)`,
                description: "System-generated fallback template when no matching templates found",
                conditions: {
                    volatility: volatility,
                    trend: trend,
                    volume: 'normal',
                    session: 'regular'
                },
                parameters: {
                    stopLoss: volatility === 'high' ? 12 : (volatility === 'low' ? 6 : 9),
                    profit1: volatility === 'high' ? 20 : (volatility === 'low' ? 10 : 15),
                    profit2: volatility === 'high' ? 30 : (volatility === 'low' ? 18 : 25),
                    autoBreakEven: true,
                    breakEvenTicks: volatility === 'high' ? 8 : (volatility === 'low' ? 4 : 6),
                    brackets: volatility === 'high' ? "Wide" : (volatility === 'low' ? "Narrow" : "Standard"),
                    calculationMode: "Ticks"
                },
                matchScore: 0,
                isFallback: true
            };
        }
    }
};

module.exports = enhancedTemplateSelector;
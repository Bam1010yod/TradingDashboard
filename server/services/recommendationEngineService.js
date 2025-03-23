// Full path: C:\TradingDashboard\server\services\recommendationEngineService.js

const marketConditionsService = require('./marketConditionsService');
const improvedTemplateSelector = require('./improvedTemplateSelector');
const backtestingResultsService = require('./backtestingResultsService');

/**
 * Recommendation Engine Service
 * Provides enhanced trading template recommendations based on current market conditions
 * and historical backtest performance
 */
class RecommendationEngineService {
    /**
     * Initialize the recommendation engine
     * @returns {Promise<boolean>} - Initialization success
     */
    async initialize() {
        console.log('Recommendation Engine Service initialized with backtest integration');
        return true;
    }

    /**
     * Get recommendations for the current market conditions
     * @param {Object} [overrideConditions] - Optional market conditions override
     * @returns {Promise<Object>} - Recommendations object
     */
    async getRecommendations(overrideConditions = null) {
        try {
            // Get current market conditions
            const marketConditions = overrideConditions || await marketConditionsService.analyzeMarketConditions();
            console.log('Market conditions for recommendations:', marketConditions);

            // Get ATM and Flazh templates using the improved selector
            const atmTemplate = await improvedTemplateSelector.getRecommendedTemplate('ATM', marketConditions);
            const flazhTemplate = await improvedTemplateSelector.getRecommendedTemplate('Flazh', marketConditions);

            // Apply backtest-based adjustments to templates
            const adjustedAtmTemplate = await improvedTemplateSelector.adjustTemplateForBacktestResults(
                atmTemplate,
                marketConditions
            );

            const adjustedFlazhTemplate = await improvedTemplateSelector.adjustTemplateForBacktestResults(
                flazhTemplate,
                marketConditions
            );

            // Get performance metrics for the templates
            const atmPerformance = await improvedTemplateSelector.getTemplatePerformance(atmTemplate, marketConditions);
            const flazhPerformance = await improvedTemplateSelector.getTemplatePerformance(flazhTemplate, marketConditions);

            // Format the response
            return {
                timestamp: new Date(),
                marketConditions: marketConditions,
                atm: {
                    templateName: atmTemplate?.name || 'No Template Found',
                    originalTemplate: atmTemplate,
                    adjustedTemplate: adjustedAtmTemplate,
                    performanceMetrics: {
                        winRate: atmPerformance.winRate,
                        profitFactor: atmPerformance.profitFactor,
                        averageRR: atmPerformance.averageRR,
                        sampleSize: atmPerformance.sampleSize
                    },
                    confidenceScore: improvedTemplateSelector.calculatePerformanceScore(atmPerformance)
                },
                flazh: {
                    templateName: flazhTemplate?.name || 'No Template Found',
                    originalTemplate: flazhTemplate,
                    adjustedTemplate: adjustedFlazhTemplate,
                    performanceMetrics: {
                        winRate: flazhPerformance.winRate,
                        profitFactor: flazhPerformance.profitFactor,
                        averageRR: flazhPerformance.averageRR,
                        sampleSize: flazhPerformance.sampleSize
                    },
                    confidenceScore: improvedTemplateSelector.calculatePerformanceScore(flazhPerformance)
                }
            };
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }

    /**
     * Get recommendations suitable for a specific trading session
     * @param {string} session - Session identifier (e.g., 'US_OPEN', 'US_AFTERNOON')
     * @param {string} volatilityCategory - Volatility category (e.g., 'HIGH_VOLATILITY', 'MEDIUM_VOLATILITY', 'LOW_VOLATILITY')
     * @returns {Promise<Object>} - Session-specific recommendations
     */
    async getSessionRecommendations(session, volatilityCategory) {
        const overrideConditions = {
            currentSession: session,
            volatilityCategory: volatilityCategory,
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
        };

        return await this.getRecommendations(overrideConditions);
    }
}

module.exports = new RecommendationEngineService();
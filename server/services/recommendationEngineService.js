/**
 * Recommendation Engine Service
 * This service integrates market data, news, and backtesting results
 * to provide comprehensive template recommendations
 */

const marketDataService = require('./marketDataService');
const marketNewsService = require('./marketNewsService');
const parameterOptimizationService = require('./parameterOptimizationService');
const backtestingResultsService = require('./backtestingResultsService');
const tradingSessionService = require('./tradingSessionService');

/**
 * Generate comprehensive template recommendations based on available data
 * @param {String} timeOfDay - Time of day (Morning, Afternoon, Evening)
 * @param {String} sessionType - Session type (Regular, High Volatility, Low Volatility)
 * @returns {Object} - Complete recommendation with parameters and context
 */
async function generateRecommendations(timeOfDay, sessionType) {
    try {
        console.log('Generating comprehensive template recommendations...');

        // 1. Get current market data
        let marketData = marketDataService.getLatestMarketData();
        console.log('Retrieved current market data');

        // Check if market data is available
        if (!marketData) {
            console.log('No market data available - using default test data');
            // Use test data when real market data is not available (weekend or after hours)
            marketData = createTestMarketData();
        }

        // 2. Get relevant market news
        let marketNews = [];
        try {
            marketNews = await marketNewsService.getRelevantNews();
            console.log('Retrieved relevant market news');
        } catch (error) {
            console.error('Error retrieving market news:', error);
            console.log('Using empty market news array');
            marketNews = [];
        }

        // 3. Get optimized parameters based on historical performance
        const optimizedParameters = await parameterOptimizationService.optimizeParameters(
            marketData,
            timeOfDay,
            sessionType
        );
        console.log('Generated optimized parameters');

        // 4. Get backtesting performance metrics for these market conditions
        const backtestMetrics = await backtestingResultsService.getPerformanceMetrics(
            timeOfDay,
            sessionType,
            marketData.volatilityScore || 5
        );
        console.log('Retrieved backtesting performance metrics');

        // 5. Get volatility-based adjustments
        const volatilityAdjustments = backtestingResultsService.getVolatilityAdjustments(
            marketData.volatilityScore || 5
        );
        console.log('Generated volatility-based adjustments');

        // 6. Get session-based adjustments
        const sessionAdjustments = backtestingResultsService.getSessionAdjustments(timeOfDay);
        console.log('Generated session-based adjustments');

        // 7. Analyze market news sentiment for potential adjustments
        const newsImpact = analyzeNewsImpact(marketNews, marketData.symbol);
        console.log('Analyzed news impact');

        // 8. Apply all adjustments to create final parameters
        const adjustedParameters = applyAllAdjustments(
            optimizedParameters,
            newsImpact,
            backtestMetrics,
            volatilityAdjustments,
            sessionAdjustments
        );
        console.log('Applied all adjustments to parameters');

        // 9. Generate final recommendation
        const recommendation = {
            timeOfDay,
            sessionType,
            marketConditions: {
                summary: optimizedParameters.marketConditionsSummary,
                data: marketData
            },
            recommendations: {
                flazh: adjustedParameters.flazhParameters,
                atm: adjustedParameters.atmParameters,
                confidence: calculateFinalConfidence(
                    optimizedParameters.confidence,
                    newsImpact.confidence,
                    backtestMetrics.confidenceLevel
                )
            },
            backtestingInsights: {
                sampleSize: backtestMetrics.sampleSize || 0,
                winRate: backtestMetrics.winRate || 0,
                profitFactor: backtestMetrics.profitFactor || 0
            },
            relevantNews: formatRelevantNews(marketNews, newsImpact),
            generatedAt: new Date().toISOString()
        };

        console.log('Recommendation generation completed');
        return recommendation;
    } catch (error) {
        console.error('Error generating recommendations:', error);
        throw new Error('Failed to generate template recommendations');
    }
}

/**
 * Create test market data for when real data is not available
 * @returns {Object} - Test market data
 */
function createTestMarketData() {
    return {
        timestamp: new Date(),
        symbol: 'NQ',
        atr: 35,
        overnightRange: 50,
        volatilityScore: 7.5,
        volatilityLevel: 'Medium',
        currentPrice: 19245,
        dailyVolatility: 1.8,
        volume: 12500,
        trend: 'neutral',
        priceRange: 65
    };
}

/**
 * Analyze impact of market news on trading parameters
 * @param {Array} news - Market news items
 * @param {String} symbol - Trading symbol
 * @returns {Object} - Analysis of news impact
 */
function analyzeNewsImpact(news, symbol) {
    // [This function remains the same as before]
    const impact = {
        sentiment: 'neutral',
        volatilityImpact: 0,
        trendImpact: 0,
        confidence: 'medium',
        relevantNewsIndices: []
    };

    // Check if news exists
    if (!news || news.length === 0) {
        console.warn('No market news available for analysis');
        impact.confidence = 'low';
        return impact;
    }

    // Filter news relevant to the trading symbol
    const relevantNews = news.filter((item, index) => {
        // Ensure item has all the properties we need
        if (!item || !item.title || !item.content) {
            return false;
        }

        const isRelevant =
            item.title.includes(symbol) ||
            item.content.includes(symbol) ||
            (item.categories && (
                item.categories.includes('market_volatility') ||
                item.categories.includes('futures') ||
                item.categories.includes('fed') ||
                item.categories.includes('economic_data')
            ));

        if (isRelevant) {
            impact.relevantNewsIndices.push(index);
        }

        return isRelevant;
    });

    // If no relevant news found, return default impact
    if (relevantNews.length === 0) {
        return impact;
    }

    // Calculate sentiment score and volatility impact
    let sentimentScore = 0;
    let volatilityImpact = 0;

    relevantNews.forEach(item => {
        // Simple sentiment analysis based on keywords
        if (item.sentiment) {
            sentimentScore += item.sentiment === 'positive' ? 1 : (item.sentiment === 'negative' ? -1 : 0);
        } else {
            // Fallback if sentiment not provided
            const text = item.title + ' ' + item.content;
            const positiveKeywords = ['bullish', 'growth', 'optimistic', 'rally', 'gain', 'positive', 'upbeat'];
            const negativeKeywords = ['bearish', 'recession', 'pessimistic', 'correction', 'loss', 'negative', 'downbeat', 'fear'];

            positiveKeywords.forEach(keyword => {
                if (text.toLowerCase().includes(keyword)) sentimentScore += 0.2;
            });

            negativeKeywords.forEach(keyword => {
                if (text.toLowerCase().includes(keyword)) sentimentScore -= 0.2;
            });
        }

        // Calculate volatility impact
        const volatilityKeywords = ['volatility', 'uncertainty', 'surprise', 'unexpected', 'shock', 'crash', 'spike'];
        const text = item.title + ' ' + item.content;

        volatilityKeywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword)) volatilityImpact += 0.3;
        });
    });

    // Normalize scores
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore / relevantNews.length));
    volatilityImpact = Math.min(1, volatilityImpact);

    // Determine overall sentiment
    if (sentimentScore > 0.3) {
        impact.sentiment = 'positive';
        impact.trendImpact = sentimentScore;
    } else if (sentimentScore < -0.3) {
        impact.sentiment = 'negative';
        impact.trendImpact = sentimentScore;
    }

    // Set volatility impact
    impact.volatilityImpact = volatilityImpact;

    // Set confidence level based on number of relevant news items
    if (relevantNews.length >= 3) {
        impact.confidence = 'high';
    } else if (relevantNews.length >= 1) {
        impact.confidence = 'medium';
    } else {
        impact.confidence = 'low';
    }

    return impact;
}

/**
 * Apply all adjustments to create final parameters
 * @param {Object} parameters - Optimized parameters
 * @param {Object} newsImpact - News impact analysis
 * @param {Object} backtestMetrics - Backtesting performance metrics
 * @param {Object} volatilityAdjustments - Volatility-based adjustments
 * @param {Object} sessionAdjustments - Session-based adjustments
 * @returns {Object} - Adjusted parameters
 */
function applyAllAdjustments(parameters, newsImpact, backtestMetrics, volatilityAdjustments, sessionAdjustments) {
    // Create a deep copy of parameters to avoid modifying the original
    const adjustedParameters = {
        flazhParameters: { ...parameters.flazhParameters },
        atmParameters: { ...parameters.atmParameters },
        confidence: parameters.confidence,
        marketConditionsSummary: parameters.marketConditionsSummary
    };

    // Apply backtesting-based adjustments with highest priority
    // Only apply if we have successful backtest data with sufficient confidence
    if (backtestMetrics.success && backtestMetrics.confidenceLevel !== 'low') {
        console.log('Applying adjustments based on backtest results');

        adjustedParameters.flazhParameters.stopLoss = Math.round(
            adjustedParameters.flazhParameters.stopLoss * backtestMetrics.adjustmentFactors.stopLossAdjustment
        );
        adjustedParameters.flazhParameters.targetProfit = Math.round(
            adjustedParameters.flazhParameters.targetProfit * backtestMetrics.adjustmentFactors.targetAdjustment
        );
        adjustedParameters.flazhParameters.trailingStop = Math.round(
            adjustedParameters.flazhParameters.trailingStop * backtestMetrics.adjustmentFactors.trailingStopAdjustment
        );

        adjustedParameters.atmParameters.stopLoss = Math.round(
            adjustedParameters.atmParameters.stopLoss * backtestMetrics.adjustmentFactors.stopLossAdjustment
        );
        adjustedParameters.atmParameters.target1 = Math.round(
            adjustedParameters.atmParameters.target1 * backtestMetrics.adjustmentFactors.targetAdjustment
        );
        adjustedParameters.atmParameters.target2 = Math.round(
            adjustedParameters.atmParameters.target2 * backtestMetrics.adjustmentFactors.targetAdjustment
        );
    } else {
        // If we don't have good backtest data, apply volatility and session adjustments instead
        console.log('Applying volatility and session-based adjustments');

        // Combine volatility and session adjustments with weighted blending
        const combinedStopLossAdjustment =
            (volatilityAdjustments.stopLoss * 0.6) + (sessionAdjustments.stopLoss * 0.4);
        const combinedTargetAdjustment =
            (volatilityAdjustments.target * 0.6) + (sessionAdjustments.target * 0.4);
        const combinedTrailingStopAdjustment =
            (volatilityAdjustments.trailingStop * 0.6) + (sessionAdjustments.trailingStop * 0.4);

        // Apply combined adjustments
        adjustedParameters.flazhParameters.stopLoss = Math.round(
            adjustedParameters.flazhParameters.stopLoss * combinedStopLossAdjustment
        );
        adjustedParameters.flazhParameters.targetProfit = Math.round(
            adjustedParameters.flazhParameters.targetProfit * combinedTargetAdjustment
        );
        adjustedParameters.flazhParameters.trailingStop = Math.round(
            adjustedParameters.flazhParameters.trailingStop * combinedTrailingStopAdjustment
        );

        adjustedParameters.atmParameters.stopLoss = Math.round(
            adjustedParameters.atmParameters.stopLoss * combinedStopLossAdjustment
        );
        adjustedParameters.atmParameters.target1 = Math.round(
            adjustedParameters.atmParameters.target1 * combinedTargetAdjustment
        );
        adjustedParameters.atmParameters.target2 = Math.round(
            adjustedParameters.atmParameters.target2 * combinedTargetAdjustment
        );
    }

    // As a final step, apply news-based adjustments with lower priority
    if (newsImpact.confidence !== 'low') {
        console.log('Applying additional news-based adjustments');

        // Apply smaller news-based adjustments on top of other adjustments
        const newsVolatilityImpact = newsImpact.volatilityImpact;

        if (newsVolatilityImpact > 0.5) {
            // High news volatility impact
            adjustedParameters.flazhParameters.stopLoss = Math.round(
                adjustedParameters.flazhParameters.stopLoss * 1.1
            );
            adjustedParameters.atmParameters.stopLoss = Math.round(
                adjustedParameters.atmParameters.stopLoss * 1.1
            );
        }

        // Adjust for trend bias based on news sentiment
        if (newsImpact.sentiment === 'positive' && newsImpact.trendImpact > 0.5) {
            // For bullish sentiment, slightly increase targets
            adjustedParameters.flazhParameters.targetProfit = Math.round(
                adjustedParameters.flazhParameters.targetProfit * 1.05
            );
            adjustedParameters.atmParameters.target2 = Math.round(
                adjustedParameters.atmParameters.target2 * 1.05
            );
        } else if (newsImpact.sentiment === 'negative' && newsImpact.trendImpact < -0.5) {
            // For bearish sentiment, slightly increase targets (for short trades)
            adjustedParameters.flazhParameters.targetProfit = Math.round(
                adjustedParameters.flazhParameters.targetProfit * 1.05
            );
            adjustedParameters.atmParameters.target2 = Math.round(
                adjustedParameters.atmParameters.target2 * 1.05
            );
        }
    }

    // Enforce reasonable limits on parameter values
    adjustedParameters.flazhParameters.stopLoss = enforceParameterLimits(
        adjustedParameters.flazhParameters.stopLoss, parameters.flazhParameters.stopLoss, 0.7, 1.5
    );

    adjustedParameters.flazhParameters.targetProfit = enforceParameterLimits(
        adjustedParameters.flazhParameters.targetProfit, parameters.flazhParameters.targetProfit, 0.7, 1.5
    );

    adjustedParameters.atmParameters.stopLoss = enforceParameterLimits(
        adjustedParameters.atmParameters.stopLoss, parameters.atmParameters.stopLoss, 0.7, 1.5
    );

    adjustedParameters.atmParameters.target1 = enforceParameterLimits(
        adjustedParameters.atmParameters.target1, parameters.atmParameters.target1, 0.7, 1.5
    );

    adjustedParameters.atmParameters.target2 = enforceParameterLimits(
        adjustedParameters.atmParameters.target2, parameters.atmParameters.target2, 0.7, 1.5
    );

    return adjustedParameters;
}

/**
 * Enforce reasonable limits on parameter adjustments
 * @param {Number} value - Adjusted parameter value
 * @param {Number} originalValue - Original parameter value
 * @param {Number} minMultiplier - Minimum allowed multiplier
 * @param {Number} maxMultiplier - Maximum allowed multiplier
 * @returns {Number} - Value within acceptable limits
 */
function enforceParameterLimits(value, originalValue, minMultiplier, maxMultiplier) {
    const minValue = Math.round(originalValue * minMultiplier);
    const maxValue = Math.round(originalValue * maxMultiplier);

    return Math.max(minValue, Math.min(value, maxValue));
}

/**
 * Calculate final confidence level for recommendations
 * @param {String} parameterConfidence - Confidence from parameter optimization
 * @param {String} newsConfidence - Confidence from news analysis
 * @param {String} backtestConfidence - Confidence from backtest analysis
 * @returns {String} - Final confidence level
 */
function calculateFinalConfidence(parameterConfidence, newsConfidence, backtestConfidence) {
    // Convert confidence levels to numeric values
    const confidenceValues = {
        'high': 3,
        'medium': 2,
        'low': 1
    };

    // Calculate weighted average confidence with backtest results weighted highest
    let confidenceScore = (
        confidenceValues[parameterConfidence] * 0.3 +
        confidenceValues[newsConfidence] * 0.2 +
        confidenceValues[backtestConfidence] * 0.5
    );

    // Convert back to text level
    if (confidenceScore >= 2.5) {
        return 'high';
    } else if (confidenceScore >= 1.7) {
        return 'medium';
    } else {
        return 'low';
    }
}

/**
 * Format relevant news for inclusion in recommendations
 * @param {Array} news - All market news items
 * @param {Object} newsImpact - News impact analysis
 * @returns {Array} - Formatted relevant news
 */
function formatRelevantNews(news, newsImpact) {
    // [This function remains the same as before]
    if (!news || news.length === 0) {
        return [];
    }

    // Get relevant news based on indices from news impact analysis
    const relevantNews = newsImpact.relevantNewsIndices.map(index => {
        const item = news[index];
        if (!item) return null;

        return {
            title: item.title || 'No title',
            summary: item.summary || item.title || 'No summary',
            sentiment: item.sentiment || 'neutral',
            source: item.source || 'Unknown',
            url: item.url || '#',
            publishedAt: item.publishedAt || new Date()
        };
    }).filter(item => item !== null);

    // Sort by relevance or recency
    return relevantNews.sort((a, b) => {
        return new Date(b.publishedAt) - new Date(a.publishedAt);
    }).slice(0, 3); // Return top 3 news items
}

module.exports = {
    generateRecommendations
};
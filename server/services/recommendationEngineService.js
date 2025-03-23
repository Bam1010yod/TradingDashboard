/**
 * Enhanced Recommendation Engine Service
 * This service integrates improved backtesting analysis with market data and news
 * to provide more accurate template recommendations
 */

const marketDataService = require('./marketDataService');
const marketNewsService = require('./marketNewsService');
const parameterOptimizationService = require('./parameterOptimizationService');
const backtestingResultsService = require('./backtestingResultsService');
const tradingSessionService = require('./tradingSessionService');

/**
 * Generate comprehensive template recommendations based on available data
 * with enhanced backtesting analysis
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

        // 4. Get enhanced backtesting performance metrics for these market conditions
        const backtestMetrics = await backtestingResultsService.getPerformanceMetrics(
            timeOfDay,
            sessionType,
            marketData.volatilityScore || 5
        );
        console.log('Retrieved enhanced backtesting performance metrics');

        // 5. Get performance trends to help identify patterns over time
        const performanceTrends = await backtestingResultsService.getPerformanceTrends(
            timeOfDay,
            sessionType
        );
        console.log('Retrieved performance trend data');

        // 6. Get volatility-based adjustments (fallback if insufficient backtest data)
        const volatilityAdjustments = backtestingResultsService.getVolatilityAdjustments(
            marketData.volatilityScore || 5
        );
        console.log('Generated volatility-based adjustments');

        // 7. Get session-based adjustments (fallback if insufficient backtest data)
        const sessionAdjustments = backtestingResultsService.getSessionAdjustments(timeOfDay);
        console.log('Generated session-based adjustments');

        // 8. Analyze market news sentiment for potential adjustments
        const newsImpact = analyzeNewsImpact(marketNews, marketData.symbol);
        console.log('Analyzed news impact');

        // 9. Apply all adjustments to create final parameters with greater weight
        // to backtesting results when available
        const adjustedParameters = applyAllAdjustments(
            optimizedParameters,
            newsImpact,
            backtestMetrics,
            volatilityAdjustments,
            sessionAdjustments,
            performanceTrends
        );
        console.log('Applied all adjustments to parameters');

        // 10. Generate final recommendation with enhanced context
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
                successfulSamples: backtestMetrics.successfulSamples || 0,
                winRate: backtestMetrics.winRate || 0,
                profitFactor: backtestMetrics.profitFactor || 0,
                averageRR: backtestMetrics.averageRR || 0,
                similarityScore: backtestMetrics.averageSimilarity || 0
            },
            performanceTrends: performanceTrends.success ? performanceTrends.trends : [],
            relevantNews: formatRelevantNews(marketNews, newsImpact),
            adjustmentFactors: {
                stopLoss: backtestMetrics.adjustmentFactors?.stopLossAdjustment || 1,
                target: backtestMetrics.adjustmentFactors?.targetAdjustment || 1,
                trailingStop: backtestMetrics.adjustmentFactors?.trailingStopAdjustment || 1
            },
            generatedAt: new Date().toISOString()
        };

        console.log('Enhanced recommendation generation completed');
        return recommendation;
    } catch (error) {
        console.error('Error generating enhanced recommendations:', error);
        throw new Error('Failed to generate template recommendations');
    }
}

/**
 * Apply all adjustments to create final parameters with improved weighting logic
 * @param {Object} parameters - Optimized parameters
 * @param {Object} newsImpact - News impact analysis
 * @param {Object} backtestMetrics - Backtesting performance metrics
 * @param {Object} volatilityAdjustments - Volatility-based adjustments
 * @param {Object} sessionAdjustments - Session-based adjustments
 * @param {Object} performanceTrends - Performance trends over time
 * @returns {Object} - Adjusted parameters
 */
function applyAllAdjustments(
    parameters,
    newsImpact,
    backtestMetrics,
    volatilityAdjustments,
    sessionAdjustments,
    performanceTrends
) {
    // Create a deep copy of parameters to avoid modifying the original
    const adjustedParameters = {
        flazhParameters: { ...parameters.flazhParameters },
        atmParameters: { ...parameters.atmParameters },
        confidence: parameters.confidence,
        marketConditionsSummary: parameters.marketConditionsSummary
    };

    // ENHANCED LOGIC: Dynamic weighting based on data quality
    let backtestWeight = 0.7;  // Default high weight for backtest data
    let volatilityWeight = 0.15;
    let sessionWeight = 0.15;

    // Adjust weights based on backtest confidence
    if (backtestMetrics.confidenceLevel === 'low') {
        backtestWeight = 0.3;
        volatilityWeight = 0.4;
        sessionWeight = 0.3;
    } else if (backtestMetrics.confidenceLevel === 'medium') {
        backtestWeight = 0.5;
        volatilityWeight = 0.3;
        sessionWeight = 0.2;
    }

    // ENHANCED LOGIC: Apply performance trend adjustments if available
    if (performanceTrends.success && performanceTrends.trends && performanceTrends.trends.length > 0) {
        // Check if there's a clear trend in profit factor
        const trendAdjustment = analyzeTrends(performanceTrends.trends);

        if (trendAdjustment !== 1) {
            console.log(`Applying trend-based adjustment factor: ${trendAdjustment}`);
            // Apply slight adjustment based on trend direction
            adjustedParameters.flazhParameters.targetProfit = Math.round(
                adjustedParameters.flazhParameters.targetProfit * (trendAdjustment * 0.2 + 0.8)
            );
            adjustedParameters.atmParameters.target1 = Math.round(
                adjustedParameters.atmParameters.target1 * (trendAdjustment * 0.2 + 0.8)
            );
            adjustedParameters.atmParameters.target2 = Math.round(
                adjustedParameters.atmParameters.target2 * (trendAdjustment * 0.2 + 0.8)
            );
        }
    }

    // Apply backtest-based adjustments with highest priority
    if (backtestMetrics.success && backtestMetrics.sampleSize > 0) {
        console.log(`Applying backtest adjustments with weight: ${backtestWeight}`);

        // ENHANCED LOGIC: Use weighted blending instead of direct replacement
        const backtestStopLossAdjustment = backtestMetrics.adjustmentFactors.stopLossAdjustment || 1;
        const backtestTargetAdjustment = backtestMetrics.adjustmentFactors.targetAdjustment || 1;
        const backtestTrailingStopAdjustment = backtestMetrics.adjustmentFactors.trailingStopAdjustment || 1;

        // Calculate blended volatility and session adjustments
        const blendedVolSession = {
            stopLoss: (volatilityAdjustments.stopLoss * volatilityWeight) +
                (sessionAdjustments.stopLoss * sessionWeight),
            target: (volatilityAdjustments.target * volatilityWeight) +
                (sessionAdjustments.target * sessionWeight),
            trailingStop: (volatilityAdjustments.trailingStop * volatilityWeight) +
                (sessionAdjustments.trailingStop * sessionWeight)
        };

        // Apply weighted adjustments (backtest + volatility/session blend)
        const finalStopLossAdjustment = (backtestStopLossAdjustment * backtestWeight) +
            (blendedVolSession.stopLoss * (1 - backtestWeight));

        const finalTargetAdjustment = (backtestTargetAdjustment * backtestWeight) +
            (blendedVolSession.target * (1 - backtestWeight));

        const finalTrailingStopAdjustment = (backtestTrailingStopAdjustment * backtestWeight) +
            (blendedVolSession.trailingStop * (1 - backtestWeight));

        // Apply the final blended adjustments
        adjustedParameters.flazhParameters.stopLoss = Math.round(
            adjustedParameters.flazhParameters.stopLoss * finalStopLossAdjustment
        );
        adjustedParameters.flazhParameters.targetProfit = Math.round(
            adjustedParameters.flazhParameters.targetProfit * finalTargetAdjustment
        );
        adjustedParameters.flazhParameters.trailingStop = Math.round(
            adjustedParameters.flazhParameters.trailingStop * finalTrailingStopAdjustment
        );

        adjustedParameters.atmParameters.stopLoss = Math.round(
            adjustedParameters.atmParameters.stopLoss * finalStopLossAdjustment
        );
        adjustedParameters.atmParameters.target1 = Math.round(
            adjustedParameters.atmParameters.target1 * finalTargetAdjustment
        );
        adjustedParameters.atmParameters.target2 = Math.round(
            adjustedParameters.atmParameters.target2 * finalTargetAdjustment
        );
    } else {
        // If we don't have good backtest data, apply volatility and session adjustments instead
        console.log('Applying volatility and session-based adjustments (no good backtest data)');

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

        // ENHANCED LOGIC: More nuanced news impact adjustments
        const newsVolatilityImpact = newsImpact.volatilityImpact;
        const newsTrendImpact = Math.abs(newsImpact.trendImpact);

        // Apply scaled adjustments based on news impact strength
        if (newsVolatilityImpact > 0) {
            // Scale factor between 1.0-1.15 based on impact strength
            const volatilityScaleFactor = 1 + (newsVolatilityImpact * 0.15);

            adjustedParameters.flazhParameters.stopLoss = Math.round(
                adjustedParameters.flazhParameters.stopLoss * volatilityScaleFactor
            );
            adjustedParameters.atmParameters.stopLoss = Math.round(
                adjustedParameters.atmParameters.stopLoss * volatilityScaleFactor
            );
        }

        // Adjust for trend bias based on news sentiment with scaled strength
        if (newsImpact.sentiment !== 'neutral' && newsTrendImpact > 0) {
            // Scale factor between 1.0-1.1 based on impact strength
            const trendScaleFactor = 1 + (newsTrendImpact * 0.1);

            adjustedParameters.flazhParameters.targetProfit = Math.round(
                adjustedParameters.flazhParameters.targetProfit * trendScaleFactor
            );
            adjustedParameters.atmParameters.target2 = Math.round(
                adjustedParameters.atmParameters.target2 * trendScaleFactor
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
 * Analyze performance trends to identify patterns
 * @param {Array} trends - Performance trends data
 * @returns {Number} - Trend adjustment factor
 */
function analyzeTrends(trends) {
    if (!trends || trends.length < 2) {
        return 1; // No adjustment if insufficient trend data
    }

    // Sort by period to ensure chronological order
    trends.sort((a, b) => {
        // Extract week number for comparison
        const weekA = parseInt(a.period.replace('Week ', '')) || 0;
        const weekB = parseInt(b.period.replace('Week ', '')) || 0;
        return weekA - weekB;
    });

    // Only consider the most recent weeks (last 3 or all if fewer)
    const recentTrends = trends.slice(-3);

    if (recentTrends.length < 2) {
        return 1; // Need at least 2 periods for trend analysis
    }

    // Calculate trend direction for profit factor (main performance indicator)
    let trendDirection = 0;
    for (let i = 1; i < recentTrends.length; i++) {
        const prevPeriod = recentTrends[i - 1];
        const currPeriod = recentTrends[i];

        // Compare profit factors
        if (currPeriod.avgProfitFactor > prevPeriod.avgProfitFactor * 1.1) {
            // Significant improvement
            trendDirection += 1;
        } else if (currPeriod.avgProfitFactor < prevPeriod.avgProfitFactor * 0.9) {
            // Significant deterioration
            trendDirection -= 1;
        }
    }

    // Calculate adjustment factor based on trend direction
    if (trendDirection >= recentTrends.length - 1) {
        // Strong positive trend - slightly more aggressive
        return 1.1;
    } else if (trendDirection <= -(recentTrends.length - 1)) {
        // Strong negative trend - slightly more conservative
        return 0.9;
    }

    // No clear trend
    return 1;
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
    // This function remains the same as in your original code
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

    // ENHANCED LOGIC: Weighted more heavily toward backtest results
    let confidenceScore = (
        confidenceValues[parameterConfidence] * 0.25 +
        confidenceValues[newsConfidence] * 0.15 +
        confidenceValues[backtestConfidence] * 0.6
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
    // This function remains the same as in your original code
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
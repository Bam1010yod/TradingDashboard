/**
 * Recommendation Engine Service
 * This service integrates market data and news
 * to provide comprehensive template recommendations
 */

const marketDataService = require('./marketDataService');
const marketNewsService = require('./marketNewsService');
const parameterOptimizationService = require('./parameterOptimizationService');
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

        // 4. Analyze market news sentiment for potential adjustments
        const newsImpact = analyzeNewsImpact(marketNews, marketData.symbol);
        console.log('Analyzed news impact');

        // 5. Apply adjustments based on news sentiment if needed
        const adjustedParameters = adjustParametersBasedOnNews(optimizedParameters, newsImpact);
        console.log('Applied news-based adjustments');

        // 6. Generate final recommendation
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
                    newsImpact.confidence
                )
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
 * Adjust parameters based on news impact
 * @param {Object} parameters - Optimized parameters
 * @param {Object} newsImpact - News impact analysis
 * @returns {Object} - Adjusted parameters
 */
function adjustParametersBasedOnNews(parameters, newsImpact) {
    // Create a deep copy of parameters to avoid modifying the original
    const adjustedParameters = {
        flazhParameters: { ...parameters.flazhParameters },
        atmParameters: { ...parameters.atmParameters },
        confidence: parameters.confidence,
        marketConditionsSummary: parameters.marketConditionsSummary
    };

    // If news impact confidence is low, don't make adjustments
    if (newsImpact.confidence === 'low') {
        return adjustedParameters;
    }

    // Adjust for increased volatility expectation
    if (newsImpact.volatilityImpact > 0.5) {
        console.log('Adjusting for high volatility based on news');

        // Widen stops and targets for high volatility
        adjustedParameters.flazhParameters.stopLoss = Math.round(adjustedParameters.flazhParameters.stopLoss * 1.2);
        adjustedParameters.flazhParameters.targetProfit = Math.round(adjustedParameters.flazhParameters.targetProfit * 1.2);
        adjustedParameters.flazhParameters.trailingStop = Math.round(adjustedParameters.flazhParameters.trailingStop * 1.2);

        adjustedParameters.atmParameters.stopLoss = Math.round(adjustedParameters.atmParameters.stopLoss * 1.2);
        adjustedParameters.atmParameters.target1 = Math.round(adjustedParameters.atmParameters.target1 * 1.2);
        adjustedParameters.atmParameters.target2 = Math.round(adjustedParameters.atmParameters.target2 * 1.2);
    } else if (newsImpact.volatilityImpact > 0.2) {
        console.log('Adjusting for moderate volatility based on news');

        // Slightly widen stops and targets for moderate volatility
        adjustedParameters.flazhParameters.stopLoss = Math.round(adjustedParameters.flazhParameters.stopLoss * 1.1);
        adjustedParameters.flazhParameters.targetProfit = Math.round(adjustedParameters.flazhParameters.targetProfit * 1.1);

        adjustedParameters.atmParameters.stopLoss = Math.round(adjustedParameters.atmParameters.stopLoss * 1.1);
        adjustedParameters.atmParameters.target1 = Math.round(adjustedParameters.atmParameters.target1 * 1.1);
    }

    // Adjust for trend bias based on news sentiment
    if (newsImpact.sentiment === 'positive' && newsImpact.trendImpact > 0.5) {
        console.log('Adjusting for bullish bias based on news');

        // Increase target profit for long trades in bullish sentiment
        adjustedParameters.flazhParameters.targetProfit = Math.round(adjustedParameters.flazhParameters.targetProfit * 1.15);
        adjustedParameters.atmParameters.target2 = Math.round(adjustedParameters.atmParameters.target2 * 1.15);

    } else if (newsImpact.sentiment === 'negative' && newsImpact.trendImpact < -0.5) {
        console.log('Adjusting for bearish bias based on news');

        // Increase target profit for short trades in bearish sentiment
        adjustedParameters.flazhParameters.targetProfit = Math.round(adjustedParameters.flazhParameters.targetProfit * 1.15);
        adjustedParameters.atmParameters.target2 = Math.round(adjustedParameters.atmParameters.target2 * 1.15);
    }

    return adjustedParameters;
}

/**
 * Calculate final confidence level for recommendations
 * @param {String} parameterConfidence - Confidence from parameter optimization
 * @param {String} newsConfidence - Confidence from news analysis
 * @returns {String} - Final confidence level
 */
function calculateFinalConfidence(parameterConfidence, newsConfidence) {
    // Convert confidence levels to numeric values
    const confidenceValues = {
        'high': 3,
        'medium': 2,
        'low': 1
    };

    // Calculate weighted average confidence
    let confidenceScore = (
        confidenceValues[parameterConfidence] * 0.7 +
        confidenceValues[newsConfidence] * 0.3
    );

    // Convert back to text level
    if (confidenceScore >= 2.5) {
        return 'high';
    } else if (confidenceScore >= 1.5) {
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
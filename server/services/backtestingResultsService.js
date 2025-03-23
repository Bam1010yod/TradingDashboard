/**
 * Determine the current market regime based on market conditions
 * @param {Object} marketConditions - Current market conditions
 * @returns {Object} - Market regime details
 */
function determineMarketRegime(marketConditions) {
    // Default regime (balanced)
    const regime = {
        type: 'balanced',
        description: 'Normal market conditions',
        metricWeights: {
            volatilityScore: 0.25,
            atr: 0.20,
            volume: 0.15,
            trend: 0.15,
            overnightRange: 0.10,
            priceRange: 0.10,
            dailyVolatility: 0.05
        }
    };

    // Check for trend-following regime (strong directional move)
    if (
        marketConditions.trend &&
        (marketConditions.trend.includes('strong') ||
            marketConditions.volatilityScore > 7)
    ) {
        regime.type = 'trend_following';
        regime.description = 'Strong directional market';
        // Prioritize trend and volatility metrics
        regime.metricWeights = {
            trend: 0.30,
            volatilityScore: 0.25,
            atr: 0.15,
            volume: 0.10,
            priceRange: 0.10,
            overnightRange: 0.05,
            dailyVolatility: 0.05
        };
    }
    // Check for mean-reversion regime (high volatility, choppy market)
    else if (
        marketConditions.volatilityScore > 5 &&
        (!marketConditions.trend || marketConditions.trend.includes('neutral'))
    ) {
        regime.type = 'mean_reverting';
        regime.description = 'Choppy, volatile market';
        // Prioritize volatility and range metrics
        regime.metricWeights = {
            volatilityScore: 0.30,
            priceRange: 0.20,
            atr: 0.20,
            volume: 0.15,
            trend: 0.05,
            overnightRange: 0.05,
            dailyVolatility: 0.05
        };
    }
    // Check for range-bound regime (low volatility)
    else if (marketConditions.volatilityScore < 4) {
        regime.type = 'range_bound';
        regime.description = 'Low volatility, range-bound market';
        // Prioritize price range and volume metrics
        regime.metricWeights = {
            priceRange: 0.25,
            atr: 0.20,
            volatilityScore: 0.15,
            volume: 0.15,
            overnightRange: 0.15,
            trend: 0.05,
            dailyVolatility: 0.05
        };
    }

    return regime;
}
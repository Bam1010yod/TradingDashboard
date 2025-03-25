// Full path: C:\TradingDashboard\server\routes\marketConditions.js

const express = require('express');
const router = express.Router();
const marketConditionsService = require('../services/marketConditionsService');
const logger = require('../utils/logger');

/**
 * @route GET /api/market-conditions
 * @description Get current market conditions and parameter recommendations
 * @access Public
 */
router.get('/', (req, res) => {
    try {
        // Get timezone from query parameter or use default
        const timezone = req.query.timezone || 'US_CENTRAL';

        logger.info(`Getting market conditions for timezone: ${timezone}`);
        const marketConditions = marketConditionsService.getCurrentMarketConditions(timezone);

        return res.json(marketConditions);
    } catch (error) {
        logger.error(`Error getting market conditions: ${error.message}`);
        return res.status(500).json({
            error: 'Failed to retrieve market conditions',
            message: error.message
        });
    }
});

/**
 * @route GET /api/market-conditions/parameters/:session/:volatility
 * @description Get parameter recommendations for specific market conditions
 * @access Public
 */
router.get('/parameters/:session/:volatility', (req, res) => {
    try {
        const { session, volatility } = req.params;

        logger.info(`Getting parameters for session: ${session}, volatility: ${volatility}`);
        const recommendations = marketConditionsService.getRecommendedParameters(session, volatility);

        return res.json(recommendations);
    } catch (error) {
        logger.error(`Error getting parameters: ${error.message}`);
        return res.status(500).json({
            error: 'Failed to retrieve parameters',
            message: error.message
        });
    }
});

/**
 * @route GET /api/market-conditions/sessions
 * @description Get list of available trading sessions
 * @access Public
 */
router.get('/sessions', (req, res) => {
    try {
        // List of available trading sessions
        const sessions = [
            { id: 'US_OPEN', name: 'US Opening' },
            { id: 'US_MIDDAY', name: 'US Midday' },
            { id: 'US_AFTERNOON', name: 'US Afternoon' },
            { id: 'OVERNIGHT', name: 'Overnight' },
            { id: 'ASIA', name: 'Asian Session' },
            { id: 'EUROPE', name: 'European Session' }
        ];

        return res.json(sessions);
    } catch (error) {
        logger.error(`Error getting sessions: ${error.message}`);
        return res.status(500).json({
            error: 'Failed to retrieve sessions',
            message: error.message
        });
    }
});

/**
 * @route GET /api/market-conditions/volatilities
 * @description Get list of available volatility categories
 * @access Public
 */
router.get('/volatilities', (req, res) => {
    try {
        // List of available volatility categories
        const volatilities = [
            { id: 'HIGH_VOLATILITY', name: 'High Volatility' },
            { id: 'MEDIUM_VOLATILITY', name: 'Medium Volatility' },
            { id: 'LOW_VOLATILITY', name: 'Low Volatility' }
        ];

        return res.json(volatilities);
    } catch (error) {
        logger.error(`Error getting volatilities: ${error.message}`);
        return res.status(500).json({
            error: 'Failed to retrieve volatilities',
            message: error.message
        });
    }
});

module.exports = router;
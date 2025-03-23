// Full path: C:\TradingDashboard\server\routes\marketConditions.js

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const marketConditionsService = require('../services/marketConditionsService');

/**
 * @route GET /api/market-conditions
 * @description Get current market conditions and recommendations
 * @access Public
 */
router.get('/', async (req, res) => {
    try {
        const conditions = await marketConditionsService.getCurrentConditions();
        res.json(conditions);
    } catch (error) {
        logger.error(`Error getting market conditions: ${error.message}`);
        res.status(500).json({
            success: false,
            message: `Error getting market conditions: ${error.message}`
        });
    }
});

/**
 * @route GET /api/market-conditions/current
 * @description Get simplified current market conditions
 * @access Public
 */
router.get('/current', async (req, res) => {
    try {
        const conditions = await marketConditionsService.getCurrentConditions();
        res.json({
            success: true,
            session: conditions.currentSession,
            volatility: conditions.volatilityCategory,
            timestamp: conditions.currentTime
        });
    } catch (error) {
        logger.error(`Error getting current market conditions: ${error.message}`);
        res.status(500).json({
            success: false,
            message: `Error getting current market conditions: ${error.message}`
        });
    }
});

/**
 * @route GET /api/market-conditions/parameters/:session/:volatility
 * @description Get parameters for specific session and volatility
 * @access Public
 */
router.get('/parameters/:session/:volatility', async (req, res) => {
    try {
        const { session, volatility } = req.params;
        logger.info(`Getting parameters for session: ${session}, volatility: ${volatility}`);

        const parameters = await marketConditionsService.getParametersForConditions(session, volatility);

        res.json(parameters);
    } catch (error) {
        logger.error(`Error loading parameters for selected session and volatility: ${error.message}`);
        res.status(500).json({
            success: false,
            message: `Error loading parameters for selected session and volatility: ${error.message}`
        });
    }
});

module.exports = router;
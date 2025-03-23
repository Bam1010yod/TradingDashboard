// Full path: C:\TradingDashboard\server\routes\ninjaTraderIntegration.js

const express = require('express');
const router = express.Router();
const ninjaTraderIntegrationService = require('../services/ninjaTraderIntegrationService');
const logger = require('../utils/logger');

/**
 * @route POST /api/ninja-trader/apply-settings
 * @description Apply selected trading parameters to NinjaTrader
 * @access Public
 */
router.post('/apply-settings', async (req, res) => {
    try {
        const { flazhParameters, atmParameters } = req.body;

        logger.info('Received request to apply settings to NinjaTrader');
        logger.debug(`Flazh parameters: ${JSON.stringify(flazhParameters)}`);
        logger.debug(`ATM parameters: ${JSON.stringify(atmParameters)}`);

        // Apply both parameter sets
        const flazhResult = await ninjaTraderIntegrationService.applyFlazhParameters(flazhParameters);
        const atmResult = await ninjaTraderIntegrationService.applyAtmParameters(atmParameters);

        if (flazhResult && atmResult) {
            logger.info('Successfully applied settings to NinjaTrader');
            return res.status(200).json({
                success: true,
                message: 'Settings successfully applied to NinjaTrader'
            });
        } else {
            logger.warn('Failed to apply some settings to NinjaTrader');
            return res.status(500).json({
                success: false,
                message: 'Failed to apply some settings to NinjaTrader'
            });
        }
    } catch (error) {
        logger.error(`Error applying settings to NinjaTrader: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: `Error applying settings: ${error.message}`
        });
    }
});

module.exports = router;
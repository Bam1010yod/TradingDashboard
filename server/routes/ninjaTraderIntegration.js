// Full path: C:\TradingDashboard\server\routes\ninjaTraderIntegration.js

const express = require('express');
const router = express.Router();
const ninjaTraderIntegrationService = require('../services/ninjaTraderIntegrationService');
const logger = require('../utils/logger');

/**
 * @route POST /api/ninja-trader/apply-settings
 * @description Apply selected trading parameters to NinjaTrader by creating standardized template files
 * @access Public
 */
router.post('/apply-settings', async (req, res) => {
    try {
        const { flazhParameters, atmParameters } = req.body;

        logger.info('Received request to apply settings to NinjaTrader');
        logger.debug(`Flazh parameters context: ${JSON.stringify(flazhParameters)}`);
        logger.debug(`ATM parameters context: ${JSON.stringify(atmParameters)}`);

        // Apply both parameter sets by creating standardized templates
        const flazhResult = await ninjaTraderIntegrationService.applyFlazhParameters(flazhParameters);
        const atmResult = await ninjaTraderIntegrationService.applyAtmParameters(atmParameters);

        if (flazhResult.success && atmResult.success) {
            logger.info('Successfully created standardized template files');

            // Provide clear instructions for manual loading
            const instructions = `
To apply these settings in NinjaTrader:

1. For Flazh Infinity:
   - Click "template" at the bottom right of the Flazh properties
   - Click "Load" in the dialog that appears
   - Select "${flazhResult.standardizedName}" from the list
   - Click "Load" to apply the template

2. For ATM Strategy:
   - Click the ATM dropdown in the Flazh control panel
   - Select "${atmResult.standardizedName}" from the list
`;

            return res.status(200).json({
                success: true,
                message: 'Successfully created template files for NinjaTrader',
                flazhTemplate: flazhResult.templateName,
                atmTemplate: atmResult.templateName,
                standardizedFlazhTemplate: flazhResult.standardizedName,
                standardizedAtmTemplate: atmResult.standardizedName,
                instructions: instructions
            });
        } else {
            const errorMessages = [];
            if (!flazhResult.success) {
                errorMessages.push(`Flazh: ${flazhResult.message}`);
            }
            if (!atmResult.success) {
                errorMessages.push(`ATM: ${atmResult.message}`);
            }

            logger.warn(`Failed to create some template files: ${errorMessages.join(', ')}`);
            return res.status(500).json({
                success: false,
                message: `Failed to create some template files: ${errorMessages.join(', ')}`,
                flazhResult,
                atmResult
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

/**
 * @route GET /api/ninja-trader/templates
 * @description Get available NinjaTrader templates and status of standardized templates
 * @access Public
 */
router.get('/templates', async (req, res) => {
    try {
        const status = await ninjaTraderIntegrationService.getTemplateDirectoryStatus();
        return res.status(200).json(status);
    } catch (error) {
        logger.error(`Error getting templates: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: `Error getting templates: ${error.message}`
        });
    }
});

module.exports = router;
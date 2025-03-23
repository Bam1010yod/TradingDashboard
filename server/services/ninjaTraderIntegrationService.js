// Full path: C:\TradingDashboard\server\services\ninjaTraderIntegrationService.js

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// NinjaTrader template directories
const NT_USER_DIR = process.env.NT_USER_DIR || 'C:\\Users\\bridg\\Documents\\NinjaTrader 8';
const ATM_TEMPLATE_DIR = path.join(NT_USER_DIR, 'templates', 'ATM');
const FLAZH_TEMPLATE_DIR = path.join(NT_USER_DIR, 'templates', 'Indicator', 'RenkoKings_FlazhInfinity');

/**
 * Service for integrating with NinjaTrader platform
 */
class NinjaTraderIntegrationService {
    constructor() {
        // Ensure the NinjaTrader template directories exist
        this.ensureDirectoryExists(ATM_TEMPLATE_DIR);
        this.ensureDirectoryExists(FLAZH_TEMPLATE_DIR);
    }

    /**
     * Ensure a directory exists, creating it if necessary
     * @param {string} dirPath - Directory path to check/create
     */
    ensureDirectoryExists(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                logger.info(`Created directory: ${dirPath}`);
            }
        } catch (error) {
            logger.error(`Failed to create directory ${dirPath}: ${error.message}`);
        }
    }

    /**
     * Apply Flazh Infinity parameters to NinjaTrader
     * @param {Object} params - Flazh parameters to apply
     * @returns {Promise<boolean>} - Success status
     */
    async applyFlazhParameters(params) {
        try {
            // Create a template name based on session and volatility
            const templateName = `Flazh_${params.session}_${params.volatility}`;
            const sanitizedName = templateName.replace(/\s+/g, '_');

            // Create a temporary XML structure for the Flazh template
            // This is a simplified version and may need to be adjusted based on actual template format
            const templateXml = `<?xml version="1.0" encoding="UTF-8"?>
<NinjaTrader>
  <Strategy name="${sanitizedName}">
    <Parameters>
      <Parameter name="FastPeriod" value="${params.FastPeriod}"/>
      <Parameter name="FastRange" value="${params.FastRange}"/>
      <Parameter name="MediumPeriod" value="${params.MediumPeriod}"/>
      <Parameter name="MediumRange" value="${params.MediumRange}"/>
      <Parameter name="SlowPeriod" value="${params.SlowPeriod}"/>
      <Parameter name="SlowRange" value="${params.SlowRange}"/>
    </Parameters>
  </Strategy>
</NinjaTrader>`;

            // Save the template file
            const filePath = path.join(FLAZH_TEMPLATE_DIR, `${sanitizedName}.xml`);
            await fs.promises.writeFile(filePath, templateXml);

            // Also save as the "Active" template that NinjaTrader will load automatically
            const activeFilePath = path.join(FLAZH_TEMPLATE_DIR, 'Active.xml');
            await fs.promises.writeFile(activeFilePath, templateXml);

            logger.info(`Flazh parameters written to ${filePath}`);
            return true;
        } catch (error) {
            logger.error(`Failed to apply Flazh parameters: ${error.message}`);
            return false;
        }
    }

    /**
     * Apply ATM Strategy parameters to NinjaTrader
     * @param {Object} params - ATM parameters to apply
     * @returns {Promise<boolean>} - Success status
     */
    async applyAtmParameters(params) {
        try {
            // Create a template name based on session and volatility
            const templateName = `ATM_${params.session}_${params.volatility}`;
            const sanitizedName = templateName.replace(/\s+/g, '_');

            // Create a temporary XML structure for the ATM template
            // This is a simplified version and may need to be adjusted based on actual template format
            const templateXml = `<?xml version="1.0" encoding="UTF-8"?>
<NinjaTrader>
  <ATMStrategy name="${sanitizedName}">
    <Parameters>
      <Parameter name="StopLoss" value="${params.StopLoss}"/>
      <Parameter name="Target" value="${params.Target}"/>
      <Parameter name="AutoBreakEvenProfitTrigger" value="${params.AutoBreakEvenProfitTrigger}"/>
      <Parameter name="AutoBreakEvenPlus" value="${params.AutoBreakEvenPlus}"/>
    </Parameters>
  </ATMStrategy>
</NinjaTrader>`;

            // Save the template file
            const filePath = path.join(ATM_TEMPLATE_DIR, `${sanitizedName}.xml`);
            await fs.promises.writeFile(filePath, templateXml);

            // Also save as the "Active" template that NinjaTrader will load automatically
            const activeFilePath = path.join(ATM_TEMPLATE_DIR, 'Active.xml');
            await fs.promises.writeFile(activeFilePath, templateXml);

            logger.info(`ATM parameters written to ${filePath}`);
            return true;
        } catch (error) {
            logger.error(`Failed to apply ATM parameters: ${error.message}`);
            return false;
        }
    }
}

module.exports = new NinjaTraderIntegrationService();
// Full path: C:\TradingDashboard\server\services\ninjaTraderIntegrationService.js

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// NinjaTrader template directories - CORRECTED PATHS based on test results
const NT_USER_DIR = process.env.NT_USER_DIR || 'C:\\Users\\bridg\\Documents\\NinjaTrader 8';
const ATM_TEMPLATE_DIR = path.join(NT_USER_DIR, 'templates', 'ATM');
const FLAZH_TEMPLATE_DIR = path.join(NT_USER_DIR, 'templates', 'Indicator', 'RenkoKings_FlazhInfinity');

// Standardized template names
const CURRENT_ATM_FILENAME = 'TradingDashboard_Current_ATM.xml';
const CURRENT_FLAZH_FILENAME = 'TradingDashboard_Current_Flazh.xml';

/**
 * Service for integrating with NinjaTrader platform
 */
class NinjaTraderIntegrationService {
    constructor() {
        // Ensure the template directories exist
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
     * Get available Flazh Infinity templates
     * @returns {Array} - List of available templates
     */
    getAvailableFlazhTemplates() {
        try {
            if (!fs.existsSync(FLAZH_TEMPLATE_DIR)) {
                logger.warn(`Flazh template directory not found: ${FLAZH_TEMPLATE_DIR}`);
                return [];
            }

            const files = fs.readdirSync(FLAZH_TEMPLATE_DIR)
                .filter(file => file.endsWith('.xml'));

            return files.map(file => ({
                name: path.basename(file, '.xml'),
                path: path.join(FLAZH_TEMPLATE_DIR, file)
            }));
        } catch (error) {
            logger.error(`Failed to get Flazh templates: ${error.message}`);
            return [];
        }
    }

    /**
     * Get available ATM templates
     * @returns {Array} - List of available templates
     */
    getAvailableAtmTemplates() {
        try {
            if (!fs.existsSync(ATM_TEMPLATE_DIR)) {
                logger.warn(`ATM template directory not found: ${ATM_TEMPLATE_DIR}`);
                return [];
            }

            const files = fs.readdirSync(ATM_TEMPLATE_DIR)
                .filter(file => file.endsWith('.xml'));

            return files.map(file => ({
                name: path.basename(file, '.xml'),
                path: path.join(ATM_TEMPLATE_DIR, file)
            }));
        } catch (error) {
            logger.error(`Failed to get ATM templates: ${error.message}`);
            return [];
        }
    }

    /**
     * Find the best matching template for session and volatility
     * @param {Array} templates - Available templates
     * @param {string} session - Desired session
     * @param {string} volatility - Desired volatility
     * @returns {Object|null} - Best matching template or null if none found
     */
    findBestMatchingTemplate(templates, session, volatility) {
        if (!templates || templates.length === 0) {
            return null;
        }

        // Convert session and volatility to more searchable formats
        const sessionUpperCase = session.toUpperCase();
        const volatilityUpperCase = volatility.toUpperCase();

        // Extract key parts for matching
        let sessionKey = sessionUpperCase;
        let volatilityKey = '';

        // Extract volatility level from volatility string (HIGH, MEDIUM, LOW)
        if (volatilityUpperCase.includes('HIGH')) {
            volatilityKey = 'HIGH';
        } else if (volatilityUpperCase.includes('MEDIUM')) {
            volatilityKey = 'MED';
        } else if (volatilityUpperCase.includes('LOW')) {
            volatilityKey = 'LOW';
        }

        // Map session values to potential template keys
        const sessionMappings = {
            'US_OPEN': ['US_OPEN', 'US', 'OPEN', 'EA'], // EA might be "Early America"
            'US_MIDDAY': ['US_MIDDAY', 'US', 'MIDDAY', 'LM'], // LM might be "Late Morning"
            'US_AFTERNOON': ['US_AFTERNOON', 'US', 'AFTERNOON', 'PC'], // PC might be "Post Close"
            'OVERNIGHT': ['OVERNIGHT', 'NIGHT', 'ON'],
            'ASIA': ['ASIA', 'ASIAN'],
            'EUROPE': ['EUROPE', 'EU', 'EUR']
        };

        // Get possible session keys for matching
        const possibleSessionKeys = sessionMappings[sessionUpperCase] || [sessionUpperCase];

        logger.info(`Looking for template matching session: ${sessionUpperCase} (${possibleSessionKeys.join(', ')}) and volatility: ${volatilityUpperCase} (${volatilityKey})`);

        // Try to find exact match with main naming convention (e.g., ATM_ASIA_MEDIUM_VOLATILITY)
        const exactMatch = templates.find(template => {
            const name = template.name.toUpperCase();
            return name.includes(sessionUpperCase) && name.includes(volatilityUpperCase);
        });

        if (exactMatch) {
            logger.info(`Found exact match: ${exactMatch.name}`);
            return exactMatch;
        }

        // Try to find match with abbreviated volatility (e.g., ATM_EA_HIGH)
        const abbreviatedMatch = templates.find(template => {
            const name = template.name.toUpperCase();
            // Check if template contains any of the possible session keys and the volatility key
            return possibleSessionKeys.some(key => name.includes(key)) &&
                name.includes(volatilityKey);
        });

        if (abbreviatedMatch) {
            logger.info(`Found abbreviated match: ${abbreviatedMatch.name}`);
            return abbreviatedMatch;
        }

        // Try to find a match based on session only
        const sessionMatch = templates.find(template => {
            const name = template.name.toUpperCase();
            return possibleSessionKeys.some(key => name.includes(key));
        });

        if (sessionMatch) {
            logger.info(`Found session match: ${sessionMatch.name}`);
            return sessionMatch;
        }

        // Try to find a match based on volatility only
        const volatilityMatch = templates.find(template => {
            const name = template.name.toUpperCase();
            return name.includes(volatilityKey) || name.includes(volatilityUpperCase);
        });

        if (volatilityMatch) {
            logger.info(`Found volatility match: ${volatilityMatch.name}`);
            return volatilityMatch;
        }

        // Return the first template as default
        logger.info(`No specific match found, using default: ${templates[0].name}`);
        return templates[0];
    }

    /**
     * Apply Flazh Infinity parameters by creating a standardized template copy
     * @param {Object} params - Flazh parameters context
     * @returns {Promise<Object>} - Success status and selected template
     */
    async applyFlazhParameters(params) {
        try {
            // Get available templates
            const templates = this.getAvailableFlazhTemplates();

            if (templates.length === 0) {
                logger.warn('No Flazh templates found');
                return { success: false, message: 'No Flazh templates found' };
            }

            // Find the best matching template
            const template = this.findBestMatchingTemplate(
                templates,
                params.session,
                params.volatility
            );

            if (!template) {
                logger.warn('No matching Flazh template found');
                return { success: false, message: 'No matching Flazh template found' };
            }

            logger.info(`Selected Flazh template: ${template.name}`);

            // 1. Create a copy of the template with our standardized name
            try {
                // Read the source template
                const templateContent = fs.readFileSync(template.path, 'utf8');

                // Create a standardized template file name
                const targetPath = path.join(FLAZH_TEMPLATE_DIR, CURRENT_FLAZH_FILENAME);

                // Write the template content to the standardized file
                fs.writeFileSync(targetPath, templateContent);
                logger.info(`Created standardized Flazh template: ${targetPath}`);

                // Return success
                return {
                    success: true,
                    templateName: template.name,
                    standardizedName: CURRENT_FLAZH_FILENAME,
                    message: `Created standardized template: ${CURRENT_FLAZH_FILENAME}. In NinjaTrader, load this template to apply the recommended settings.`
                };
            } catch (error) {
                logger.error(`Failed to create standardized Flazh template: ${error.message}`);
                return { success: false, message: `Failed to create template: ${error.message}` };
            }
        } catch (error) {
            logger.error(`Failed to apply Flazh parameters: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * Apply ATM Strategy parameters by creating a standardized template copy
     * @param {Object} params - ATM parameters context
     * @returns {Promise<Object>} - Success status and selected template
     */
    async applyAtmParameters(params) {
        try {
            // Get available templates
            const templates = this.getAvailableAtmTemplates();

            if (templates.length === 0) {
                logger.warn('No ATM templates found');
                return { success: false, message: 'No ATM templates found' };
            }

            // Find the best matching template
            const template = this.findBestMatchingTemplate(
                templates,
                params.session,
                params.volatility
            );

            if (!template) {
                logger.warn('No matching ATM template found');
                return { success: false, message: 'No matching ATM template found' };
            }

            logger.info(`Selected ATM template: ${template.name}`);

            // 1. Create a copy of the template with our standardized name
            try {
                // Read the source template
                const templateContent = fs.readFileSync(template.path, 'utf8');

                // Create a standardized template file name
                const targetPath = path.join(ATM_TEMPLATE_DIR, CURRENT_ATM_FILENAME);

                // Write the template content to the standardized file
                fs.writeFileSync(targetPath, templateContent);
                logger.info(`Created standardized ATM template: ${targetPath}`);

                // Return success
                return {
                    success: true,
                    templateName: template.name,
                    standardizedName: CURRENT_ATM_FILENAME,
                    message: `Created standardized template: ${CURRENT_ATM_FILENAME}. In NinjaTrader, select this ATM template to apply the recommended settings.`
                };
            } catch (error) {
                logger.error(`Failed to create standardized ATM template: ${error.message}`);
                return { success: false, message: `Failed to create template: ${error.message}` };
            }
        } catch (error) {
            logger.error(`Failed to apply ATM parameters: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    /**
     * Log the state of template directories and list available templates
     * @returns {Promise<Object>} - Directory status information
     */
    async getTemplateDirectoryStatus() {
        try {
            // Check template directories
            const atmExists = fs.existsSync(ATM_TEMPLATE_DIR);
            const flazhExists = fs.existsSync(FLAZH_TEMPLATE_DIR);

            // Get available templates
            const flazhTemplates = this.getAvailableFlazhTemplates();
            const atmTemplates = this.getAvailableAtmTemplates();

            // Check if standardized templates exist
            const standardizedAtmExists = fs.existsSync(path.join(ATM_TEMPLATE_DIR, CURRENT_ATM_FILENAME));
            const standardizedFlazhExists = fs.existsSync(path.join(FLAZH_TEMPLATE_DIR, CURRENT_FLAZH_FILENAME));

            return {
                atm: {
                    directoryExists: atmExists,
                    directoryPath: ATM_TEMPLATE_DIR,
                    templates: atmTemplates.map(t => t.name),
                    standardizedTemplate: {
                        exists: standardizedAtmExists,
                        name: CURRENT_ATM_FILENAME
                    }
                },
                flazh: {
                    directoryExists: flazhExists,
                    directoryPath: FLAZH_TEMPLATE_DIR,
                    templates: flazhTemplates.map(t => t.name),
                    standardizedTemplate: {
                        exists: standardizedFlazhExists,
                        name: CURRENT_FLAZH_FILENAME
                    }
                }
            };
        } catch (error) {
            logger.error(`Failed to get template directory status: ${error.message}`);
            return {
                error: error.message
            };
        }
    }
}

module.exports = new NinjaTraderIntegrationService();
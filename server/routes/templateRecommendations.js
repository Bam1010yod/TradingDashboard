// C:\TradingDashboard\server\routes\templateRecommendations.js
const express = require('express');
const router = express.Router();
const enhancedTemplateSelector = require('../services/enhancedTemplateSelector');
const marketConditionsService = require('../services/marketConditionsService');

/**
 * @route   GET /api/template-recommendations
 * @desc    Get template recommendations based on current market conditions
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        console.log('Getting template recommendations for all templates');

        // Get current market conditions
        const marketConditions = marketConditionsService.analyzeMarketConditions();
        console.log('Current market conditions:', marketConditions);

        // Get recommendations for both ATM and Flazh templates
        const atmTemplate = await enhancedTemplateSelector.getRecommendedTemplate('ATM');
        const flazhTemplate = await enhancedTemplateSelector.getRecommendedTemplate('Flazh');

        console.log('ATM template found:', atmTemplate ? atmTemplate.name : 'None');
        console.log('Flazh template found:', flazhTemplate ? flazhTemplate.name : 'None');

        // Prepare fallback templates to ensure display always works
        const fallbackFlazh = {
            name: "Default Flazh Template",
            fastPeriod: 34,
            fastRange: 5,
            mediumPeriod: 70,
            mediumRange: 6,
            slowPeriod: 100,
            slowRange: 7,
            filterMultiplier: 20
        };

        const fallbackATM = {
            name: "Default ATM Template",
            brackets: "Standard",
            calculationMode: "Ticks"
        };

        // Return recommendations
        res.json({
            success: true,
            marketConditions: {
                // Use the exact property names expected by the client
                session: marketConditions.session,
                volatility: marketConditions.volatility,
                dayOfWeek: marketConditions.dayOfWeek,
                timestamp: marketConditions.timestamp
            },
            recommendations: {
                atm: atmTemplate || fallbackATM,
                flazh: flazhTemplate || fallbackFlazh
            }
        });
    } catch (error) {
        console.error('Error getting template recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting template recommendations',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/template-recommendations/:type
 * @desc    Get recommendations for a specific template type
 * @access  Public
 */
router.get('/:type', async (req, res) => {
    try {
        const { type } = req.params;
        console.log(`Getting template recommendations for type: ${type}`);

        // Validate template type (fixed to use lowercase comparison)
        if (!['atm', 'flazh'].includes(type.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid template type: ${type}`,
                error: 'Template type must be either ATM or Flazh'
            });
        }

        // Get current market conditions
        const marketConditions = marketConditionsService.analyzeMarketConditions();
        console.log('Current market conditions:', marketConditions);

        // Get recommendation for the specified template type
        const template = await enhancedTemplateSelector.getRecommendedTemplate(type.toUpperCase());
        console.log(`${type} template found:`, template ? template.name : 'None');

        // Prepare fallback template data
        let fallbackTemplate;
        if (type.toLowerCase() === 'atm') {
            fallbackTemplate = {
                name: "Default ATM Template",
                brackets: "Standard",
                calculationMode: "Ticks"
            };
        } else {
            fallbackTemplate = {
                name: "Default Flazh Template",
                fastPeriod: 34,
                fastRange: 5,
                mediumPeriod: 70,
                mediumRange: 6,
                slowPeriod: 100,
                slowRange: 7,
                filterMultiplier: 20
            };
        }

        // Return the recommendation (using fallback if needed)
        res.json({
            success: true,
            marketConditions: {
                session: marketConditions.session,
                volatility: marketConditions.volatility,
                dayOfWeek: marketConditions.dayOfWeek,
                timestamp: marketConditions.timestamp
            },
            recommendation: template || fallbackTemplate
        });
    } catch (error) {
        console.error(`Error getting ${req.params.type} template recommendation:`, error);
        res.status(500).json({
            success: false,
            message: `Error getting ${req.params.type} template recommendation`,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/template-recommendations/custom
 * @desc    Get template recommendations based on custom market conditions
 * @access  Public
 */
router.post('/custom', async (req, res) => {
    try {
        const { session, volatility, templateType } = req.body;
        console.log(`Getting custom template recommendations: Session=${session}, Volatility=${volatility}, Type=${templateType}`);

        // Validate required fields
        if (!session || !volatility || !templateType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                error: 'Please provide session, volatility, and templateType'
            });
        }

        // Validate template type (fixed variable name and using lowercase comparison)
        if (!['atm', 'flazh'].includes(templateType.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid template type: ${templateType}`,
                error: 'Template type must be either ATM or Flazh'
            });
        }

        // Create custom market conditions
        const customConditions = {
            currentSession: session,
            volatilityCategory: volatility,
            currentTime: new Date().toISOString()
        };

        // Get recommendation based on custom conditions
        const template = await enhancedTemplateSelector.getRecommendedTemplate(
            templateType.toUpperCase(),
            customConditions
        );

        console.log(`Template found for custom conditions:`, template ? template.name : 'None');

        // Prepare fallback template data
        let fallbackTemplate;
        if (templateType.toLowerCase() === 'atm') {
            fallbackTemplate = {
                name: "Default ATM Template",
                brackets: "Standard",
                calculationMode: "Ticks"
            };
        } else {
            fallbackTemplate = {
                name: "Default Flazh Template",
                fastPeriod: 34,
                fastRange: 5,
                mediumPeriod: 70,
                mediumRange: 6,
                slowPeriod: 100,
                slowRange: 7,
                filterMultiplier: 20
            };
        }

        // Map session and volatility to client-expected format
        let mappedSession;
        switch (session) {
            case 'US_OPEN': mappedSession = 'Pre_Market'; break;
            case 'US_MIDDAY': mappedSession = 'Late_Morning'; break;
            case 'US_AFTERNOON': mappedSession = 'Early_Afternoon'; break;
            case 'OVERNIGHT': mappedSession = 'After_Hours'; break;
            case 'ASIA': mappedSession = 'Overnight'; break;
            case 'EUROPE': mappedSession = 'Overnight'; break;
            default: mappedSession = session;
        }

        let mappedVolatility;
        switch (volatility) {
            case 'LOW_VOLATILITY': mappedVolatility = 'Low_Volatility'; break;
            case 'MEDIUM_VOLATILITY': mappedVolatility = 'Medium_Volatility'; break;
            case 'HIGH_VOLATILITY': mappedVolatility = 'High_Volatility'; break;
            default: mappedVolatility = volatility;
        }

        // Return the result
        res.json({
            success: true,
            marketConditions: {
                session: mappedSession,
                volatility: mappedVolatility,
                dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                timestamp: new Date()
            },
            recommendation: template || fallbackTemplate
        });
    } catch (error) {
        console.error('Error getting custom template recommendation:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting custom template recommendation',
            error: error.message
        });
    }
});

module.exports = router;
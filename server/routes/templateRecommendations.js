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

        // Return recommendations
        res.json({
            success: true,
            marketConditions: {
                session: marketConditions.currentSession,
                volatility: marketConditions.volatilityCategory,
                timestamp: marketConditions.currentTime
            },
            recommendations: {
                atm: atmTemplate ? {
                    name: atmTemplate.name,
                    brackets: atmTemplate.brackets,
                    calculationMode: atmTemplate.calculationMode
                } : null,
                flazh: flazhTemplate ? {
                    name: flazhTemplate.name,
                    fastPeriod: flazhTemplate.fastPeriod,
                    fastRange: flazhTemplate.fastRange,
                    mediumPeriod: flazhTemplate.mediumPeriod,
                    mediumRange: flazhTemplate.mediumRange,
                    slowPeriod: flazhTemplate.slowPeriod,
                    slowRange: flazhTemplate.slowRange,
                    filterMultiplier: flazhTemplate.filterMultiplier
                } : null
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

        // Return the recommendation
        if (template) {
            let templateData;

            if (type.toUpperCase() === 'ATM') {
                templateData = {
                    name: template.name,
                    brackets: template.brackets,
                    calculationMode: template.calculationMode
                };
            } else {
                templateData = {
                    name: template.name,
                    fastPeriod: template.fastPeriod,
                    fastRange: template.fastRange,
                    mediumPeriod: template.mediumPeriod,
                    mediumRange: template.mediumRange,
                    slowPeriod: template.slowPeriod,
                    slowRange: template.slowRange,
                    filterMultiplier: template.filterMultiplier
                };
            }

            res.json({
                success: true,
                marketConditions: {
                    session: marketConditions.currentSession,
                    volatility: marketConditions.volatilityCategory,
                    timestamp: marketConditions.currentTime
                },
                recommendation: templateData
            });
        } else {
            res.status(404).json({
                success: false,
                message: `No ${type} template found for current market conditions`,
                marketConditions: {
                    session: marketConditions.currentSession,
                    volatility: marketConditions.volatilityCategory
                }
            });
        }
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

        // Return the recommendation
        if (template) {
            let templateData;

            if (templateType.toUpperCase() === 'ATM') {
                templateData = {
                    name: template.name,
                    brackets: template.brackets,
                    calculationMode: template.calculationMode
                };
            } else {
                templateData = {
                    name: template.name,
                    fastPeriod: template.fastPeriod,
                    fastRange: template.fastRange,
                    mediumPeriod: template.mediumPeriod,
                    mediumRange: template.mediumRange,
                    slowPeriod: template.slowPeriod,
                    slowRange: template.slowRange,
                    filterMultiplier: template.filterMultiplier
                };
            }

            res.json({
                success: true,
                marketConditions: customConditions,
                recommendation: templateData
            });
        } else {
            res.status(404).json({
                success: false,
                message: `No ${templateType} template found for specified market conditions`,
                marketConditions: customConditions
            });
        }
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
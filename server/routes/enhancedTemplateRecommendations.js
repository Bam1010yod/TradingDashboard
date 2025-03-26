// File: C:\TradingDashboard\server\routes\enhancedTemplateRecommendations.js

const express = require('express');
const router = express.Router();
const enhancedTemplateSelector = require('../services/enhancedTemplateSelector');
const marketDataService = require('../services/marketDataService');
const backtestingResultsService = require('../services/backtestingResultsService');
const marketConditionsService = require('../services/marketConditionsService');

/**
 * @route GET /api/enhancedTemplateRecommendations
 * @desc Get enhanced template recommendations for both ATM and Flazh
 * @access Public
 */
router.get('/', async (req, res) => {
    try {
        // Get current market conditions
        let marketConditions;
        let isRealData = true;

        try {
            marketConditions = await marketConditionsService.getCurrentMarketConditions();
        } catch (conditionsError) {
            console.error('Error getting market conditions:', conditionsError);
            // Use default market conditions
            marketConditions = {
                volatility: 'medium',
                trend: 'neutral',
                volume: 'normal',
                session: 'regular',
                timestamp: new Date().toISOString()
            };
            isRealData = false;
        }

        // Create fallback templates based on market conditions
        const volatility = marketConditions?.volatility || 'medium';

        // Create response object with fallback templates
        const response = {
            dataSource: 'fallback',
            lastUpdated: new Date().toISOString(),
            flazh: {
                name: `Fallback Flazh (${volatility} volatility)`,
                description: "System-generated fallback template",
                parameters: {
                    stopLoss: volatility === 'high' ? 15 : (volatility === 'low' ? 8 : 12),
                    takeProfit: volatility === 'high' ? 30 : (volatility === 'low' ? 16 : 24),
                    trailStop: volatility === 'high' ? 8 : (volatility === 'low' ? 4 : 6),
                    entryFilter: 50,
                    fastPeriod: 5,
                    mediumPeriod: 10,
                    slowPeriod: 20
                },
                isFallback: true
            },
            atm: {
                name: `Fallback ATM (${volatility} volatility)`,
                description: "System-generated fallback template",
                parameters: {
                    stopLoss: volatility === 'high' ? 12 : (volatility === 'low' ? 6 : 9),
                    profit1: volatility === 'high' ? 20 : (volatility === 'low' ? 10 : 15),
                    profit2: volatility === 'high' ? 30 : (volatility === 'low' ? 18 : 25),
                    autoBreakEven: true,
                    breakEvenTicks: volatility === 'high' ? 8 : (volatility === 'low' ? 4 : 6)
                },
                isFallback: true
            },
            marketConditions: marketConditions
        };

        // Try to get real templates if the enhancedTemplateSelector is available
        try {
            if (enhancedTemplateSelector && typeof enhancedTemplateSelector.getEnhancedTemplate === 'function') {
                // Try to get Flazh template
                const flazhRecommendation = await enhancedTemplateSelector.getEnhancedTemplate(
                    'Flazh',
                    new Date(),
                    await marketDataService.getLatestMarketData()
                );

                if (flazhRecommendation && flazhRecommendation.adjustedTemplate) {
                    response.flazh = flazhRecommendation.adjustedTemplate;
                    response.flazh.isFallback = false;
                    isRealData = true;
                }

                // Try to get ATM template
                const atmRecommendation = await enhancedTemplateSelector.getEnhancedTemplate(
                    'ATM',
                    new Date(),
                    await marketDataService.getLatestMarketData()
                );

                if (atmRecommendation && atmRecommendation.adjustedTemplate) {
                    response.atm = atmRecommendation.adjustedTemplate;
                    response.atm.isFallback = false;
                    isRealData = true;
                }

                // Update data source indicator if both templates are real
                if (!response.flazh.isFallback && !response.atm.isFallback) {
                    response.dataSource = 'live';
                }
            }
        } catch (templateError) {
            console.error('Error getting templates:', templateError);
            // Keep fallback templates already set
            isRealData = false;
        }

        // Return recommendations
        return res.json(response);
    } catch (error) {
        console.error('Error in enhanced template recommendations route:', error);

        // Provide a complete fallback response with both template types
        const fallbackConditions = {
            volatility: 'medium',
            trend: 'neutral',
            volume: 'normal',
            session: 'regular',
            timestamp: new Date().toISOString()
        };

        const fallbackResponse = {
            dataSource: 'fallback',
            lastUpdated: new Date().toISOString(),
            flazh: {
                name: "Emergency Fallback Flazh Template",
                description: "System-generated emergency fallback when an error occurred",
                parameters: {
                    stopLoss: 12,
                    takeProfit: 24,
                    trailStop: 6,
                    entryFilter: 50,
                    fastPeriod: 5,
                    mediumPeriod: 10,
                    slowPeriod: 20
                },
                isFallback: true
            },
            atm: {
                name: "Emergency Fallback ATM Template",
                description: "System-generated emergency fallback when an error occurred",
                parameters: {
                    stopLoss: 9,
                    profit1: 15,
                    profit2: 25,
                    autoBreakEven: true,
                    breakEvenTicks: 6
                },
                isFallback: true
            },
            marketConditions: fallbackConditions
        };

        // Return fallback data with success status
        // Using status 200 to ensure UI displays the data
        return res.status(200).json(fallbackResponse);
    }
});

/**
 * @route POST /api/enhancedTemplateRecommendations/custom
 * @desc Get custom template recommendations based on provided parameters
 * @access Public
 */
router.post('/custom', async (req, res) => {
    try {
        const { session, volatility } = req.body;

        if (!session || !volatility) {
            return res.status(400).json({
                error: 'Missing required parameters: session and volatility'
            });
        }

        // Create custom market conditions
        const marketConditions = {
            session,
            volatility,
            timestamp: new Date().toISOString()
        };

        // Create response with fallback templates
        const response = {
            dataSource: 'fallback',
            lastUpdated: new Date().toISOString(),
            flazh: {
                name: `Custom Fallback Flazh (${volatility})`,
                parameters: {
                    stopLoss: volatility.includes('HIGH') ? 15 : (volatility.includes('LOW') ? 8 : 12),
                    takeProfit: volatility.includes('HIGH') ? 30 : (volatility.includes('LOW') ? 16 : 24),
                    trailStop: volatility.includes('HIGH') ? 8 : (volatility.includes('LOW') ? 4 : 6),
                    fastPeriod: volatility.includes('HIGH') ? 3 : (volatility.includes('LOW') ? 8 : 5),
                    mediumPeriod: volatility.includes('HIGH') ? 8 : (volatility.includes('LOW') ? 15 : 10),
                    slowPeriod: volatility.includes('HIGH') ? 15 : (volatility.includes('LOW') ? 30 : 20),
                    fastRange: volatility.includes('HIGH') ? 4 : (volatility.includes('LOW') ? 2 : 3),
                    mediumRange: volatility.includes('HIGH') ? 5 : (volatility.includes('LOW') ? 3 : 4),
                    slowRange: volatility.includes('HIGH') ? 6 : (volatility.includes('LOW') ? 4 : 5),
                    filterMultiplier: volatility.includes('HIGH') ? 1 : (volatility.includes('LOW') ? 3 : 2)
                },
                isFallback: true
            },
            atm: {
                name: `Custom Fallback ATM (${volatility})`,
                parameters: {
                    stopLoss: volatility.includes('HIGH') ? 12 : (volatility.includes('LOW') ? 6 : 9),
                    profit1: volatility.includes('HIGH') ? 20 : (volatility.includes('LOW') ? 10 : 15),
                    profit2: volatility.includes('HIGH') ? 30 : (volatility.includes('LOW') ? 18 : 25),
                    autoBreakEven: true,
                    breakEvenTicks: volatility.includes('HIGH') ? 8 : (volatility.includes('LOW') ? 4 : 6),
                    brackets: volatility.includes('HIGH') ? "Wide" : (volatility.includes('LOW') ? "Narrow" : "Standard"),
                    calculationMode: "Ticks"
                },
                isFallback: true
            },
            marketConditions
        };

        // Try to get real templates if enhancedTemplateSelector is available
        try {
            if (enhancedTemplateSelector && typeof enhancedTemplateSelector.getCustomEnhancedTemplate === 'function') {
                // Get enhanced Flazh template
                const flazhRecommendation = await enhancedTemplateSelector.getCustomEnhancedTemplate({
                    templateType: 'Flazh',
                    session,
                    volatility
                });

                if (flazhRecommendation && flazhRecommendation.adjustedTemplate) {
                    response.flazh = flazhRecommendation.adjustedTemplate;
                    response.flazh.isFallback = false;
                }

                // Get enhanced ATM template
                const atmRecommendation = await enhancedTemplateSelector.getCustomEnhancedTemplate({
                    templateType: 'ATM',
                    session,
                    volatility
                });

                if (atmRecommendation && atmRecommendation.adjustedTemplate) {
                    response.atm = atmRecommendation.adjustedTemplate;
                    response.atm.isFallback = false;
                }

                // Update data source indicator if both templates are real
                if (!response.flazh.isFallback && !response.atm.isFallback) {
                    response.dataSource = 'live';
                }
            }
        } catch (templateError) {
            console.error('Error getting custom templates:', templateError);
            // Fallback templates are already set
        }

        return res.json(response);
    } catch (error) {
        console.error('Error in custom template recommendations route:', error);

        // Return fallback data with fallback indicator
        return res.status(200).json({
            dataSource: 'fallback',
            lastUpdated: new Date().toISOString(),
            error: 'Server error getting custom template recommendations',
            flazh: {
                name: "Emergency Fallback Flazh Template",
                parameters: {
                    fastPeriod: 5,
                    mediumPeriod: 10,
                    slowPeriod: 20,
                    fastRange: 3,
                    mediumRange: 4,
                    slowRange: 5,
                    filterMultiplier: 2
                },
                isFallback: true
            },
            atm: {
                name: "Emergency Fallback ATM Template",
                parameters: {
                    stopLoss: 9,
                    profit1: 15,
                    profit2: 25,
                    autoBreakEven: true,
                    breakEvenTicks: 6,
                    brackets: "Standard",
                    calculationMode: "Ticks"
                },
                isFallback: true
            }
        });
    }
});

/**
 * @route GET /api/enhanced-recommendations/atm
 * @description Get enhanced recommended ATM template
 * @access Public
 */
router.get('/atm', async (req, res) => {
    try {
        // Get latest market data
        const marketData = await marketDataService.getLatestMarketData();

        // Get enhanced recommendation
        const recommendation = await enhancedTemplateSelector.getEnhancedTemplate(
            'ATM',
            new Date(),
            marketData
        );

        if (!recommendation) {
            return res.status(200).json({
                success: true,
                dataSource: 'fallback',
                message: 'No suitable template found',
                recommendation: {
                    name: "Fallback ATM Template",
                    parameters: {
                        stopLoss: 9,
                        profit1: 15,
                        profit2: 25,
                        autoBreakEven: true,
                        breakEvenTicks: 6
                    },
                    isFallback: true
                }
            });
        }

        res.json({
            success: true,
            dataSource: 'live',
            recommendation
        });
    } catch (error) {
        console.error('Error getting enhanced ATM recommendation:', error);
        res.status(200).json({
            success: true,
            dataSource: 'fallback',
            message: 'Server error getting enhanced ATM recommendation',
            error: error.message,
            recommendation: {
                name: "Fallback ATM Template",
                parameters: {
                    stopLoss: 9,
                    profit1: 15,
                    profit2: 25,
                    autoBreakEven: true,
                    breakEvenTicks: 6
                },
                isFallback: true
            }
        });
    }
});

/**
 * @route GET /api/enhanced-recommendations/flazh
 * @description Get enhanced recommended Flazh template
 * @access Public
 */
router.get('/flazh', async (req, res) => {
    try {
        // Get latest market data
        const marketData = await marketDataService.getLatestMarketData();

        // Get enhanced recommendation
        const recommendation = await enhancedTemplateSelector.getEnhancedTemplate(
            'Flazh',
            new Date(),
            marketData
        );

        if (!recommendation) {
            return res.status(200).json({
                success: true,
                dataSource: 'fallback',
                message: 'No suitable template found',
                recommendation: {
                    name: "Fallback Flazh Template",
                    parameters: {
                        fastPeriod: 5,
                        mediumPeriod: 10,
                        slowPeriod: 20,
                        fastRange: 3,
                        mediumRange: 4,
                        slowRange: 5,
                        filterMultiplier: 2
                    },
                    isFallback: true
                }
            });
        }

        res.json({
            success: true,
            dataSource: 'live',
            recommendation
        });
    } catch (error) {
        console.error('Error getting enhanced Flazh recommendation:', error);
        res.status(200).json({
            success: true,
            dataSource: 'fallback',
            message: 'Server error getting enhanced Flazh recommendation',
            error: error.message,
            recommendation: {
                name: "Fallback Flazh Template",
                parameters: {
                    fastPeriod: 5,
                    mediumPeriod: 10,
                    slowPeriod: 20,
                    fastRange: 3,
                    mediumRange: 4,
                    slowRange: 5,
                    filterMultiplier: 2
                },
                isFallback: true
            }
        });
    }
});

module.exports = router;
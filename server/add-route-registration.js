// C:\TradingDashboard\server\add-route-registration.js
const fs = require('fs');
const path = require('path');

// Function to update server.js to register the route
const addRouteRegistration = () => {
    try {
        const serverFilePath = path.join(__dirname, 'server.js');

        if (!fs.existsSync(serverFilePath)) {
            console.error(`Main server file not found: ${serverFilePath}`);
            return;
        }

        // Read the current server.js content
        let serverContent = fs.readFileSync(serverFilePath, 'utf8');

        // Check if templateRecommendations route is already registered
        if (serverContent.includes('templateRecommendations')) {
            console.log('templateRecommendations route is already registered in server.js');
            return;
        }

        // Find where routes are registered
        const routeRegistrationSection = serverContent.match(/\/\/ API Routes[\s\S]*?app\.use\(['"]\/api\/[^'"]+['"]/m);

        if (!routeRegistrationSection) {
            console.error('Could not find route registration section in server.js');
            return;
        }

        // Insert our new route registration
        const lastRoute = routeRegistrationSection[0];
        const updatedContent = serverContent.replace(
            lastRoute,
            `${lastRoute}\n\n// Template Recommendations Route\napp.use('/api/templateRecommendations', require('./routes/templateRecommendations'));`
        );

        // Backup the original file
        const backupPath = `${serverFilePath}.bak.${Date.now()}`;
        fs.writeFileSync(backupPath, serverContent);
        console.log(`Backed up original server.js to ${backupPath}`);

        // Write the updated content
        fs.writeFileSync(serverFilePath, updatedContent);
        console.log('Updated server.js to register templateRecommendations route');

    } catch (error) {
        console.error(`Error updating server file: ${error.message}`);
    }
};

// Create the templateRecommendations.js file if it doesn't exist
const ensureTemplateRecommendationsFile = () => {
    const filePath = path.join(__dirname, 'routes', 'templateRecommendations.js');

    // Check if file already exists
    if (fs.existsSync(filePath)) {
        console.log('templateRecommendations.js already exists');
        return;
    }

    // Create the routes directory if it doesn't exist
    const routesDir = path.join(__dirname, 'routes');
    if (!fs.existsSync(routesDir)) {
        fs.mkdirSync(routesDir);
        console.log('Created routes directory');
    }

    // Template for the route file
    const routeContent = `const express = require('express');
const router = express.Router();
const enhancedTemplateSelector = require('../services/enhancedTemplateSelector');
const marketConditionsService = require('../services/marketConditionsService');

/**
 * @route   GET /api/templateRecommendations
 * @desc    Get template recommendations based on current market conditions
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        // Get current market conditions
        const marketConditions = marketConditionsService.analyzeMarketConditions();
        
        // Get recommendations for both ATM and Flazh templates
        const atmTemplate = await enhancedTemplateSelector.getRecommendedTemplate('ATM');
        const flazhTemplate = await enhancedTemplateSelector.getRecommendedTemplate('Flazh');
        
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
 * @route   GET /api/templateRecommendations/:type
 * @desc    Get recommendations for a specific template type
 * @access  Public
 */
router.get('/:type', async (req, res) => {
    try {
        const { type } = req.params;
        
        // Validate template type
        if (!['ATM', 'Flazh'].includes(type.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: \`Invalid template type: \${type}\`,
                error: 'Template type must be either ATM or Flazh'
            });
        }
        
        // Get current market conditions
        const marketConditions = marketConditionsService.analyzeMarketConditions();
        
        // Get recommendation for the specified template type
        const template = await enhancedTemplateSelector.getRecommendedTemplate(type.toUpperCase());
        
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
                message: \`No \${type} template found for current market conditions\`,
                marketConditions: {
                    session: marketConditions.currentSession,
                    volatility: marketConditions.volatilityCategory
                }
            });
        }
    } catch (error) {
        console.error(\`Error getting \${req.params.type} template recommendation:\`, error);
        res.status(500).json({
            success: false,
            message: \`Error getting \${req.params.type} template recommendation\`,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/templateRecommendations/custom
 * @desc    Get template recommendations based on custom market conditions
 * @access  Public
 */
router.post('/custom', async (req, res) => {
    try {
        const { session, volatility, templateType } = req.body;
        
        // Validate required fields
        if (!session || !volatility || !templateType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                error: 'Please provide session, volatility, and templateType'
            });
        }
        
        // Validate template type
        if (!['ATM', 'Flazh'].includes(templateType.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: \`Invalid template type: \${templateType}\`,
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
                message: \`No \${templateType} template found for specified market conditions\`,
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

module.exports = router;`;

    // Write the file
    fs.writeFileSync(filePath, routeContent);
    console.log('Created templateRecommendations.js route file');
};

// Execute the functions
ensureTemplateRecommendationsFile();
addRouteRegistration();

console.log('\nCompleted! Now restart your server with "npm start" to apply the changes.');
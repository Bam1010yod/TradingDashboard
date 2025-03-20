// C:\TradingDashboard\server\services\templateImport.js

const fs = require('fs');
const path = require('path');
const xmlParser = require('../utils/xmlParser');
const AtmStrategy = require('../models/atmStrategy');
const FlazhInfinity = require('../models/flazhInfinity');

/**
 * Detects the template type based on XML content
 * @param {Object} parsedXML - The parsed XML object
 * @returns {string} - Template type ('ATM' or 'Flazh')
 */
const detectTemplateType = (parsedXML) => {
    if (parsedXML.NinjaTrader && parsedXML.NinjaTrader.AtmStrategy) {
        return 'ATM';
    } else if (parsedXML.NinjaTrader && parsedXML.NinjaTrader.RenkoKings_FlazhInfinity) {
        return 'Flazh';
    } else {
        throw new Error('Unknown template type');
    }
};

/**
 * Extracts market condition from template name
 * @param {string} templateName - The template name
 * @returns {string} - The detected market condition
 */
const detectMarketCondition = (templateName) => {
    // Map of known condition identifiers in template names
    const conditionMap = {
        'OPEN': 'Opening',
        'MORN': 'Morning',
        'LUNCH': 'Lunch',
        'EA': 'Early_Afternoon',
        'LA': 'Late_Afternoon',
        'EVE': 'Evening',
        'NIGHT': 'Overnight',
        'HIGH': 'High_Volatility',
        'LOW': 'Low_Volatility',
        'NORM': 'Normal_Volatility'
    };

    // Check template name for market condition identifiers
    for (const [key, value] of Object.entries(conditionMap)) {
        if (templateName.includes(key)) {
            return value;
        }
    }

    // Default to normal volatility if no condition is detected
    return 'Normal_Volatility';
};

/**
 * Import an ATM strategy template from XML
 * @param {string} filePath - Path to the XML file
 * @param {Object} parsedXML - The parsed XML content
 * @returns {Promise<Object>} - The saved ATM strategy document
 */
const importAtmTemplate = async (filePath, parsedXML) => {
    try {
        const xmlContent = fs.readFileSync(filePath, 'utf8');
        const atmData = parsedXML.NinjaTrader.AtmStrategy;
        const templateName = atmData.Template || path.basename(filePath, '.xml');

        // Extract bracket information
        const brackets = [];
        if (atmData.Brackets && atmData.Brackets.Bracket) {
            const bracketData = atmData.Brackets.Bracket;
            const bracketArray = Array.isArray(bracketData) ? bracketData : [bracketData];

            bracketArray.forEach(bracket => {
                brackets.push({
                    quantity: parseInt(bracket.Quantity) || 1,
                    stopLoss: parseInt(bracket.StopLoss) || 0,
                    stopStrategy: {
                        autoBreakEvenPlus: parseInt(bracket.StopStrategy.AutoBreakEvenPlus) || 0,
                        autoBreakEvenProfitTrigger: parseInt(bracket.StopStrategy.AutoBreakEvenProfitTrigger) || 0,
                        autoTrailSteps: bracket.StopStrategy.AutoTrailSteps || [],
                        isSimStopEnabled: bracket.StopStrategy.IsSimStopEnabled === 'true',
                        volumeTrigger: parseInt(bracket.StopStrategy.VolumeTrigger) || 0
                    },
                    target: parseInt(bracket.Target) || 0
                });
            });
        }

        // Detect market condition from template name
        const marketCondition = detectMarketCondition(templateName);

        // Create ATM document
        const atmDocument = {
            templateName,
            fileName: path.basename(filePath),
            filePath,
            calculationMode: atmData.CalculationMode || 'Ticks',
            defaultQuantity: parseInt(atmData.DefaultQuantity) || 1,
            timeInForce: atmData.TimeInForce || 'Gtc',
            brackets,
            isChase: atmData.IsChase === 'true',
            chaseLimit: parseInt(atmData.ChaseLimit) || 0,
            isTargetChase: atmData.IsTargetChase === 'true',
            reverseAtStop: atmData.ReverseAtStop === 'true',
            reverseAtTarget: atmData.ReverseAtTarget === 'true',
            marketCondition,
            description: `${templateName} ATM Strategy Template`,
            xmlContent
        };

        // Save to database (update if exists, create if not)
        const existingTemplate = await AtmStrategy.findOne({ templateName });

        if (existingTemplate) {
            // Update existing template
            Object.assign(existingTemplate, atmDocument);
            existingTemplate.lastModified = Date.now();
            return await existingTemplate.save();
        } else {
            // Create new template
            return await AtmStrategy.create(atmDocument);
        }
    } catch (error) {
        throw new Error(`Error importing ATM template: ${error.message}`);
    }
};

/**
 * Import a Flazh Infinity template from XML
 * @param {string} filePath - Path to the XML file
 * @param {Object} parsedXML - The parsed XML content
 * @returns {Promise<Object>} - The saved Flazh Infinity document
 */
const importFlazhTemplate = async (filePath, parsedXML) => {
    try {
        const xmlContent = fs.readFileSync(filePath, 'utf8');

        // Flazh templates have a deeper nesting structure
        const flazhData = parsedXML.NinjaTrader.RenkoKings_FlazhInfinity.RenkoKings_FlazhInfinity;

        // Extract template name (use UserNote or filename)
        let templateName = flazhData.UserNote ?
            flazhData.UserNote.split(' ')[0] : // Extract first part of user note
            path.basename(filePath, '.xml');

        // Detect market condition from template name
        const marketCondition = detectMarketCondition(templateName);

        // Extract bars period information
        const barsPeriod = {
            periodType: flazhData.BarsPeriodSerializable?.BaseBarsPeriodType || 'Minute',
            baseValue: parseInt(flazhData.BarsPeriodSerializable?.BaseBarsPeriodValue) || 1,
            value: parseInt(flazhData.BarsPeriodSerializable?.Value) || 0,
            value2: parseInt(flazhData.BarsPeriodSerializable?.Value2) || 0
        };

        // Create Flazh document
        const flazhDocument = {
            templateName,
            fileName: path.basename(filePath),
            filePath,

            // Core Flazh settings
            maType: flazhData.MAType || 'EMA',
            fastPeriod: parseInt(flazhData.FastPeriod) || 34,
            fastRange: parseInt(flazhData.FastRange) || 5,
            mediumPeriod: parseInt(flazhData.MediumPeriod) || 70,
            mediumRange: parseInt(flazhData.MediumRange) || 6,
            slowPeriod: parseInt(flazhData.SlowPeriod) || 100,
            slowRange: parseInt(flazhData.SlowRange) || 7,

            // Filter settings
            filterEnabled: flazhData.FilterEnabled === 'true',
            filterMultiplier: parseInt(flazhData.FilterMultiplier) || 10,

            // Retracement settings
            searchLimit: parseInt(flazhData.SearchLimit) || 10,
            minOffset: parseInt(flazhData.MinOffset) || 5,
            minRetracementMode: flazhData.MinRetracementMode || 'Percent',
            minRetracementPercent: parseInt(flazhData.MinRetracementPercent) || 50,

            // Session management
            sessionsManagementEnabled: flazhData.SessionsManagementEnabled === 'true',
            timeSettings: {
                time1Enabled: flazhData.Time1Enabled === 'true',
                time1Start: flazhData.Time1Start || '190000',
                time1Duration: flazhData.Time1Duration || '40000',
                time2Enabled: flazhData.Time2Enabled === 'true',
                time2Start: flazhData.Time2Start || '30000',
                time2Duration: flazhData.Time2Duration || '40000',
                time3Enabled: flazhData.Time3Enabled === 'true',
                time3Start: flazhData.Time3Start || '80000',
                time3Duration: flazhData.Time3Duration || '40000'
            },

            // Trading conditions
            conditionTrend: flazhData.ConditionTrend === 'true',
            conditionScalping: flazhData.ConditionScalping === 'true',

            // Chart period settings
            barsPeriod,

            // Metadata
            marketCondition,
            description: `${templateName} Flazh Infinity Template`,
            userNote: flazhData.UserNote || '',
            xmlContent
        };

        // Save to database (update if exists, create if not)
        const existingTemplate = await FlazhInfinity.findOne({ templateName });

        if (existingTemplate) {
            // Update existing template
            Object.assign(existingTemplate, flazhDocument);
            existingTemplate.lastModified = Date.now();
            return await existingTemplate.save();
        } else {
            // Create new template
            return await FlazhInfinity.create(flazhDocument);
        }
    } catch (error) {
        throw new Error(`Error importing Flazh template: ${error.message}`);
    }
};

/**
 * Import a template from an XML file
 * @param {string} filePath - Path to the XML file 
 * @returns {Promise<Object>} - The imported template
 */
const importTemplate = async (filePath) => {
    try {
        // Parse the XML file using your existing function
        const parsedXML = await xmlParser.parseXmlFile(filePath);

        // Detect template type
        const templateType = detectTemplateType(parsedXML);

        // Import based on template type
        if (templateType === 'ATM') {
            return await importAtmTemplate(filePath, parsedXML);
        } else if (templateType === 'Flazh') {
            return await importFlazhTemplate(filePath, parsedXML);
        } else {
            throw new Error(`Unsupported template type: ${templateType}`);
        }
    } catch (error) {
        throw new Error(`Error importing template: ${error.message}`);
    }
};

/**
 * Import all templates from a directory
 * @param {string} directoryPath - Path to the directory containing templates
 * @returns {Promise<Object>} - Summary of import results
 */
const importTemplatesFromDirectory = async (directoryPath) => {
    try {
        // Check if directory exists
        if (!fs.existsSync(directoryPath)) {
            throw new Error(`Directory does not exist: ${directoryPath}`);
        }

        // Read all XML files from the directory
        const files = fs.readdirSync(directoryPath);
        const xmlFiles = files.filter(file => path.extname(file).toLowerCase() === '.xml');

        // Initialize results object
        const results = {
            total: xmlFiles.length,
            successful: 0,
            failed: 0,
            errors: []
        };

        // Skip if no XML files found
        if (xmlFiles.length === 0) {
            console.log(`No XML files found in directory: ${directoryPath}`);
            return results;
        }

        // Process each XML file
        for (const file of xmlFiles) {
            const filePath = path.join(directoryPath, file);

            try {
                // Check if the file actually exists
                if (!fs.existsSync(filePath)) {
                    throw new Error('File does not exist');
                }

                // Import the template
                await importTemplate(filePath);
                results.successful++;
                console.log(`Successfully imported template: ${file}`);
            } catch (error) {
                results.failed++;
                results.errors.push({
                    file,
                    error: error.message
                });
                console.error(`Failed to import template ${file}: ${error.message}`);
            }
        }

        return results;
    } catch (error) {
        throw new Error(`Error importing templates from directory: ${error.message}`);
    }
};

module.exports = {
    importTemplate,
    importTemplatesFromDirectory
};
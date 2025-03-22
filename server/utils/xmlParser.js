const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');

/**
 * Parse an XML file into a JavaScript object
 * @param {string} filePath - Path to the XML file
 * @returns {Promise<object>} - Parsed XML object
 */
const parseXmlFile = async (filePath) => {
    try {
        const xmlData = fs.readFileSync(filePath, 'utf-8');
        const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true
        });
        const result = await parser.parseStringPromise(xmlData);
        return result;
    } catch (error) {
        console.error('Error parsing XML file:', error);
        throw error;
    }
};

/**
 * Parse an XML string into a JavaScript object
 * @param {string} xmlString - XML content as string
 * @returns {Promise<Object>} - Parsed XML as JavaScript object
 */
const parseXML = async (xmlString) => {
    try {
        const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
            normalizeTags: false,
            explicitRoot: false
        });

        return await parser.parseStringPromise(xmlString);
    } catch (error) {
        throw new Error(`XML parsing error: ${error.message}`);
    }
};

/**
 * Parse an XML string into a JavaScript object
 * This function is added for compatibility with the new template import system
 * @param {string} xmlString - XML content as string
 * @returns {Promise<Object>} - Parsed XML as JavaScript object
 */
const parseXmlString = async (xmlString) => {
    try {
        const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true
        });

        return await parser.parseStringPromise(xmlString);
    } catch (error) {
        throw new Error(`Error parsing XML string: ${error.message}`);
    }
};

/**
 * Convert JavaScript object to XML string
 * @param {Object} jsObject - JavaScript object to convert
 * @param {string} rootElement - Root element name
 * @returns {Promise<string>} - XML string
 */
const generateXML = async (jsObject, rootElement) => {
    try {
        const builder = new xml2js.Builder({
            rootName: rootElement,
            headless: false,
            renderOpts: { pretty: true, indent: '  ', newline: '\n' }
        });

        return builder.buildObject(jsObject);
    } catch (error) {
        throw new Error(`XML generation error: ${error.message}`);
    }
};

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
    } else if (parsedXML.ATMTemplate) {
        return 'ATM';
    } else if (parsedXML.FlazhTemplate) {
        return 'Flazh';
    } else {
        throw new Error('Unknown template type');
    }
};

/**
 * Extracts market condition from template name
 * @param {string} templateName - The template name
 * @returns {Object} - The detected market conditions
 */
const detectMarketCondition = (templateName) => {
    // Session mapping
    const sessionMap = {
        'LM': 'Late_Morning',
        'EA': 'Early_Afternoon',
        'PC': 'Pre_Close'
    };

    // Volatility mapping
    const volatilityMap = {
        'LOW': 'Low_Volatility',
        'MED': 'Medium_Volatility',
        'HIGH': 'High_Volatility'
    };

    // Day of week mapping
    const dayMap = {
        'MON': 'Monday',
        'TUE': 'Tuesday',
        'WED': 'Wednesday',
        'THU': 'Thursday',
        'FRI': 'Friday'
    };

    // Initialize result
    const result = {
        session: null,
        volatility: null,
        dayOfWeek: null
    };

    // Detect session
    for (const [key, value] of Object.entries(sessionMap)) {
        if (templateName.includes(key)) {
            result.session = value;
            break;
        }
    }

    // Detect volatility
    for (const [key, value] of Object.entries(volatilityMap)) {
        if (templateName.includes(key)) {
            result.volatility = value;
            break;
        }
    }

    // Detect day of week
    for (const [key, value] of Object.entries(dayMap)) {
        if (templateName.includes(key)) {
            result.dayOfWeek = value;
            break;
        }
    }

    // Set defaults if not detected
    if (!result.session) result.session = 'Unknown_Session';
    if (!result.volatility) result.volatility = 'Normal_Volatility';

    // For backward compatibility with existing code that expects a string
    const marketCondition = `${result.session}_${result.volatility}`;

    // Return both the combined string and detailed object
    return {
        marketCondition,
        details: result
    };
};

/**
 * Extract ATM strategy parameters from XML file
 * @param {string} filePath - Path to the ATM strategy XML file
 * @returns {Promise<object>} - Extracted parameters
 */
const extractAtmParameters = async (filePath) => {
    const data = await parseXmlFile(filePath);
    // Adapt this based on your actual XML structure
    const atmStrategy = data.NinjaTrader.AtmStrategy;

    return {
        template: atmStrategy.Template,
        calculationMode: atmStrategy.CalculationMode,
        brackets: Array.isArray(atmStrategy.Brackets.Bracket)
            ? atmStrategy.Brackets.Bracket.map(parseBracket)
            : [parseBracket(atmStrategy.Brackets.Bracket)]
    };
};

/**
 * Parse a bracket object from ATM XML
 * @param {object} bracket - Bracket object from XML
 * @returns {object} - Parsed bracket object
 */
const parseBracket = (bracket) => ({
    quantity: parseInt(bracket.Quantity),
    stopLoss: parseInt(bracket.StopLoss),
    target: parseInt(bracket.Target),
    stopStrategy: {
        autoBreakEvenPlus: parseInt(bracket.StopStrategy.AutoBreakEvenPlus),
        autoBreakEvenProfitTrigger: parseInt(bracket.StopStrategy.AutoBreakEvenProfitTrigger)
    }
});

/**
 * Extract Flazh Infinity parameters from XML file
 * @param {string} filePath - Path to the Flazh Infinity XML file
 * @returns {Promise<object>} - Extracted parameters
 */
const extractFlazhParameters = async (filePath) => {
    const data = await parseXmlFile(filePath);
    // Adapt this based on your actual XML structure
    const flazhConfig = data.NinjaTrader.RenkoKings_FlazhInfinity.RenkoKings_FlazhInfinity;

    return {
        barsPeriod: {
            periodType: flazhConfig.BarsPeriodSerializable.BarsPeriodTypeSerialize,
            value: parseInt(flazhConfig.BarsPeriodSerializable.Value),
            value2: parseInt(flazhConfig.BarsPeriodSerializable.Value2)
        },
        maType: flazhConfig.MAType,
        fastPeriod: parseInt(flazhConfig.FastPeriod),
        fastRange: parseInt(flazhConfig.FastRange),
        mediumPeriod: parseInt(flazhConfig.MediumPeriod),
        mediumRange: parseInt(flazhConfig.MediumRange),
        slowPeriod: parseInt(flazhConfig.SlowPeriod),
        slowRange: parseInt(flazhConfig.SlowRange),
        filterEnabled: flazhConfig.FilterEnabled === 'true',
        filterMultiplier: parseInt(flazhConfig.FilterMultiplier),
        searchLimit: parseInt(flazhConfig.SearchLimit),
        minOffset: parseInt(flazhConfig.MinOffset)
    };
};

/**
 * Validate XML structure
 * @param {Object} parsedXML - Parsed XML object
 * @returns {Object} - Validation result
 */
const validateXmlStructure = (parsedXML) => {
    try {
        // Try to detect template type
        const templateType = detectTemplateType(parsedXML);

        // Check basic structure based on type
        if (templateType === 'ATM') {
            if (parsedXML.NinjaTrader && parsedXML.NinjaTrader.AtmStrategy) {
                return {
                    valid: true,
                    templateType
                };
            } else if (parsedXML.ATMTemplate) {
                return {
                    valid: true,
                    templateType
                };
            }
        } else if (templateType === 'Flazh') {
            if (parsedXML.NinjaTrader && parsedXML.NinjaTrader.RenkoKings_FlazhInfinity) {
                return {
                    valid: true,
                    templateType
                };
            } else if (parsedXML.FlazhTemplate) {
                return {
                    valid: true,
                    templateType
                };
            }
        }

        return {
            valid: false,
            error: 'Invalid template structure'
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
};

module.exports = {
    parseXmlFile,
    parseXML,
    parseXmlString,
    generateXML,
    detectTemplateType,
    detectMarketCondition,
    extractAtmParameters,
    parseBracket,
    extractFlazhParameters,
    validateXmlStructure
};
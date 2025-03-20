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
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        return result;
    } catch (error) {
        console.error('Error parsing XML file:', error);
        throw error;
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
            type: flazhConfig.BarsPeriodSerializable.BarsPeriodTypeSerialize,
            value: flazhConfig.BarsPeriodSerializable.Value,
            value2: flazhConfig.BarsPeriodSerializable.Value2
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

module.exports = {
    parseXmlFile,
    detectTemplateType,
    detectMarketCondition,
    extractAtmParameters,
    parseBracket,
    extractFlazhParameters
};
/**
 * Basic template validator
 */

// Validate ATM template parameters
function validateAtmTemplate(params) {
    const errors = [];

    // Check required fields
    if (!params.template) errors.push('Template name is required');
    if (!params.calculationMode) errors.push('Calculation mode is required');
    if (!params.brackets || !Array.isArray(params.brackets) || params.brackets.length === 0) {
        errors.push('At least one bracket is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Validate Flazh template parameters
function validateFlazhTemplate(params) {
    const errors = [];

    // Check required fields
    if (!params.name) errors.push('Template name is required');

    // Validate barsPeriod
    if (!params.barsPeriod) {
        errors.push('Bars period configuration is required');
    }

    // Validate MA settings
    if (!params.maType) errors.push('MA type is required');

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Detect market conditions from template name
function detectMarketConditions(templateName) {
    const conditions = [];

    // Time of day conditions
    if (templateName.includes('OPEN')) conditions.push('Opening');
    if (templateName.includes('MORN')) conditions.push('Morning');
    if (templateName.includes('LUNCH')) conditions.push('Lunch');
    if (templateName.includes('EA')) conditions.push('Early_Afternoon');
    if (templateName.includes('LA')) conditions.push('Late_Afternoon');
    if (templateName.includes('EVE')) conditions.push('Evening');
    if (templateName.includes('NIGHT')) conditions.push('Overnight');

    // Volatility conditions
    if (templateName.includes('HIGH')) conditions.push('High_Volatility');
    if (templateName.includes('LOW')) conditions.push('Low_Volatility');
    if (templateName.includes('NORM')) conditions.push('Normal_Volatility');

    return conditions;
}

module.exports = {
    validateAtmTemplate,
    validateFlazhTemplate,
    detectMarketConditions
};
/**
 * Basic market condition analysis service
 */

const AtmTemplate = require('../../models/atmTemplate');
const FlazhTemplate = require('../../models/flazhTemplate');

// Time of day market conditions
const TIME_CONDITIONS = {
    OPENING: { name: 'Opening', start: '09:30', end: '10:30', identifiers: ['OPEN'] },
    MORNING: { name: 'Morning', start: '10:30', end: '12:00', identifiers: ['MORN'] },
    LUNCH: { name: 'Lunch', start: '12:00', end: '13:30', identifiers: ['LUNCH'] },
    EARLY_AFTERNOON: { name: 'Early Afternoon', start: '13:30', end: '15:00', identifiers: ['EA'] },
    LATE_AFTERNOON: { name: 'Late Afternoon', start: '15:00', end: '16:00', identifiers: ['LA'] },
    EVENING: { name: 'Evening', start: '16:00', end: '17:30', identifiers: ['EVE'] },
    OVERNIGHT: { name: 'Overnight', start: '17:30', end: '09:30', identifiers: ['NIGHT'] }
};

// Volatility market conditions
const VOLATILITY_CONDITIONS = {
    HIGH: { name: 'High Volatility', identifiers: ['HIGH'] },
    NORMAL: { name: 'Normal Volatility', identifiers: ['NORM'] },
    LOW: { name: 'Low Volatility', identifiers: ['LOW'] }
};

/**
 * Detect current market conditions based on time
 * @param {Date} currentTime - Current time (defaults to now)
 * @returns {Object} Detected market conditions
 */
function detectCurrentConditions(currentTime = new Date()) {
    // Detect time of day condition
    const timeCondition = detectTimeCondition(currentTime);

    return {
        time: timeCondition,
        // For now, default to normal volatility since we don't have real-time data
        volatility: VOLATILITY_CONDITIONS.NORMAL
    };
}

/**
 * Detect time of day condition
 * @param {Date} currentTime - Current time
 * @returns {Object} Time condition
 */
function detectTimeCondition(currentTime) {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    for (const condition of Object.values(TIME_CONDITIONS)) {
        if (isTimeInRange(timeString, condition.start, condition.end)) {
            return condition;
        }
    }

    // Default to normal hours
    return TIME_CONDITIONS.MORNING;
}

/**
 * Check if a time is within a specific range
 * @param {string} time - Time to check (HH:MM)
 * @param {string} start - Start time (HH:MM)
 * @param {string} end - End time (HH:MM)
 * @returns {boolean} True if in range
 */
function isTimeInRange(time, start, end) {
    // Handle overnight ranges (e.g., 17:30-09:30)
    if (start > end) {
        return time >= start || time < end;
    }
    return time >= start && time < end;
}

/**
 * Find templates matching the current market conditions
 * @param {Object} conditions - Current market conditions
 * @returns {Promise<Object>} Matching templates
 */
async function findMatchingTemplates(conditions) {
    try {
        // Create condition identifiers to search for in template names
        const timeIdentifiers = conditions.time.identifiers || [];
        const volatilityIdentifiers = conditions.volatility.identifiers || [];

        // Find ATM templates matching the current conditions
        const atmTemplates = await AtmTemplate.find({}).lean();
        const matchingAtm = atmTemplates.filter(template => {
            return hasMatchingConditions(template.name, timeIdentifiers, volatilityIdentifiers);
        });

        // Find Flazh templates matching the current conditions
        const flazhTemplates = await FlazhTemplate.find({}).lean();
        const matchingFlazh = flazhTemplates.filter(template => {
            return hasMatchingConditions(template.name, timeIdentifiers, volatilityIdentifiers);
        });

        return {
            conditions,
            atm: matchingAtm,
            flazh: matchingFlazh
        };
    } catch (error) {
        console.error('Error finding matching templates:', error);
        throw error;
    }
}

/**
 * Check if a template name contains matching condition identifiers
 * @param {string} templateName - Name of the template
 * @param {Array} timeIdentifiers - Time condition identifiers
 * @param {Array} volatilityIdentifiers - Volatility condition identifiers
 * @returns {boolean} True if matching
 */
function hasMatchingConditions(templateName, timeIdentifiers, volatilityIdentifiers) {
    // For templates with underscore naming format (e.g., ATM_EA_LOW)
    const templateParts = templateName.split('_');

    // If template has the expected format with parts separated by underscores
    if (templateParts.length >= 2) {
        // Check for time condition in any part of the template name
        const hasTimeMatch = timeIdentifiers.some(id =>
            templateParts.some(part => part.includes(id))
        );

        // Check for volatility condition in any part of the template name
        const hasVolatilityMatch = volatilityIdentifiers.some(id =>
            templateParts.some(part => part.includes(id))
        );

        // Both time and volatility should match
        return hasTimeMatch && hasVolatilityMatch;
    }

    // For other naming formats, use a more flexible approach
    // Check if template name contains any time identifier
    const hasTimeMatch = timeIdentifiers.some(id => templateName.includes(id));

    // Check if template name contains any volatility identifier
    const hasVolatilityMatch = volatilityIdentifiers.some(id => templateName.includes(id));

    // Both time and volatility conditions must match
    return hasTimeMatch && hasVolatilityMatch;
}

module.exports = {
    detectCurrentConditions,
    findMatchingTemplates,
    TIME_CONDITIONS,
    VOLATILITY_CONDITIONS
};
// C:\TradingDashboard\server\services\templateSelector.js

const AtmStrategy = require('../models/atmStrategy');
const FlazhInfinity = require('../models/flazhInfinity');

/**
 * Template Selector Service
 * Handles the selection of appropriate templates based on market conditions
 */

/**
 * Selects the best template based on current market conditions
 * @param {string} templateType - 'ATM' or 'Flazh'
 * @param {Object} marketConditions - Current market conditions
 * @returns {Promise<Object>} - The selected template
 */
const selectBestTemplate = async (templateType, marketConditions) => {
    const { session, volatility, dayOfWeek } = marketConditions;
    const Model = templateType.toUpperCase() === 'ATM' ? AtmStrategy : FlazhInfinity;

    console.log(`Selecting ${templateType} template for: Day=${dayOfWeek || 'Any'}, Session=${session}, Volatility=${volatility}`);

    // Try to find templates with progressively relaxed criteria
    let query = {};
    let template = null;

    // 1. First try: Exact match including day of week
    if (dayOfWeek) {
        query = {
            session,
            volatility,
            dayOfWeek
        };
        template = await Model.findOne(query);
        if (template) {
            console.log(`Found day-specific template: ${template.templateName}`);
            return template;
        }
    }

    // 2. Second try: Match session and volatility for any day
    query = {
        session,
        volatility,
        $or: [{ dayOfWeek: null }, { dayOfWeek: { $exists: false } }]
    };
    template = await Model.findOne(query);
    if (template) {
        console.log(`Found session+volatility template: ${template.templateName}`);
        return template;
    }

    // 3. Third try: Match session with medium volatility
    query = {
        session,
        volatility: 'Medium_Volatility',
        $or: [{ dayOfWeek: null }, { dayOfWeek: { $exists: false } }]
    };
    template = await Model.findOne(query);
    if (template) {
        console.log(`Found session with medium volatility template: ${template.templateName}`);
        return template;
    }

    // 4. Fourth try: Any template for this session
    query = {
        session,
        $or: [{ dayOfWeek: null }, { dayOfWeek: { $exists: false } }]
    };
    template = await Model.findOne(query);
    if (template) {
        console.log(`Found any template for session: ${template.templateName}`);
        return template;
    }

    // 5. Last resort: Any template at all
    template = await Model.findOne({});
    if (template) {
        console.log(`Found fallback template: ${template.templateName}`);
        return template;
    }

    console.log('No suitable template found');
    return null;
};

/**
 * Determines current market conditions based on time and market data
 * @param {Date} currentTime - Current timestamp
 * @param {Object} marketData - Current market data
 * @returns {Object} - Current market conditions
 */
const determineMarketConditions = (currentTime, marketData) => {
    // Get day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[currentTime.getDay()];

    // Skip weekends
    if (dayOfWeek === 'Sunday' || dayOfWeek === 'Saturday') {
        return { session: 'Closed', volatility: 'None', dayOfWeek: null };
    }

    // Determine trading session based on time
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    let session = 'Unknown_Session';

    // US Eastern Time trading sessions
    if (hour < 10 || (hour === 10 && minute < 30)) {
        session = 'Pre_Market';
    } else if ((hour === 10 && minute >= 30) || (hour === 11) || (hour === 12 && minute < 30)) {
        session = 'Late_Morning';
    } else if ((hour === 12 && minute >= 30) || (hour === 13) || (hour === 14 && minute < 30)) {
        session = 'Early_Afternoon';
    } else if ((hour === 14 && minute >= 30) || (hour === 15)) {
        session = 'Pre_Close';
    } else if (hour > 15) {
        session = 'After_Hours';
    }

    // Determine volatility based on market data
    // This is a simplified example - replace with your actual volatility calculation
    let volatility = 'Medium_Volatility';

    if (marketData && marketData.volatility) {
        const volatilityValue = marketData.volatility;

        if (volatilityValue < 0.5) {
            volatility = 'Low_Volatility';
        } else if (volatilityValue > 1.5) {
            volatility = 'High_Volatility';
        } else {
            volatility = 'Medium_Volatility';
        }
    }

    return {
        session,
        volatility,
        dayOfWeek
    };
};

/**
 * Gets the recommended template based on current market conditions
 * @param {string} templateType - 'ATM' or 'Flazh'
 * @param {Date} [currentTime] - Optional time override (defaults to now)
 * @param {Object} [marketData] - Optional market data override
 * @returns {Promise<Object>} - The recommended template
 */
const getRecommendedTemplate = async (templateType, currentTime, marketData) => {
    // Use provided time or current time
    const time = currentTime || new Date();

    // Use provided market data or get from service
    const marketDataToUse = marketData || await getMarketData();

    // Determine current market conditions
    const conditions = determineMarketConditions(time, marketDataToUse);

    // Select the best template based on conditions
    return await selectBestTemplate(templateType, conditions);
};

/**
 * Helper function to get market data
 * This should be replaced with your actual market data service
 * @returns {Promise<Object>} - Current market data
 */
const getMarketData = async () => {
    // Replace with actual market data service
    // This is just a placeholder
    return {
        volatility: 1.0,
        trend: 'neutral',
        volume: 'average'
    };
};

module.exports = {
    selectBestTemplate,
    determineMarketConditions,
    getRecommendedTemplate
};
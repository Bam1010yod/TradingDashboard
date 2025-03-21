/**
 * Prop Firm Service
 * Provides prop firm guidelines and trading restrictions using mock data
 * for ApexTraderFunding and TakeProfitTrader
 */

const mongoose = require('mongoose');

// Mock data for prop firms
const MOCK_PROP_FIRM_DATA = {
    APEX: {
        name: 'ApexTraderFunding',
        maxDailyLoss: 500,
        maxTotalDrawdown: 1000,
        newsRestrictions: {
            enabled: true,
            minutesBefore: 30,
            minutesAfter: 15
        },
        extractedRules: [
            {
                heading: "Daily Loss Limit Rule",
                text: "Traders must not exceed a daily loss of $500"
            },
            {
                heading: "Max Drawdown Rule",
                text: "Total account drawdown must not exceed $1000 or 10%"
            },
            {
                heading: "News Trading Restriction",
                text: "No trading 30 minutes before and 15 minutes after high-impact news"
            }
        ]
    },
    TPT: {
        name: 'TakeProfitTrader',
        maxDailyLoss: 400,
        maxTotalDrawdown: 800,
        newsRestrictions: {
            enabled: true,
            minutesBefore: 20,
            minutesAfter: 10
        },
        extractedRules: [
            {
                heading: "Daily Loss Limit Rule",
                text: "Traders must not exceed a daily loss of $400"
            },
            {
                heading: "Max Drawdown Rule",
                text: "Total account drawdown must not exceed $800 or 8%"
            },
            {
                heading: "News Trading Restriction",
                text: "No trading 20 minutes before and 10 minutes after high-impact news"
            }
        ]
    }
};

// Cache for prop firm rules
let propFirmRules = {
    lastUpdated: null,
    APEX: null,
    TPT: null
};

/**
 * Initialize the prop firm service
 */
const initialize = async () => {
    console.log('Initializing Prop Firm Service...');

    // Create MongoDB schema for prop firm rules if it doesn't exist yet
    try {
        const PropFirmRules = mongoose.model('PropFirmRules');
        console.log('PropFirmRules model already exists');
    } catch (error) {
        const propFirmRulesSchema = new mongoose.Schema({
            firm: { type: String, required: true },
            rules: { type: Object, required: true },
            maxDailyLoss: { type: Number },
            maxTotalDrawdown: { type: Number },
            newsRestrictions: {
                enabled: { type: Boolean, default: false },
                minutesBefore: { type: Number },
                minutesAfter: { type: Number }
            },
            lastUpdated: { type: Date, default: Date.now }
        });

        mongoose.model('PropFirmRules', propFirmRulesSchema);
        console.log('PropFirmRules model created');
    }

    // Use mock data instead of fetching
    await updatePropFirmRules();

    console.log('Prop Firm Service initialized');
    return true;
};

/**
 * Update prop firm rules using mock data
 */
const updatePropFirmRules = async () => {
    console.log('Updating prop firm rules (using mock data)...');

    try {
        // Use mock data
        const apexRules = MOCK_PROP_FIRM_DATA.APEX;
        const tptRules = MOCK_PROP_FIRM_DATA.TPT;

        // Update cache
        propFirmRules = {
            lastUpdated: new Date(),
            APEX: apexRules,
            TPT: tptRules
        };

        // Save to database
        await savePropFirmRules(MOCK_PROP_FIRM_DATA.APEX.name, apexRules);
        await savePropFirmRules(MOCK_PROP_FIRM_DATA.TPT.name, tptRules);

        console.log('Prop firm rules updated successfully');
        return true;
    } catch (error) {
        console.error('Error updating prop firm rules:', error);
        return false;
    }
};

/**
 * Save prop firm rules to the database
 * @param {string} firmName - Name of the prop firm
 * @param {Object} rules - Rules to save
 */
const savePropFirmRules = async (firmName, rules) => {
    if (!rules) return false;

    try {
        const PropFirmRules = mongoose.model('PropFirmRules');

        // Check if a record already exists
        const existingRecord = await PropFirmRules.findOne({ firm: firmName });

        if (existingRecord) {
            // Update existing record
            existingRecord.rules = rules;
            existingRecord.maxDailyLoss = rules.maxDailyLoss;
            existingRecord.maxTotalDrawdown = rules.maxTotalDrawdown;
            existingRecord.newsRestrictions = rules.newsRestrictions;
            existingRecord.lastUpdated = new Date();
            await existingRecord.save();
        } else {
            // Create new record
            const newRecord = new PropFirmRules({
                firm: firmName,
                rules: rules,
                maxDailyLoss: rules.maxDailyLoss,
                maxTotalDrawdown: rules.maxTotalDrawdown,
                newsRestrictions: rules.newsRestrictions,
                lastUpdated: new Date()
            });
            await newRecord.save();
        }

        console.log(`Rules saved for ${firmName}`);
        return true;
    } catch (error) {
        console.error(`Error saving rules for ${firmName}:`, error);
        return false;
    }
};

/**
 * Get the latest rules for a specific prop firm
 * @param {string} firmName - Name of the prop firm
 * @returns {Object} - Prop firm rules
 */
const getRules = (firmName) => {
    if (firmName === 'APEX' || firmName === 'ApexTraderFunding') {
        return propFirmRules.APEX;
    } else if (firmName === 'TPT' || firmName === 'TakeProfitTrader') {
        return propFirmRules.TPT;
    } else {
        return null;
    }
};

/**
 * Check if trading is allowed based on news restrictions
 * @param {string} firmName - Name of the prop firm
 * @param {Date} currentTime - Current time
 * @param {Array} newsEvents - Array of news events with times
 * @returns {Object} - Trading permission status
 */
const checkNewsRestrictions = (firmName, currentTime, newsEvents) => {
    const rules = getRules(firmName);

    if (!rules || !rules.newsRestrictions.enabled) {
        return { allowed: true };
    }

    // Check each news event
    for (const event of newsEvents) {
        const eventTime = new Date(event.time);

        // Calculate time differences in minutes
        const minutesUntilEvent = (eventTime - currentTime) / (1000 * 60);
        const minutesSinceEvent = (currentTime - eventTime) / (1000 * 60);

        // Check if we're in a restricted period
        if (minutesUntilEvent >= 0 && minutesUntilEvent <= rules.newsRestrictions.minutesBefore) {
            return {
                allowed: false,
                reason: `Trading restricted ${rules.newsRestrictions.minutesBefore} minutes before news event: ${event.title}`,
                event: event
            };
        }

        if (minutesSinceEvent >= 0 && minutesSinceEvent <= rules.newsRestrictions.minutesAfter) {
            return {
                allowed: false,
                reason: `Trading restricted ${rules.newsRestrictions.minutesAfter} minutes after news event: ${event.title}`,
                event: event
            };
        }
    }

    return { allowed: true };
};

/**
 * Check if a trade complies with prop firm rules
 * @param {string} firmName - Name of the prop firm
 * @param {Object} accountStats - Current account statistics
 * @returns {Object} - Compliance status
 */
const checkTradeCompliance = (firmName, accountStats) => {
    const rules = getRules(firmName);

    if (!rules) {
        return { compliant: true };
    }

    const violations = [];

    // Check daily loss limit
    if (rules.maxDailyLoss !== null && accountStats.dailyPnL < -rules.maxDailyLoss) {
        violations.push({
            rule: 'maxDailyLoss',
            limit: -rules.maxDailyLoss,
            current: accountStats.dailyPnL
        });
    }

    // Check total drawdown limit
    if (rules.maxTotalDrawdown !== null && accountStats.drawdown > rules.maxTotalDrawdown) {
        violations.push({
            rule: 'maxTotalDrawdown',
            limit: rules.maxTotalDrawdown,
            current: accountStats.drawdown
        });
    }

    return {
        compliant: violations.length === 0,
        violations: violations
    };
};

module.exports = {
    initialize,
    updatePropFirmRules,
    getRules,
    checkNewsRestrictions,
    checkTradeCompliance
};
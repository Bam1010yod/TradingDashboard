// C:\TradingDashboard\server\services\marketConditionsService.js

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Service for analyzing market conditions
 */
class MarketConditionsService {
    /**
     * Determine current trading session based on time
     * @param {string} timezone - User's timezone preference
     * @returns {Object} - Current session information
     */
    getCurrentSession(timezone = 'US_CENTRAL') {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...

        // Default to US session determination if in US timezone
        if (timezone.startsWith('US_')) {
            // Weekend check
            if (day === 0 || day === 6) {
                return {
                    currentSession: 'OVERNIGHT',
                    sessionDescription: 'Weekend (Market Closed)',
                    currentTime: now
                };
            }

            // Determine US session based on time
            // Times are in Central Time (CT) by default
            const timeInMinutes = (hour * 60) + minute;

            // Adjust for different US timezones
            let adjustment = 0;
            if (timezone === 'US_EASTERN') adjustment = -60; // 1 hour earlier
            if (timezone === 'US_MOUNTAIN') adjustment = 60; // 1 hour later  
            if (timezone === 'US_PACIFIC') adjustment = 120; // 2 hours later

            const adjustedTime = timeInMinutes + adjustment;

            // US market hours (adjusted for Central Time as base)
            if (adjustedTime >= 540 && adjustedTime < 600) { // 9:00 - 10:00 CT
                return {
                    currentSession: 'US_OPEN',
                    sessionDescription: 'US Market Opening',
                    currentTime: now
                };
            } else if (adjustedTime >= 600 && adjustedTime < 780) { // 10:00 - 13:00 CT
                return {
                    currentSession: 'US_MIDDAY',
                    sessionDescription: 'US Market Midday',
                    currentTime: now
                };
            } else if (adjustedTime >= 780 && adjustedTime < 960) { // 13:00 - 16:00 CT
                return {
                    currentSession: 'US_AFTERNOON',
                    sessionDescription: 'US Market Afternoon',
                    currentTime: now
                };
            } else {
                return {
                    currentSession: 'OVERNIGHT',
                    sessionDescription: 'US Market Closed',
                    currentTime: now
                };
            }
        } else if (timezone === 'ASIA') {
            // Asia session logic
            return {
                currentSession: 'ASIA',
                sessionDescription: 'Asian Trading Session',
                currentTime: now
            };
        } else if (timezone === 'EUROPE') {
            // Europe session logic
            return {
                currentSession: 'EUROPE',
                sessionDescription: 'European Trading Session',
                currentTime: now
            };
        } else {
            // Default fallback
            return {
                currentSession: 'US_MIDDAY', // Default to US midday
                sessionDescription: 'Default Session',
                currentTime: now
            };
        }
    }

    /**
     * Get market volatility from analysis data
     * @returns {Object} - Volatility information
     */
    getMarketVolatility() {
        try {
            // Path to volatility metrics file from NinjaTrader
            const metricsPath = process.env.VOLATILITY_METRICS_PATH || 'C:\\NinjaTraderData\\VolatilityMetrics.json';

            // Check if file exists
            if (!fs.existsSync(metricsPath)) {
                logger.warn(`Volatility metrics file not found at ${ metricsPath } `);
                return {
                    volatilityCategory: 'MEDIUM_VOLATILITY',
                    volatilityValue: 50,
                    volatilityDescription: 'Default Medium Volatility (no data file)'
                };
            }

            // Read and parse metrics file
            const metricsData = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));

            // Calculate volatility (simplified example)
            // This should be replaced with your actual volatility calculation
            let volatilityValue = 50; // Default medium

            if (metricsData.atr) {
                volatilityValue = metricsData.atr;
            } else if (metricsData.volatility) {
                volatilityValue = metricsData.volatility;
            }

            // Categorize volatility
            let volatilityCategory;
            let volatilityDescription;

            if (volatilityValue < 30) {
                volatilityCategory = 'LOW_VOLATILITY';
                volatilityDescription = 'Low Volatility Market Conditions';
            } else if (volatilityValue < 70) {
                volatilityCategory = 'MEDIUM_VOLATILITY';
                volatilityDescription = 'Medium Volatility Market Conditions';
            } else {
                volatilityCategory = 'HIGH_VOLATILITY';
                volatilityDescription = 'High Volatility Market Conditions';
            }

            return {
                volatilityCategory,
                volatilityValue,
                volatilityDescription
            };
        } catch (error) {
            logger.error(`Error determining market volatility: ${ error.message } `);
            // Default to medium volatility on error
            return {
                volatilityCategory: 'MEDIUM_VOLATILITY',
                volatilityValue: 50,
                volatilityDescription: 'Default Medium Volatility (error processing data)'
            };
        }
    }

    /**
     * Get current market conditions
     * @param {string} timezone - User's timezone preference
     * @returns {Object} - Current market conditions
     */
    getCurrentMarketConditions(timezone = 'US_CENTRAL') {
        try {
            // Get current session and volatility
            const sessionInfo = this.getCurrentSession(timezone);
            const volatilityInfo = this.getMarketVolatility();

            // Get parameter recommendations based on conditions
            const recommendations = this.getRecommendedParameters(
                sessionInfo.currentSession,
                volatilityInfo.volatilityCategory
            );

            // Combine all information
            return {
                ...sessionInfo,
                ...volatilityInfo,
                recommendations
            };
        } catch (error) {
            logger.error(`Error determining market conditions: ${ error.message } `);
            return {
                currentSession: 'UNKNOWN',
                sessionDescription: 'Error determining session',
                volatilityCategory: 'UNKNOWN',
                volatilityDescription: 'Error determining volatility',
                currentTime: new Date(),
                error: error.message
            };
        }
    }

    /**
     * Get recommended parameters for specific market conditions
     * @param {string} session - Trading session
     * @param {string} volatility - Market volatility
     * @returns {Object} - Recommended parameters
     */
    getRecommendedParameters(session = 'US_MIDDAY', volatility = 'MEDIUM_VOLATILITY') {
        try {
            // Parameter recommendations based on session and volatility
            // These should be loaded from your database or configuration

            // Default values
            let flazhParams = {
                FastPeriod: 21,
                FastRange: 3,
                MediumPeriod: 41,
                MediumRange: 4,
                SlowPeriod: 70,
                SlowRange: 5
            };

            let atmParams = {
                StopLoss: 21,
                Target: 42,
                AutoBreakEvenProfitTrigger: 21,
                AutoBreakEvenPlus: 10
            };

            // Custom values based on session and volatility
            // US Opening with High Volatility (example)
            if (session === 'US_OPEN' && volatility === 'HIGH_VOLATILITY') {
                flazhParams = {
                    FastPeriod: 13,
                    FastRange: 4,
                    MediumPeriod: 34,
                    MediumRange: 5,
                    SlowPeriod: 55,
                    SlowRange: 6
                };

                atmParams = {
                    StopLoss: 24,
                    Target: 36,
                    AutoBreakEvenProfitTrigger: 18,
                    AutoBreakEvenPlus: 8
                };
            }

            // US Midday with Medium Volatility (example)
            if (session === 'US_MIDDAY' && volatility === 'MEDIUM_VOLATILITY') {
                flazhParams = {
                    FastPeriod: 21,
                    FastRange: 3,
                    MediumPeriod: 41,
                    MediumRange: 4,
                    SlowPeriod: 70,
                    SlowRange: 5
                };

                atmParams = {
                    StopLoss: 21,
                    Target: 42,
                    AutoBreakEvenProfitTrigger: 21,
                    AutoBreakEvenPlus: 10
                };
            }

            // Return both parameter sets
            return {
                flazhParams,
                atmParams
            };
        } catch (error) {
            logger.error(`Error getting recommended parameters: ${ error.message } `);
            // Return default parameters on error
            return {
                flazhParams: {
                    FastPeriod: 21,
                    FastRange: 3,
                    MediumPeriod: 41,
                    MediumRange: 4,
                    SlowPeriod: 70,
                    SlowRange: 5
                },
                atmParams: {
                    StopLoss: 21,
                    Target: 42,
                    AutoBreakEvenProfitTrigger: 21,
                    AutoBreakEvenPlus: 10
                }
            };
        }
    }

    /**
     * Analyze current market conditions
     * @param {Object} marketData - Market data object (optional)
     * @returns {Object} - Analyzed market conditions
     */
    analyzeMarketConditions(marketData = null) {
        try {
            // Get current market conditions (session and volatility)
            const conditions = this.getCurrentMarketConditions();

            // Map session to template format
            let session;
            switch (conditions.currentSession) {
                case 'US_OPEN':
                    session = 'Pre_Market';
                    break;
                case 'US_MIDDAY':
                    session = 'Late_Morning';
                    break;
                case 'US_AFTERNOON':
                    session = 'Early_Afternoon';
                    break;
                case 'OVERNIGHT':
                    session = 'After_Hours';
                    break;
                case 'ASIA':
                case 'EUROPE':
                    session = 'Overnight';
                    break;
                default:
                    session = 'Unknown_Session';
            }

            // Map volatility to template format
            let volatility;
            switch (conditions.volatilityCategory) {
                case 'LOW_VOLATILITY':
                    volatility = 'Low_Volatility';
                    break;
                case 'HIGH_VOLATILITY':
                    volatility = 'High_Volatility';
                    break;
                default:
                    volatility = 'Medium_Volatility';
            }

            // Get day of week
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = days[new Date().getDay()];

            // Return formatted market conditions
            return {
                session,
                volatility,
                dayOfWeek,
                timestamp: new Date(),
                rawConditions: conditions
            };
        } catch (error) {
            logger.error(`Error analyzing market conditions: ${ error.message } `);
            return {
                session: 'Unknown_Session',
                volatility: 'Medium_Volatility',
                dayOfWeek: null,
                timestamp: new Date(),
                error: error.message
            };
        }
    }
}

module.exports = new MarketConditionsService();
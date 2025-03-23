// Full path: C:\TradingDashboard\server\services\marketConditionsService.js

const logger = require('../utils/logger');
const FlazhTemplate = require('../models/flazhTemplate');
const AtmTemplate = require('../models/atmTemplate');

/**
 * Service for handling market conditions and parameter recommendations
 */
class MarketConditionsService {
    /**
     * Get current market conditions based on time and volatility
     * @returns {Promise<Object>} Current market conditions and recommendations
     */
    async getCurrentConditions() {
        try {
            // Determine current session based on time
            const now = new Date();
            const hour = now.getUTCHours();

            // Simple mapping of hours to sessions (adjust as needed for your timezone)
            let currentSession;
            if (hour >= 1 && hour < 8) {
                currentSession = "ASIA";
            } else if (hour >= 8 && hour < 13) {
                currentSession = "EUROPE";
            } else if (hour >= 13 && hour < 15) {
                currentSession = "US_OPEN";
            } else if (hour >= 15 && hour < 18) {
                currentSession = "US_MIDDAY";
            } else if (hour >= 18 && hour < 21) {
                currentSession = "US_AFTERNOON";
            } else {
                currentSession = "OVERNIGHT";
            }

            // For demo purposes, setting a fixed volatility
            // In a real system, this would be determined from market data
            const volatilityCategory = "MEDIUM_VOLATILITY";

            // Get recommendations based on current conditions
            const recommendations = await this.getParametersForConditions(currentSession, volatilityCategory);

            return {
                currentSession,
                volatilityCategory,
                currentTime: now.toISOString(),
                recommendations
            };
        } catch (error) {
            logger.error(`Error determining current market conditions: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get parameters for specific market conditions
     * @param {string} session - Market session (e.g., "US_OPEN")
     * @param {string} volatility - Volatility level (e.g., "MEDIUM_VOLATILITY")
     * @returns {Promise<Object>} Parameters for Flazh and ATM
     */
    async getParametersForConditions(session, volatility) {
        try {
            logger.info(`Finding parameters for session: ${session}, volatility: ${volatility}`);

            // Get session information
            const sessionInfo = this.getSessionInfo(session);

            // Format the parameters to return
            // These are simplified parameters for the UI display
            // In a real implementation, these would be pulled from database
            const flazhParams = {
                FastPeriod: 21,
                FastRange: 3,
                MediumPeriod: 41,
                MediumRange: 4,
                SlowPeriod: 70,
                SlowRange: 5
            };

            const atmParams = {
                StopLoss: 21,
                Target: 42,
                AutoBreakEvenProfitTrigger: 21,
                AutoBreakEvenPlus: 10
            };

            return {
                success: true,
                sessionInfo,
                flazhParams,
                atmParams
            };
        } catch (error) {
            logger.error(`Error getting parameters for conditions: ${error.message}`);
            throw new Error(`Error loading parameters for selected session and volatility: ${error.message}`);
        }
    }

    /**
     * Get session information
     * @param {string} session - Session code
     * @returns {Object} Session information
     */
    getSessionInfo(session) {
        const sessionMap = {
            "ASIA": { name: "Asian Session", startTime: "21:00", endTime: "04:00" },
            "EUROPE": { name: "European Session", startTime: "03:00", endTime: "08:00" },
            "US_OPEN": { name: "US Opening", startTime: "08:00", endTime: "10:00" },
            "US_MIDDAY": { name: "US Midday", startTime: "10:00", endTime: "13:00" },
            "US_AFTERNOON": { name: "US Afternoon", startTime: "13:00", endTime: "16:00" },
            "OVERNIGHT": { name: "Overnight", startTime: "16:00", endTime: "21:00" }
        };

        return sessionMap[session] || { name: "Unknown Session", startTime: "00:00", endTime: "00:00" };
    }
}

module.exports = new MarketConditionsService();
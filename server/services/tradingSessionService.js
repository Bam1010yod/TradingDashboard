// File path: C:\TradingDashboard\server\services\tradingSessionService.js

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Import the model
const SessionAnalysis = require('../models/sessionAnalysis');

/**
 * Trading Session Service
 * Focused on US market sessions for NQ futures in Central Time
 */
class TradingSessionService {
    constructor() {
        this.dataPath = 'C:\\NinjaTraderData\\VolatilityMetrics.json';
        this.sessions = {
            preMarket: { start: '7:00', end: '8:30' },    // CT times
            regularHours: { start: '8:30', end: '15:00' },
            postMarket: { start: '15:00', end: '16:00' },
            overnight: { start: '16:00', end: '7:00' }
        };
    }

    /**
     * Determine current trading session based on time
     * @returns {string} Current session name
     */
    getCurrentSession() {
        const now = new Date();
        const currentTime = now.getHours() + ':' + now.getMinutes();

        for (const [session, times] of Object.entries(this.sessions)) {
            if (this._isTimeInRange(currentTime, times.start, times.end)) {
                return session;
            }
        }

        return 'overnight';
    }

    /**
     * Check if time is within a specified range
     * @param {string} time - Current time (HH:MM)
     * @param {string} start - Start time (HH:MM)
     * @param {string} end - End time (HH:MM)
     * @returns {boolean}
     */
    _isTimeInRange(time, start, end) {
        // Convert to minutes for easier comparison
        const timeMinutes = this._convertToMinutes(time);
        const startMinutes = this._convertToMinutes(start);
        const endMinutes = this._convertToMinutes(end);

        // Handle overnight sessions
        if (startMinutes > endMinutes) {
            return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
        }

        return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
    }

    /**
     * Convert time to minutes
     * @param {string} time - Time in HH:MM format
     * @returns {number} Time in minutes
     */
    _convertToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Analyze market data for the specified session
     * @param {string} session - Session name
     * @returns {Promise<Object>} Session analysis
     */
    async analyzeSession(session = null) {
        try {
            const targetSession = session || this.getCurrentSession();

            // Get market data
            const marketData = await this._getMarketData();

            if (!marketData) {
                // No data available, create default analysis
                const defaultAnalysis = {
                    session: targetSession,
                    date: new Date(),
                    averageVolatility: 0,
                    priceRange: { high: 0, low: 0, range: 0 },
                    momentum: 0,
                    volumeProfile: { total: 0, distribution: {} }
                };

                // Save analysis to database
                await this._saveAnalysis(defaultAnalysis);

                return defaultAnalysis;
            }

            // Check if data timestamp belongs to the requested session
            let belongsToSession = false;
            if (marketData.timestamp) {
                const dataTime = new Date(marketData.timestamp);
                const hours = dataTime.getHours();
                const minutes = dataTime.getMinutes();
                const timeStr = `${hours}:${minutes}`;

                const sessionTimes = this.sessions[targetSession];
                belongsToSession = this._isTimeInRange(timeStr, sessionTimes.start, sessionTimes.end);
            }

            // Convert volatility level to numeric score if needed
            let volatilityScore = marketData.volatilityScore || 0;
            if (marketData.volatilityLevel && !volatilityScore) {
                switch (marketData.volatilityLevel) {
                    case 'HIGH':
                        volatilityScore = 5.0;
                        break;
                    case 'MEDIUM':
                        volatilityScore = 3.0;
                        break;
                    case 'LOW':
                        volatilityScore = 1.0;
                        break;
                    default:
                        volatilityScore = 3.0;
                }
            }

            // Create analysis from market data
            const analysis = {
                session: targetSession,
                date: new Date(),
                averageVolatility: volatilityScore,
                priceRange: {
                    high: 0, // Not available in the data
                    low: 0,  // Not available in the data
                    range: marketData.overnightRange || 0
                },
                momentum: 0, // Not available in the data
                volumeProfile: {
                    total: 0, // Not available in the data
                    distribution: {}
                }
            };

            // Save analysis to database
            await this._saveAnalysis(analysis);

            return analysis;
        } catch (error) {
            console.error('Error analyzing session:', error);
            throw error;
        }
    }

    /**
     * Get recommended parameters based on session analysis
     * @param {string} session - Session name
     * @returns {Promise<Object>} Recommended parameters
     */
    async getRecommendedParameters(session = null) {
        try {
            const targetSession = session || this.getCurrentSession();

            // Get latest analysis for the session
            const analysis = await SessionAnalysis.findOne({
                session: targetSession
            }).sort({ date: -1 }).limit(1);

            if (!analysis) {
                // If no analysis exists, create one first
                const newAnalysis = await this.analyzeSession(targetSession);

                // Generate recommendations based on new analysis
                return {
                    session: targetSession,
                    flazh: this._getRecommendedFlazhSettings(newAnalysis),
                    atm: this._getRecommendedAtmSettings(newAnalysis)
                };
            }

            // Generate recommendations based on existing analysis
            const recommendations = {
                session: targetSession,
                flazh: this._getRecommendedFlazhSettings(analysis),
                atm: this._getRecommendedAtmSettings(analysis)
            };

            return recommendations;
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }

    /**
     * Get market data from exported file
     * @returns {Promise<Object>} Market data
     */
    async _getMarketData() {
        return new Promise((resolve, reject) => {
            try {
                // Check if file exists
                if (!fs.existsSync(this.dataPath)) {
                    console.warn(`Market data file not found: ${this.dataPath}`);
                    resolve(null);
                    return;
                }

                // Read file synchronously to simplify error handling
                const data = fs.readFileSync(this.dataPath, 'utf8');

                if (!data || data.length === 0) {
                    console.warn('Market data file is empty');
                    resolve(null);
                    return;
                }

                // Parse JSON data
                const marketData = JSON.parse(data);
                resolve(marketData);
            } catch (error) {
                console.error('Error reading market data:', error);
                // Don't reject, just return null to allow the service to continue
                resolve(null);
            }
        });
    }

    /**
     * Save analysis to database
     * @param {Object} analysis - Session analysis
     * @returns {Promise} Database save operation
     */
    async _saveAnalysis(analysis) {
        try {
            const sessionAnalysis = new SessionAnalysis(analysis);
            return sessionAnalysis.save();
        } catch (error) {
            console.error('Error saving session analysis:', error);
            throw error;
        }
    }

    /**
     * Get recommended Flazh settings based on analysis
     * @param {Object} analysis - Session analysis
     * @returns {Object} Recommended Flazh settings
     */
    _getRecommendedFlazhSettings(analysis) {
        // Get volatility value
        const volatility = analysis.averageVolatility || 0;

        // Default settings for NQ futures
        const settings = {
            barNumber: 21,
            barsLookBack: 5,
            devFactor: 2.0,
            secondsLookback: 5,
            countMinBars: 3,
            useFilterTrend: true,
            useFilterVol: true,
            useZigZagSmooth: false
        };

        // Adjust based on volatility
        if (volatility >= 4.0) {
            // High volatility
            settings.devFactor = 2.5;
            settings.barsLookBack = 7;
            settings.barNumber = 34;
        } else if (volatility >= 2.0) {
            // Medium volatility
            settings.devFactor = 2.0;
            settings.barsLookBack = 5;
            settings.barNumber = 21;
        } else {
            // Low volatility
            settings.devFactor = 1.6;
            settings.barsLookBack = 3;
            settings.barNumber = 13;
        }

        return settings;
    }

    /**
     * Get recommended ATM settings based on analysis
     * @param {Object} analysis - Session analysis
     * @returns {Object} Recommended ATM settings
     */
    _getRecommendedAtmSettings(analysis) {
        // Get volatility and range values
        const volatility = analysis.averageVolatility || 0;
        const range = analysis.priceRange?.range || 0;

        // Default settings for NQ futures
        const settings = {
            stopLoss: 10,
            target1: 15,
            target2: 30,
            breakEven: 10,
            trailTrigger: 15,
            trailStep: 5
        };

        // Adjust based on volatility
        if (volatility >= 4.0) {
            // High volatility
            settings.stopLoss = 15;
            settings.target1 = 20;
            settings.target2 = 40;
            settings.breakEven = 15;
            settings.trailTrigger = 20;
            settings.trailStep = 8;
        } else if (volatility >= 2.0) {
            // Medium volatility
            settings.stopLoss = 10;
            settings.target1 = 15;
            settings.target2 = 30;
            settings.breakEven = 10;
            settings.trailTrigger = 15;
            settings.trailStep = 5;
        } else {
            // Low volatility - base settings for low volatility
            settings.stopLoss = 7;
            settings.target1 = 10;
            settings.target2 = 20;
            settings.breakEven = 5;
            settings.trailTrigger = 10;
            settings.trailStep = 3;
        }

        // Only adjust if range is significant, otherwise use base settings
        if (range >= 1.0) {
            // Meaningful range adjustment
            const rangeFactor = Math.max(0.5, Math.min(range / 10, 2.0));
            settings.stopLoss = Math.max(3, Math.round(settings.stopLoss * rangeFactor));
            settings.target1 = Math.max(5, Math.round(settings.target1 * rangeFactor));
            settings.target2 = Math.max(10, Math.round(settings.target2 * rangeFactor));
        }

        // Final safety check - ensure minimum values
        settings.stopLoss = Math.max(3, settings.stopLoss);
        settings.target1 = Math.max(5, settings.target1);
        settings.target2 = Math.max(10, settings.target2);

        return settings;
    }
}

module.exports = new TradingSessionService();
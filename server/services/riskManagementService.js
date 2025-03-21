/**
 * Risk Management Service
 * Provides real-time risk metrics for trading
 */

const RiskProfile = require('../models/riskProfile');
const mongoose = require('mongoose');

class RiskManagementService {
    /**
     * Initialize the risk management service
     * @returns {Promise<boolean>} - Initialization success
     */
    async initialize() {
        console.log('Risk Management Service initialized');
        return true;
    }

    /**
     * Create a new risk profile
     * @param {Object} profileData - Risk profile data
     * @returns {Promise<Object>} - Created risk profile
     */
    async createRiskProfile(profileData) {
        try {
            const riskProfile = new RiskProfile(profileData);
            const savedProfile = await riskProfile.save();
            return savedProfile;
        } catch (error) {
            console.error('Error creating risk profile:', error);
            throw error;
        }
    }

    /**
     * Get a risk profile by ID
     * @param {string} id - Risk profile ID
     * @returns {Promise<Object>} - Risk profile data
     */
    async getRiskProfile(id) {
        try {
            const profile = await RiskProfile.findById(id);
            if (!profile) {
                throw new Error('Risk profile not found');
            }
            return profile;
        } catch (error) {
            console.error('Error getting risk profile:', error);
            throw error;
        }
    }

    /**
     * Get all risk profiles
     * @returns {Promise<Array>} - Array of risk profiles
     */
    async getAllRiskProfiles() {
        try {
            const profiles = await RiskProfile.find({}).sort({ createdAt: -1 });
            return profiles;
        } catch (error) {
            console.error('Error getting all risk profiles:', error);
            throw error;
        }
    }

    /**
     * Update a risk profile
     * @param {string} id - Risk profile ID
     * @param {Object} updateData - Updated profile data
     * @returns {Promise<Object>} - Updated risk profile
     */
    async updateRiskProfile(id, updateData) {
        try {
            // Add updated timestamp
            updateData.updatedAt = new Date();

            const updatedProfile = await RiskProfile.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedProfile) {
                throw new Error('Risk profile not found');
            }

            return updatedProfile;
        } catch (error) {
            console.error('Error updating risk profile:', error);
            throw error;
        }
    }

    /**
     * Delete a risk profile
     * @param {string} id - Risk profile ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteRiskProfile(id) {
        try {
            const result = await RiskProfile.findByIdAndDelete(id);
            return !!result;
        } catch (error) {
            console.error('Error deleting risk profile:', error);
            throw error;
        }
    }

    /**
     * Calculate current risk metrics based on active trades and account status
     * @param {string} profileId - Risk profile ID to use for calculations
     * @returns {Promise<Object>} - Risk metrics
     */
    async calculateRiskMetrics(profileId) {
        try {
            // Get the risk profile
            const profile = await this.getRiskProfile(profileId);

            // For demonstration purposes, create sample current account stats
            // In a real implementation, you would get this data from your trading system
            const currentAccountStats = await this._getCurrentAccountStats();

            // Calculate risk metrics
            const riskMetrics = {
                timestamp: new Date(),
                accountValue: currentAccountStats.currentBalance,

                // Daily metrics
                dailyPnL: currentAccountStats.dailyPnL,
                dailyPnLPercent: (currentAccountStats.dailyPnL / profile.accountSizeUSD) * 100,
                dailyLossLimitPercent: (currentAccountStats.dailyPnL / profile.maxDailyLoss) * 100,

                // Drawdown metrics
                currentDrawdown: currentAccountStats.currentDrawdown,
                currentDrawdownPercent: (currentAccountStats.currentDrawdown / profile.accountSizeUSD) * 100,
                maxAllowedDrawdown: profile.propFirmSettings.maxTotalDrawdownPercent * profile.accountSizeUSD / 100,
                drawdownLimitPercent: (currentAccountStats.currentDrawdown /
                    (profile.propFirmSettings.maxTotalDrawdownPercent * profile.accountSizeUSD / 100)) * 100,

                // Position sizing
                currentPositionSize: currentAccountStats.currentPositionSize,
                maxPositionSize: profile.maxPositionSize,
                positionSizePercent: (currentAccountStats.currentPositionSize / profile.maxPositionSize) * 100,

                // Exposure
                currentExposure: currentAccountStats.openPositionsValue,
                exposurePercent: (currentAccountStats.openPositionsValue / profile.accountSizeUSD) * 100,

                // Alerts
                alerts: this._generateAlerts(profile, currentAccountStats)
            };

            return riskMetrics;
        } catch (error) {
            console.error('Error calculating risk metrics:', error);
            throw error;
        }
    }

    /**
     * Get dashboard data with all current risk information
     * @returns {Promise<Object>} - Dashboard data
     */
    async getDashboardData() {
        try {
            // Get active risk profile
            const activeProfile = await RiskProfile.findOne({ isActive: true });

            if (!activeProfile) {
                throw new Error('No active risk profile found');
            }

            // Calculate current risk metrics
            const riskMetrics = await this.calculateRiskMetrics(activeProfile._id);

            // Get recent trade history
            const tradeHistory = await this._getRecentTradeHistory();

            // Generate risk visualization data
            const visualizationData = await this._generateVisualizationData(activeProfile, riskMetrics);

            return {
                timestamp: new Date(),
                profileName: activeProfile.name,
                profileId: activeProfile._id,
                riskMetrics: riskMetrics,
                tradeHistory: tradeHistory,
                visualizationData: visualizationData
            };
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            throw error;
        }
    }

    /**
     * Check if any prop firm rules are being violated
     * @param {string} profileId - Risk profile ID
     * @returns {Promise<Object>} - Violation status
     */
    async checkPropFirmRuleViolations(profileId) {
        try {
            // Get the risk profile
            const profile = await this.getRiskProfile(profileId);

            // Get current account stats
            const currentStats = await this._getCurrentAccountStats();

            // Check for violations
            const violations = {
                hasViolations: false,
                violations: []
            };

            // Check daily loss limit
            if (currentStats.dailyPnL < 0 && Math.abs(currentStats.dailyPnL) > profile.maxDailyLoss) {
                violations.hasViolations = true;
                violations.violations.push({
                    type: 'DAILY_LOSS_EXCEEDED',
                    limit: profile.maxDailyLoss,
                    current: Math.abs(currentStats.dailyPnL),
                    message: 'Daily loss limit exceeded'
                });
            }

            // Check max drawdown
            if (currentStats.currentDrawdown > (profile.propFirmSettings.maxTotalDrawdownPercent * profile.accountSizeUSD / 100)) {
                violations.hasViolations = true;
                violations.violations.push({
                    type: 'MAX_DRAWDOWN_EXCEEDED',
                    limit: profile.propFirmSettings.maxTotalDrawdownPercent,
                    current: (currentStats.currentDrawdown / profile.accountSizeUSD) * 100,
                    message: 'Maximum account drawdown exceeded'
                });
            }

            // Check position size
            if (currentStats.currentPositionSize > profile.maxPositionSize) {
                violations.hasViolations = true;
                violations.violations.push({
                    type: 'POSITION_SIZE_EXCEEDED',
                    limit: profile.maxPositionSize,
                    current: currentStats.currentPositionSize,
                    message: 'Maximum position size exceeded'
                });
            }

            return violations;
        } catch (error) {
            console.error('Error checking prop firm rule violations:', error);
            throw error;
        }
    }

    // Private helper methods

    /**
     * Get current account statistics
     * @returns {Promise<Object>} - Account statistics
     * @private
     */
    async _getCurrentAccountStats() {
        // In a real implementation, this would fetch real-time data from your trading platform
        // This is just sample data for demonstration
        return {
            currentBalance: 10000,
            startingBalance: 10000,
            dailyPnL: -150,
            currentDrawdown: 200,
            highWaterMark: 10200,
            openPositions: 1,
            openPositionsValue: 2000,
            currentPositionSize: 2,  // Number of contracts
            consecutiveLossDays: 1
        };
    }

    /**
     * Get recent trade history
     * @returns {Promise<Array>} - Recent trades
     * @private
     */
    async _getRecentTradeHistory() {
        // In a real implementation, this would fetch data from your trade journal database
        // This is just sample data for demonstration
        return [
            {
                date: new Date(Date.now() - 1000 * 60 * 60),
                instrument: 'ES',
                direction: 'LONG',
                quantity: 1,
                entryPrice: 4550,
                exitPrice: 4545,
                pnl: -250
            },
            {
                date: new Date(Date.now() - 1000 * 60 * 60 * 2),
                instrument: 'ES',
                direction: 'SHORT',
                quantity: 1,
                entryPrice: 4560,
                exitPrice: 4555,
                pnl: 250
            },
            {
                date: new Date(Date.now() - 1000 * 60 * 60 * 3),
                instrument: 'NQ',
                direction: 'LONG',
                quantity: 1,
                entryPrice: 15600,
                exitPrice: 15650,
                pnl: 200
            }
        ];
    }

    /**
     * Generate alerts based on current account status
     * @param {Object} profile - Risk profile
     * @param {Object} accountStats - Current account statistics
     * @returns {Array} - Generated alerts
     * @private
     */
    _generateAlerts(profile, accountStats) {
        const alerts = [];

        // Check daily loss approaching limit
        const dailyLossPercent = (Math.abs(accountStats.dailyPnL) / profile.maxDailyLoss) * 100;
        if (accountStats.dailyPnL < 0 && dailyLossPercent >= profile.alertThresholds.dailyLossWarningPercent) {
            alerts.push({
                type: 'DAILY_LOSS_WARNING',
                severity: 'HIGH',
                message: `Daily loss at ${dailyLossPercent.toFixed(1)}% of max allowed`,
                timestamp: new Date()
            });
        }

        // Check drawdown approaching limit
        const drawdownPercent = (accountStats.currentDrawdown /
            (profile.propFirmSettings.maxTotalDrawdownPercent * profile.accountSizeUSD / 100)) * 100;
        if (drawdownPercent >= profile.alertThresholds.totalDrawdownWarningPercent) {
            alerts.push({
                type: 'DRAWDOWN_WARNING',
                severity: 'HIGH',
                message: `Total drawdown at ${drawdownPercent.toFixed(1)}% of max allowed`,
                timestamp: new Date()
            });
        }

        // Check position size
        if (accountStats.currentPositionSize >= profile.maxPositionSize * 0.8) {
            alerts.push({
                type: 'POSITION_SIZE_WARNING',
                severity: 'MEDIUM',
                message: `Position size approaching maximum allowed`,
                timestamp: new Date()
            });
        }

        return alerts;
    }

    /**
     * Generate data for risk visualizations
     * @param {Object} profile - Risk profile
     * @param {Object} metrics - Current risk metrics
     * @returns {Promise<Object>} - Visualization data
     * @private
     */
    async _generateVisualizationData(profile, metrics) {
        // Generate sample data for risk visualizations

        // Daily P&L history (last 7 days)
        const dailyPnLHistory = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            dailyPnLHistory.push({
                date: date,
                pnl: Math.random() * 400 - 200 // Random value between -200 and 200
            });
        }

        // Drawdown chart data
        const drawdownHistory = [];
        let balance = profile.accountSizeUSD;
        let highWaterMark = balance;

        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            // Random daily change
            balance += Math.random() * 200 - 100;

            if (balance > highWaterMark) {
                highWaterMark = balance;
            }

            const drawdown = highWaterMark - balance;
            const drawdownPercent = (drawdown / highWaterMark) * 100;

            drawdownHistory.push({
                date: date,
                balance: balance,
                drawdownAmount: drawdown,
                drawdownPercent: drawdownPercent
            });
        }

        // Risk exposure over time
        const exposureHistory = [];
        for (let i = 10; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            exposureHistory.push({
                date: date,
                exposure: Math.random() * profile.accountSizeUSD * 0.4 // Random exposure up to 40% of account
            });
        }

        return {
            dailyPnLHistory: dailyPnLHistory,
            drawdownHistory: drawdownHistory,
            exposureHistory: exposureHistory,

            // Current risk distribution (pie chart data)
            riskDistribution: [
                { category: 'Available', value: profile.accountSizeUSD - metrics.currentExposure },
                { category: 'At Risk', value: metrics.currentExposure }
            ],

            // Risk limits visualization (gauge chart data)
            riskGauges: {
                dailyLoss: {
                    current: Math.abs(metrics.dailyPnL),
                    max: profile.maxDailyLoss,
                    percent: metrics.dailyLossLimitPercent
                },
                drawdown: {
                    current: metrics.currentDrawdown,
                    max: metrics.maxAllowedDrawdown,
                    percent: metrics.drawdownLimitPercent
                },
                positionSize: {
                    current: metrics.currentPositionSize,
                    max: profile.maxPositionSize,
                    percent: metrics.positionSizePercent
                }
            }
        };
    }
}

module.exports = new RiskManagementService();
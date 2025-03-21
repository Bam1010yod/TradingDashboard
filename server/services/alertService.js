/**
 * Alert Service
 * Manages system alerts and notifications
 */

const Alert = require('../models/alert');
const mongoose = require('mongoose');
const propFirmService = require('./propFirmService');
const riskManagementService = require('./riskManagementService');

class AlertService {
    /**
     * Initialize the alert service
     * @returns {Promise<boolean>} - Initialization success
     */
    async initialize() {
        console.log('Alert Service initialized');
        return true;
    }

    /**
     * Create a new alert configuration
     * @param {Object} alertData - Alert configuration data
     * @returns {Promise<Object>} - Created alert
     */
    async createAlert(alertData) {
        try {
            const alert = new Alert(alertData);
            return await alert.save();
        } catch (error) {
            console.error('Error creating alert:', error);
            throw error;
        }
    }

    /**
     * Get a single alert by ID
     * @param {string} id - Alert ID
     * @returns {Promise<Object>} - Alert data
     */
    async getAlert(id) {
        try {
            const alert = await Alert.findById(id);

            if (!alert) {
                throw new Error('Alert not found');
            }

            return alert;
        } catch (error) {
            console.error('Error getting alert:', error);
            throw error;
        }
    }

    /**
     * Get all alerts with optional filtering
     * @param {Object} filters - Filters to apply
     * @returns {Promise<Array>} - Array of alerts
     */
    async getAlerts(filters = {}) {
        try {
            const query = {};

            if (filters.type) query.type = filters.type;
            if (filters.active !== undefined) query.active = filters.active;

            return await Alert.find(query).sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error getting alerts:', error);
            throw error;
        }
    }

    /**
     * Update an alert configuration
     * @param {string} id - Alert ID
     * @param {Object} updateData - Updated alert data
     * @returns {Promise<Object>} - Updated alert
     */
    async updateAlert(id, updateData) {
        try {
            const updatedAlert = await Alert.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedAlert) {
                throw new Error('Alert not found');
            }

            return updatedAlert;
        } catch (error) {
            console.error('Error updating alert:', error);
            throw error;
        }
    }

    /**
     * Delete an alert
     * @param {string} id - Alert ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteAlert(id) {
        try {
            const result = await Alert.findByIdAndDelete(id);
            return !!result;
        } catch (error) {
            console.error('Error deleting alert:', error);
            throw error;
        }
    }

    /**
     * Get alert history
     * @param {Object} filters - Filters to apply
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} - Alert history with pagination
     */
    async getAlertHistory(filters = {}, pagination = { page: 1, limit: 20 }) {
        try {
            // Build pipeline stages for aggregation
            const pipeline = [];

            // Match stage for filtering alerts
            const matchStage = {};
            if (filters.type) matchStage.type = filters.type;

            pipeline.push({ $match: matchStage });

            // Unwind the history array to get individual alerts
            pipeline.push({ $unwind: '$history' });

            // Match stage for filtering history entries
            const historyMatch = {};

            if (filters.acknowledged !== undefined) {
                historyMatch['history.acknowledged'] = filters.acknowledged;
            }

            if (filters.startDate || filters.endDate) {
                historyMatch['history.triggeredAt'] = {};
                if (filters.startDate) historyMatch['history.triggeredAt'].$gte = new Date(filters.startDate);
                if (filters.endDate) historyMatch['history.triggeredAt'].$lte = new Date(filters.endDate);
            }

            if (Object.keys(historyMatch).length > 0) {
                pipeline.push({ $match: historyMatch });
            }

            // Sort by trigger date (most recent first)
            pipeline.push({ $sort: { 'history.triggeredAt': -1 } });

            // Skip and limit for pagination
            const page = pagination.page || 1;
            const limit = pagination.limit || 20;
            const skip = (page - 1) * limit;

            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: limit });

            // Project to format output
            pipeline.push({
                $project: {
                    _id: 1,
                    name: 1,
                    type: 1,
                    history: 1
                }
            });

            // Get total count (for pagination)
            const countPipeline = [...pipeline];
            // Remove skip, limit and project stages
            countPipeline.splice(-3, 3);
            // Add count stage
            countPipeline.push({ $count: 'total' });

            // Execute queries
            const history = await Alert.aggregate(pipeline);
            const countResult = await Alert.aggregate(countPipeline);

            const total = countResult.length > 0 ? countResult[0].total : 0;

            return {
                history,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting alert history:', error);
            throw error;
        }
    }

    /**
     * Acknowledge an alert
     * @param {string} alertId - Alert ID
     * @param {string} historyId - Alert history entry ID
     * @returns {Promise<Object>} - Updated alert
     */
    async acknowledgeAlert(alertId, historyId) {
        try {
            const alert = await Alert.findById(alertId);

            if (!alert) {
                throw new Error('Alert not found');
            }

            const historyEntry = alert.history.id(historyId);

            if (!historyEntry) {
                throw new Error('Alert history entry not found');
            }

            historyEntry.acknowledged = true;
            historyEntry.acknowledgedAt = new Date();

            await alert.save();

            return alert;
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            throw error;
        }
    }

    /**
     * Check for prop firm rule violations and trigger alerts
     * @returns {Promise<Array>} - Triggered alerts
     */
    async checkPropFirmAlerts() {
        try {
            // Get active prop firm alerts
            const propFirmAlerts = await Alert.find({
                type: 'PROP_FIRM_LIMIT',
                active: true
            });

            if (propFirmAlerts.length === 0) {
                return [];
            }

            // Get current risk profile
            const activeProfile = await riskManagementService.getDashboardData()
                .then(data => data.profileId)
                .catch(() => null);

            if (!activeProfile) {
                return [];
            }

            // Check for violations - using a simulated function for testing
            const violations = await this._getSimulatedPropFirmViolations();

            const triggeredAlerts = [];

            for (const alert of propFirmAlerts) {
                // Check each alert condition against violations
                let isTriggered = false;
                let message = '';
                let value = 0;
                let threshold = 0;

                // Check daily loss limit
                if (alert.conditions.maxDailyLossPercent && violations.dailyLoss && violations.dailyLoss.isViolated) {
                    const dailyLossPercent = violations.dailyLoss.currentPercent;

                    if (dailyLossPercent >= alert.conditions.maxDailyLossPercent) {
                        isTriggered = true;
                        message = `Daily loss limit alert: ${dailyLossPercent.toFixed(1)}% of maximum (threshold: ${alert.conditions.maxDailyLossPercent}%)`;
                        value = dailyLossPercent;
                        threshold = alert.conditions.maxDailyLossPercent;
                    }
                }

                // Check drawdown limit
                if (alert.conditions.maxDrawdownPercent && violations.totalDrawdown && violations.totalDrawdown.isViolated) {
                    const drawdownPercent = violations.totalDrawdown.currentPercent;

                    if (drawdownPercent >= alert.conditions.maxDrawdownPercent) {
                        isTriggered = true;
                        message = `Max drawdown alert: ${drawdownPercent.toFixed(1)}% of maximum (threshold: ${alert.conditions.maxDrawdownPercent}%)`;
                        value = drawdownPercent;
                        threshold = alert.conditions.maxDrawdownPercent;
                    }
                }

                // Check position size limit
                if (alert.conditions.positionSizeLimit && violations.positionSize && violations.positionSize.isViolated) {
                    const positionSize = violations.positionSize.current;

                    if (positionSize >= alert.conditions.positionSizeLimit) {
                        isTriggered = true;
                        message = `Position size alert: ${positionSize} contracts (threshold: ${alert.conditions.positionSizeLimit})`;
                        value = positionSize;
                        threshold = alert.conditions.positionSizeLimit;
                    }
                }

                // Add to history if triggered
                if (isTriggered) {
                    const historyEntry = {
                        triggeredAt: new Date(),
                        message,
                        value,
                        threshold,
                        acknowledged: false
                    };

                    alert.history.push(historyEntry);
                    await alert.save();

                    triggeredAlerts.push({
                        alertId: alert._id,
                        historyId: alert.history[alert.history.length - 1]._id,
                        name: alert.name,
                        type: alert.type,
                        message,
                        triggeredAt: historyEntry.triggeredAt,
                        notifications: alert.notifications
                    });
                }
            }

            return triggeredAlerts;
        } catch (error) {
            console.error('Error checking prop firm alerts:', error);
            throw error;
        }
    }

    /**
     * Check for market condition alerts (unusual volatility, key levels, etc.)
     * @returns {Promise<Array>} - Triggered alerts
     */
    async checkMarketConditionAlerts() {
        try {
            // Get active market condition alerts
            const marketAlerts = await Alert.find({
                type: 'MARKET_CONDITION',
                active: true
            });

            if (marketAlerts.length === 0) {
                return [];
            }

            // For this example, we'll just simulate market data
            // In a real implementation, you'd connect to your market data service
            const marketData = await this._getSimulatedMarketData();

            const triggeredAlerts = [];

            for (const alert of marketAlerts) {
                // Skip alerts for instruments we don't have data for
                if (!alert.conditions.instrument || !marketData[alert.conditions.instrument]) {
                    continue;
                }

                const instrumentData = marketData[alert.conditions.instrument];
                let isTriggered = false;
                let message = '';
                let value = 0;
                let threshold = 0;

                // Check volatility threshold
                if (alert.conditions.volatilityThreshold &&
                    instrumentData.volatility >= alert.conditions.volatilityThreshold) {
                    isTriggered = true;
                    message = `High volatility alert for ${alert.conditions.instrument}: ${instrumentData.volatility.toFixed(2)} (threshold: ${alert.conditions.volatilityThreshold})`;
                    value = instrumentData.volatility;
                    threshold = alert.conditions.volatilityThreshold;
                }

                // Check volume threshold
                if (alert.conditions.volumeThreshold &&
                    instrumentData.volume >= alert.conditions.volumeThreshold) {
                    isTriggered = true;
                    message = `High volume alert for ${alert.conditions.instrument}: ${instrumentData.volume} (threshold: ${alert.conditions.volumeThreshold})`;
                    value = instrumentData.volume;
                    threshold = alert.conditions.volumeThreshold;
                }

                // Check price level
                if (alert.conditions.priceLevel) {
                    const priceDiff = Math.abs(instrumentData.price - alert.conditions.priceLevel);
                    const pricePercent = (priceDiff / alert.conditions.priceLevel) * 100;

                    if (pricePercent <= 0.1) { // Within 0.1% of the level
                        isTriggered = true;
                        message = `Price level alert for ${alert.conditions.instrument}: ${instrumentData.price} approaching ${alert.conditions.priceLevel}`;
                        value = instrumentData.price;
                        threshold = alert.conditions.priceLevel;
                    }
                }

                // Add to history if triggered
                if (isTriggered) {
                    const historyEntry = {
                        triggeredAt: new Date(),
                        message,
                        value,
                        threshold,
                        acknowledged: false
                    };

                    alert.history.push(historyEntry);
                    await alert.save();

                    triggeredAlerts.push({
                        alertId: alert._id,
                        historyId: alert.history[alert.history.length - 1]._id,
                        name: alert.name,
                        type: alert.type,
                        message,
                        triggeredAt: historyEntry.triggeredAt,
                        notifications: alert.notifications
                    });
                }
            }

            return triggeredAlerts;
        } catch (error) {
            console.error('Error checking market condition alerts:', error);
            throw error;
        }
    }

    /**
     * Check for system issue alerts (component status, connection problems, etc.)
     * @returns {Promise<Array>} - Triggered alerts
     */
    async checkSystemAlerts() {
        try {
            // Get active system issue alerts
            const systemAlerts = await Alert.find({
                type: 'SYSTEM_ISSUE',
                active: true
            });

            if (systemAlerts.length === 0) {
                return [];
            }

            // For this example, we'll just simulate system component status
            // In a real implementation, you'd check actual component status
            const componentStatus = await this._getSimulatedComponentStatus();

            const triggeredAlerts = [];

            for (const alert of systemAlerts) {
                // Skip alerts for components we don't have status for
                if (!alert.conditions.componentName || !componentStatus[alert.conditions.componentName]) {
                    continue;
                }

                const status = componentStatus[alert.conditions.componentName];

                // Check if component has issues
                if (!status.isOperational) {
                    const historyEntry = {
                        triggeredAt: new Date(),
                        message: `System issue alert: ${alert.conditions.componentName} is not operational - ${status.message}`,
                        value: 0,
                        threshold: 0,
                        acknowledged: false
                    };

                    alert.history.push(historyEntry);
                    await alert.save();

                    triggeredAlerts.push({
                        alertId: alert._id,
                        historyId: alert.history[alert.history.length - 1]._id,
                        name: alert.name,
                        type: alert.type,
                        message: historyEntry.message,
                        triggeredAt: historyEntry.triggeredAt,
                        notifications: alert.notifications
                    });
                }
            }

            return triggeredAlerts;
        } catch (error) {
            console.error('Error checking system alerts:', error);
            throw error;
        }
    }

    /**
     * Send notifications for triggered alerts
     * @param {Array} triggeredAlerts - Array of triggered alerts
     * @returns {Promise<Array>} - Notification results
     */
    async sendNotifications(triggeredAlerts) {
        try {
            if (!triggeredAlerts || triggeredAlerts.length === 0) {
                return [];
            }

            const notificationResults = [];

            for (const alert of triggeredAlerts) {
                const notifications = alert.notifications;

                // In-app notifications are always stored in history
                notificationResults.push({
                    alertId: alert.alertId,
                    type: 'in-app',
                    success: true
                });

                // Email notifications
                if (notifications.email && notifications.email.enabled && notifications.email.address) {
                    try {
                        // In a real implementation, you would integrate with an email service
                        // For this example, we'll just simulate sending an email
                        const emailResult = await this._simulateSendEmail(
                            notifications.email.address,
                            `Alert: ${alert.name}`,
                            alert.message
                        );

                        notificationResults.push({
                            alertId: alert.alertId,
                            type: 'email',
                            success: emailResult.success,
                            error: emailResult.error
                        });
                    } catch (error) {
                        notificationResults.push({
                            alertId: alert.alertId,
                            type: 'email',
                            success: false,
                            error: error.message
                        });
                    }
                }

                // Sound notifications would be handled by the frontend
                if (notifications.sound) {
                    notificationResults.push({
                        alertId: alert.alertId,
                        type: 'sound',
                        success: true
                    });
                }
            }

            return notificationResults;
        } catch (error) {
            console.error('Error sending notifications:', error);
            throw error;
        }
    }

    /**
     * Check all alert types
     * @returns {Promise<Object>} - All triggered alerts
     */
    async checkAllAlerts() {
        try {
            // Check all alert types
            const propFirmAlerts = await this.checkPropFirmAlerts();
            const marketAlerts = await this.checkMarketConditionAlerts();
            const systemAlerts = await this.checkSystemAlerts();

            // Combine all triggered alerts
            const allTriggeredAlerts = [
                ...propFirmAlerts,
                ...marketAlerts,
                ...systemAlerts
            ];

            // Send notifications
            const notificationResults = await this.sendNotifications(allTriggeredAlerts);

            return {
                triggeredAlerts: allTriggeredAlerts,
                notificationResults: notificationResults
            };
        } catch (error) {
            console.error('Error checking all alerts:', error);
            throw error;
        }
    }

    // Private helper methods

    /**
     * Get simulated market data for testing
     * @returns {Promise<Object>} - Simulated market data
     * @private
     */
    async _getSimulatedMarketData() {
        // In a real implementation, this would connect to your market data service
        return {
            'ES': {
                price: 4500 + (Math.random() * 50 - 25),
                volatility: 0.5 + (Math.random() * 0.5),
                volume: 5000 + Math.floor(Math.random() * 5000)
            },
            'NQ': {
                price: 15000 + (Math.random() * 100 - 50),
                volatility: 0.6 + (Math.random() * 0.5),
                volume: 3000 + Math.floor(Math.random() * 3000)
            },
            'CL': {
                price: 75 + (Math.random() * 2 - 1),
                volatility: 0.4 + (Math.random() * 0.4),
                volume: 10000 + Math.floor(Math.random() * 10000)
            }
        };
    }

    /**
     * Get simulated component status for testing
     * @returns {Promise<Object>} - Simulated component status
     * @private
     */
    async _getSimulatedComponentStatus() {
        // In a real implementation, this would check actual component status
        return {
            'database': {
                isOperational: true,
                message: 'Database is connected and operational'
            },
            'marketDataService': {
                isOperational: Math.random() > 0.2, // 80% chance of being operational
                message: Math.random() > 0.2 ? 'Market data service is running' : 'Market data service connection timeout'
            },
            'ninjaTrader': {
                isOperational: Math.random() > 0.1, // 90% chance of being operational
                message: Math.random() > 0.1 ? 'NinjaTrader connection established' : 'NinjaTrader connection lost'
            }
        };
    }

    /**
     * Get simulated prop firm violations for testing
     * @returns {Promise<Object>} - Simulated violations
     * @private
     */
    async _getSimulatedPropFirmViolations() {
        // In a real implementation, this would be provided by propFirmService.checkRuleViolations()
        return {
            dailyLoss: {
                isViolated: Math.random() > 0.7,
                currentPercent: 60 + Math.random() * 30,
                limit: 300,
                current: 200 + Math.random() * 100
            },
            totalDrawdown: {
                isViolated: Math.random() > 0.8,
                currentPercent: 70 + Math.random() * 25,
                limit: 500,
                current: 400 + Math.random() * 100
            },
            positionSize: {
                isViolated: Math.random() > 0.9,
                limit: 5,
                current: 4 + Math.floor(Math.random() * 2)
            }
        };
    }

    /**
     * Simulate sending an email
     * @param {string} to - Recipient email address
     * @param {string} subject - Email subject
     * @param {string} body - Email body
     * @returns {Promise<Object>} - Simulated email send result
     * @private
     */
    async _simulateSendEmail(to, subject, body) {
        // In a real implementation, this would connect to an email service
        console.log(`[SIMULATED EMAIL] To: ${to}, Subject: ${subject}, Body: ${body}`);

        // Simulate 95% success rate
        const success = Math.random() > 0.05;

        return {
            success,
            error: success ? null : 'Simulated email send failure'
        };
    }
}

module.exports = new AlertService();
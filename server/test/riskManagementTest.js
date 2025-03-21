/**
 * Simple test methods for the risk management module
 */

const riskManagementService = require('../services/riskManagementService');
const mongoose = require('mongoose');

/**
 * Ensure mongoose connection before running tests
 */
async function ensureMongooseConnection() {
    if (mongoose.connection.readyState !== 1) {
        try {
            console.log('Setting up test database connection...');
            await mongoose.connect('mongodb://localhost:27017/tradingDashboard', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
        } catch (error) {
            console.warn('Could not connect to MongoDB, but proceeding with test anyway:', error.message);
        }
    }
}

/**
 * Test creating a risk profile
 */
async function testCreateRiskProfile() {
    try {
        console.log('Testing risk profile creation...');

        // Ensure mongoose connection
        await ensureMongooseConnection();

        // Sample risk profile data
        const profileData = {
            name: 'Test Prop Firm Profile',
            description: 'Risk settings for test prop firm challenge',
            maxDailyLoss: 300,
            maxPositionSize: 3,
            maxOpenPositions: 2,
            accountSizeUSD: 10000,
            accountRiskPerTradePercent: 1,
            propFirmSettings: {
                maxDailyDrawdownPercent: 2,
                maxTotalDrawdownPercent: 5,
                profitTargetPercent: 8,
                minimumTradingDays: 10,
                maxConsecutiveLossDays: 2
            },
            alertThresholds: {
                dailyLossWarningPercent: 75,
                totalDrawdownWarningPercent: 75
            }
        };

        // Create the risk profile
        const profile = await riskManagementService.createRiskProfile(profileData);

        console.log('Risk profile created successfully!');
        console.log('Profile ID:', profile._id);
        console.log('Profile name:', profile.name);

        return profile;
    } catch (error) {
        console.error('Error testing risk profile creation:', error);
        throw error;
    }
}

/**
 * Test calculating risk metrics
 */
async function testCalculateRiskMetrics(profileId) {
    try {
        console.log('Testing risk metrics calculation...');

        // Calculate risk metrics
        const metrics = await riskManagementService.calculateRiskMetrics(profileId);

        console.log('Risk metrics calculated successfully!');
        console.log('Daily P&L:', metrics.dailyPnL);
        console.log('Daily loss limit %:', metrics.dailyLossLimitPercent);
        console.log('Current drawdown:', metrics.currentDrawdown);
        console.log('Drawdown limit %:', metrics.drawdownLimitPercent);
        console.log('Alerts:', metrics.alerts);

        return metrics;
    } catch (error) {
        console.error('Error testing risk metrics calculation:', error);
        throw error;
    }
}

/**
 * Test getting dashboard data
 */
async function testGetDashboardData() {
    try {
        console.log('Testing dashboard data retrieval...');

        // Get dashboard data
        const dashboardData = await riskManagementService.getDashboardData();

        console.log('Dashboard data retrieved successfully!');
        console.log('Profile name:', dashboardData.profileName);
        console.log('Risk metrics:', dashboardData.riskMetrics);
        console.log('Trade history count:', dashboardData.tradeHistory.length);
        console.log('Visualization data available:', Object.keys(dashboardData.visualizationData));

        return dashboardData;
    } catch (error) {
        console.error('Error testing dashboard data retrieval:', error);
        throw error;
    }
}

// If this file is run directly
if (require.main === module) {
    testCreateRiskProfile()
        .then(profile => testCalculateRiskMetrics(profile._id))
        .then(() => testGetDashboardData())
        .then(() => {
            console.log('All risk management tests completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = {
    testCreateRiskProfile,
    testCalculateRiskMetrics,
    testGetDashboardData
};
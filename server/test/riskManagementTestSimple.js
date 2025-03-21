/**
 * Simplified test for risk management functionality that doesn't require database
 */

const RiskProfile = require('../models/riskProfile');
const riskManagementService = require('../services/riskManagementService');

/**
 * Test risk management features with a mock profile
 */
async function testRiskManagementFeatures() {
  try {
    console.log('Testing risk management features with mock data...');
    
    // Create a mock risk profile (won't be saved to database)
    const mockProfile = new RiskProfile({
      name: 'Mock Profile',
      description: 'Mock risk settings for testing',
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
    });
    
    // Override the service's getRiskProfile method for testing
    const originalGetRiskProfile = riskManagementService.getRiskProfile;
    riskManagementService.getRiskProfile = async () => {
      return mockProfile;
    };
    
    // Override the getCurrentAccountStats method for testing
    const originalGetCurrentAccountStats = riskManagementService._getCurrentAccountStats;
    riskManagementService._getCurrentAccountStats = async () => {
      return {
        currentBalance: 9800,
        startingBalance: 10000,
        dailyPnL: -150,
        currentDrawdown: 200,
        highWaterMark: 10200,
        openPositions: 1,
        openPositionsValue: 2000,
        currentPositionSize: 2,
        consecutiveLossDays: 1
      };
    };
    
    // Test calculating risk metrics
    console.log('Calculating risk metrics...');
    const metrics = await riskManagementService.calculateRiskMetrics('mock-id');
    console.log('\nRisk metrics calculated successfully!');
    console.log('Daily P&L:', metrics.dailyPnL);
    console.log('Daily loss limit %:', metrics.dailyLossLimitPercent.toFixed(2) + '%');
    console.log('Current drawdown:', metrics.currentDrawdown);
    console.log('Drawdown limit %:', metrics.drawdownLimitPercent.toFixed(2) + '%');
    console.log('Number of alerts:', metrics.alerts.length);
    
    // Test checking prop firm rule violations
    console.log('\nChecking prop firm rule violations...');
    const violations = await riskManagementService.checkPropFirmRuleViolations('mock-id');
    console.log('Violations check completed successfully!');
    console.log('Has violations:', violations.hasViolations);
    console.log('Number of violations:', violations.violations.length);
    
    // Restore original methods when done
    riskManagementService.getRiskProfile = originalGetRiskProfile;
    riskManagementService._getCurrentAccountStats = originalGetCurrentAccountStats;
    
    console.log('\nAll risk management tests completed successfully');
    return { metrics, violations };
  } catch (error) {
    console.error('Error testing risk management features:', error);
    throw error;
  }
}

// Run the test
testRiskManagementFeatures()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
// Full path: C:\TradingDashboard\server\test\test-simple-market-regime.js

const marketConditionsService = require('../services/marketConditionsService');

function testSimpleMarketRegime() {
    console.log('Testing simple market regime detection...');

    try {
        // Get current market conditions
        const marketConditions = marketConditionsService.analyzeMarketConditions();

        console.log('\nCurrent Market Conditions:');
        console.log('---------------------------');
        console.log(`Current Time: ${marketConditions.currentTime}`);
        console.log(`Current Session: ${marketConditions.currentSession}`);
        console.log(`Volatility Category: ${marketConditions.volatilityCategory}`);

        // Get session info
        const sessionInfo = marketConditionsService.TRADING_SESSIONS[marketConditions.currentSession];

        console.log('\nSession Information:');
        console.log('-------------------');
        console.log(`Session Name: ${sessionInfo.name}`);
        console.log(`Time Range: ${sessionInfo.timeRange.start} - ${sessionInfo.timeRange.end}`);
        console.log(`Typical Volatility: ${sessionInfo.typicalVolatility}`);
        console.log(`Typical Volume: ${sessionInfo.typicalVolume}`);
        console.log(`Notable Features: ${sessionInfo.noteableFeatures.join(', ')}`);

        // Get parameter recommendations
        const recommendations = marketConditions.recommendations;

        console.log('\nRecommended Parameters:');
        console.log('----------------------');
        console.log('Flazh Parameters:');
        console.log(recommendations.flazhParams);
        console.log('\nATM Parameters:');
        console.log(recommendations.atmParams);
        console.log(`\nRationale: ${recommendations.rationale}`);

        console.log('\nTest completed successfully!');
        return true;
    } catch (error) {
        console.error('Error in simple market regime test:', error);
        return false;
    }
}

// Run the test
testSimpleMarketRegime();
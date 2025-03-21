// File path: C:\TradingDashboard\server\test\tradingSessionTest.js

const assert = require('assert');
const tradingSessionService = require('../services/tradingSessionService');

/**
 * Test Trading Session Service functionality
 */
async function testTradingSessionService() {
    console.log('Testing Trading Session Service...');

    // Test getCurrentSession
    const currentSession = tradingSessionService.getCurrentSession();
    console.log(`Current session: ${currentSession}`);
    assert(currentSession, 'Should return a valid session');

    // Test _isTimeInRange function
    const inRange = tradingSessionService._isTimeInRange('9:30', '8:30', '15:00');
    assert(inRange === true, 'Time 9:30 should be within regular hours range');

    const notInRange = tradingSessionService._isTimeInRange('6:30', '8:30', '15:00');
    assert(notInRange === false, 'Time 6:30 should not be within regular hours range');

    // Test overnight session
    const inOvernightRange = tradingSessionService._isTimeInRange('22:30', '16:00', '7:00');
    assert(inOvernightRange === true, 'Time 22:30 should be within overnight range');

    try {
        // Create mock data to test the analysis
        const mockData = [
            { timestamp: new Date().setHours(9, 30), price: 17500, volume: 150, volatility: 0.3 },
            { timestamp: new Date().setHours(10, 0), price: 17520, volume: 200, volatility: 0.4 },
            { timestamp: new Date().setHours(10, 30), price: 17510, volume: 180, volatility: 0.2 },
            { timestamp: new Date().setHours(11, 0), price: 17540, volume: 220, volatility: 0.5 }
        ];

        // Mock the _getMarketData method to return our test data
        const originalGetMarketData = tradingSessionService._getMarketData;
        tradingSessionService._getMarketData = async () => mockData;

        // Mock the _saveAnalysis method to do nothing
        const originalSaveAnalysis = tradingSessionService._saveAnalysis;
        tradingSessionService._saveAnalysis = async () => { };

        // Test analyzeSession with mock data
        console.log('Testing analyzeSession with mock data...');
        const analysis = await tradingSessionService.analyzeSession('regularHours');

        assert(analysis.averageVolatility === 0.35, 'Average volatility should be 0.35');
        assert(analysis.priceRange.high === 17540, 'High price should be 17540');
        assert(analysis.priceRange.low === 17500, 'Low price should be 17500');
        assert(analysis.priceRange.range === 40, 'Price range should be 40');
        assert(analysis.momentum === 40, 'Momentum should be 40');
        assert(analysis.volumeProfile.total === 750, 'Total volume should be 750');

        // Restore original methods
        tradingSessionService._getMarketData = originalGetMarketData;
        tradingSessionService._saveAnalysis = originalSaveAnalysis;

        console.log('Trading Session Service tests completed successfully!');
    } catch (error) {
        console.error('Trading Session Service test failed:', error);
        throw error;
    }
}

// Run the tests
testTradingSessionService()
    .then(() => console.log('All tests passed!'))
    .catch(err => console.error('Tests failed:', err));
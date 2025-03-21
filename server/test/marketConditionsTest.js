// Full path: C:\TradingDashboard\server\test\marketConditionsTest.js

const assert = require('assert');
const marketConditionsService = require('../services/analysis/marketConditionsService');
const fs = require('fs');
const path = require('path');

// Test data
const mockVolatilityData = {
    symbol: 'NQ',
    timeframe: '5min',
    timestamp: new Date().toISOString(),
    metrics: [
        { name: 'ATR', period: 14, value: 18.5, average: 12.2 },
        { name: 'Volume', period: 20, value: 5200, average: 3800 },
        { name: 'Range', period: 10, value: 25, average: 18 }
    ]
};

// Write mock data to a temp file
const tempDataFile = path.resolve('C:\\NinjaTraderData\\VolatilityMetrics.json');
const tempDir = path.dirname(tempDataFile);

// Ensure directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Write test data
fs.writeFileSync(tempDataFile, JSON.stringify(mockVolatilityData, null, 2));

console.log('=== Testing Market Conditions Analysis ===');

// Test session identification
console.log('\nTesting session identification:');
const testTimes = [
    { time: '01:30:00', expected: 'ASIA' },
    { time: '05:30:00', expected: 'EUROPE' },
    { time: '09:30:00', expected: 'US_OPEN' },
    { time: '12:30:00', expected: 'US_MIDDAY' },
    { time: '15:30:00', expected: 'US_AFTERNOON' },
    { time: '17:30:00', expected: 'OVERNIGHT' }
];

testTimes.forEach(test => {
    const session = marketConditionsService.getCurrentSession(test.time);
    console.log(`At ${test.time}, session is ${session} (Expected: ${test.expected})`);
    assert.strictEqual(session, test.expected, `Session at ${test.time} should be ${test.expected}`);
});

// Test volatility analysis
console.log('\nTesting volatility analysis:');
const volatilityCategory = marketConditionsService.analyzeVolatility(mockVolatilityData);
console.log(`Volatility category: ${volatilityCategory}`);
assert.strictEqual(volatilityCategory, 'HIGH_VOLATILITY', 'Volatility should be detected as HIGH');

// Test parameter recommendations
console.log('\nTesting parameter recommendations:');
const recommendations = marketConditionsService.getRecommendedParameters('US_OPEN', 'HIGH_VOLATILITY');
console.log('Parameter recommendations:', JSON.stringify(recommendations, null, 2));
assert.strictEqual(typeof recommendations, 'object', 'Recommendations should be an object');
assert.strictEqual(typeof recommendations.flazhParams, 'object', 'Should include Flazh parameters');
assert.strictEqual(typeof recommendations.atmParams, 'object', 'Should include ATM parameters');

// Test full analysis
console.log('\nTesting full market conditions analysis:');
const analysis = marketConditionsService.analyzeMarketConditions();
console.log('Full analysis:', JSON.stringify(analysis, null, 2));
assert.strictEqual(typeof analysis, 'object', 'Analysis should be an object');
assert.strictEqual(typeof analysis.currentSession, 'string', 'Should include current session');
assert.strictEqual(typeof analysis.volatilityCategory, 'string', 'Should include volatility category');
assert.strictEqual(typeof analysis.recommendations, 'object', 'Should include recommendations');

console.log('\n=== All tests passed! ===');

// Clean up temp file
// fs.unlinkSync(tempDataFile);
console.log('\nTest file created at:', tempDataFile);
console.log('You can keep this file for testing the API endpoints.');
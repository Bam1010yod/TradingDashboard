/**
 * Create Test Environment
 * 
 * This script creates the necessary directories and sample files
 * for running comprehensive market data tests.
 */

const fs = require('fs');
const path = require('path');

// Define paths
const TEST_DIR = path.join(__dirname);
const REAL_DIR = path.join(TEST_DIR, 'real');
const MARKET_DATA_SAMPLES_DIR = path.join(REAL_DIR, 'market-data-samples');
const RESULTS_DIR = path.join(TEST_DIR, 'results');

// Create directories if they don't exist
function ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    } else {
        console.log(`Directory already exists: ${dir}`);
    }
}

// Create sample data
function createSampleData() {
    const sampleFile = path.join(MARKET_DATA_SAMPLES_DIR, 'sample-nq-data.json');

    const sampleData = {
        "instrument": "NQ",
        "timestamp": "2025-03-22T10:30:00Z",
        "price": 21356.75,
        "volatility": {
            "intraday": 0.82,
            "hourly": 0.64,
            "daily": 1.23
        },
        "volume": 12450,
        "marketPhase": "regular",
        "timeOfDay": "morning",
        "priceAction": {
            "trend": "uptrend",
            "momentum": "strong",
            "support": 21250.0,
            "resistance": 21400.0
        },
        "indicators": {
            "rsi": 62.5,
            "macd": {
                "macdLine": 15.3,
                "signalLine": 10.2,
                "histogram": 5.1
            },
            "bollingerBands": {
                "upper": 21450.25,
                "middle": 21325.75,
                "lower": 21201.25
            }
        },
        "recentNews": [
            {
                "title": "Tech sector rallies on positive earnings",
                "timestamp": "2025-03-22T09:15:00Z",
                "sentiment": "positive",
                "impact": "moderate"
            }
        ]
    };

    if (!fs.existsSync(sampleFile)) {
        console.log(`Creating sample data file: ${sampleFile}`);
        fs.writeFileSync(sampleFile, JSON.stringify(sampleData, null, 2));
    } else {
        console.log(`Sample data file already exists: ${sampleFile}`);
    }
}

// Main function
function setupTestEnvironment() {
    console.log('Setting up test environment...');

    // Create directories
    ensureDirectory(REAL_DIR);
    ensureDirectory(MARKET_DATA_SAMPLES_DIR);
    ensureDirectory(RESULTS_DIR);

    // Create sample data
    createSampleData();

    console.log('Test environment setup complete!');
    console.log('\nYou can now run the comprehensive market data test with:');
    console.log('node test/comprehensiveMarketTest.js');
}

// Run setup
setupTestEnvironment();
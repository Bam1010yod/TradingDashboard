/**
 * Comprehensive Market Data Test
 * 
 * This script tests the entire trading dashboard system with real market data
 * to verify functionality and accuracy of recommendations.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

// Import database connection function
const connectDB = require('../config/database');

// Import required services
const marketDataService = require('../services/marketDataService');
const marketConditionsService = require('../services/marketConditionsService');
const recommendationEngineService = require('../services/recommendationEngineService');
const parameterOptimizationService = require('../services/parameterOptimizationService');

// Test configuration
const TEST_DATA_PATH = path.join(__dirname, 'real', 'market-data-samples');
const TEST_RESULTS_PATH = path.join(__dirname, 'results');

// Ensure results directory exists
if (!fs.existsSync(TEST_RESULTS_PATH)) {
    fs.mkdirSync(TEST_RESULTS_PATH, { recursive: true });
}

// Main function
async function main() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected to database');
        await runTests();
    } catch (err) {
        console.error('Database connection error:', err);
        console.log('\nTrying to run tests without database connection...');
        await runTestsWithoutDB();
    } finally {
        // Ensure we always disconnect from the database if connected
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('Database connection closed');
        }
    }
}

async function runTests() {
    try {
        console.log('Starting comprehensive market data tests...');

        // Step 1: Load test data files
        console.log('Loading test data...');
        const testFiles = fs.readdirSync(TEST_DATA_PATH)
            .filter(file => file.endsWith('.json'));

        if (testFiles.length === 0) {
            console.error('No test data files found!');
            return;
        }

        console.log(`Found ${testFiles.length} test data files`);

        // Step 2: Process each test file
        let testResults = [];

        for (const file of testFiles) {
            console.log(`\nProcessing file: ${file}`);
            const filePath = path.join(TEST_DATA_PATH, file);
            const marketData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            try {
                // Step 3: Analyze market conditions
                console.log('Analyzing market conditions...');
                const marketConditions = await marketConditionsService.analyzeMarketConditions(marketData);
                console.log('Market conditions:', JSON.stringify(marketConditions, null, 2));

                // Step 4: Generate parameter optimization
                console.log('Optimizing parameters...');
                const optimizedParameters = await parameterOptimizationService.optimizeParameters(marketConditions);
                console.log('Optimized parameters:', JSON.stringify(optimizedParameters, null, 2));

                // Step 5: Get template recommendations
                console.log('Generating recommendations...');
                const recommendations = await recommendationEngineService.generateRecommendations(marketConditions, optimizedParameters);
                console.log('Recommendations:', JSON.stringify(recommendations, null, 2));

                // Save results
                testResults.push({
                    testFile: file,
                    timestamp: new Date(),
                    marketConditions,
                    optimizedParameters,
                    recommendations,
                    success: true,
                    error: null
                });
            } catch (error) {
                console.error(`Error processing ${file}:`, error);
                testResults.push({
                    testFile: file,
                    timestamp: new Date(),
                    success: false,
                    error: error.message
                });
            }
        }

        // Step 6: Save all test results
        const resultsFile = path.join(TEST_RESULTS_PATH, `comprehensive-test-results-${Date.now()}.json`);
        fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
        console.log(`\nAll tests completed. Results saved to: ${resultsFile}`);

        // Step 7: Generate summary report
        console.log('\nGenerating summary report...');
        const summary = generateSummaryReport(testResults);
        const summaryFile = path.join(TEST_RESULTS_PATH, `test-summary-${Date.now()}.txt`);
        fs.writeFileSync(summaryFile, summary);
        console.log(`Summary report saved to: ${summaryFile}`);
    } catch (error) {
        console.error('Test execution error:', error);
    }
}

// Fallback test function that doesn't require database connection
async function runTestsWithoutDB() {
    try {
        console.log('Starting tests in offline mode (without database)...');

        // Step 1: Load test data files
        console.log('Loading test data...');
        const testFiles = fs.readdirSync(TEST_DATA_PATH)
            .filter(file => file.endsWith('.json'));

        if (testFiles.length === 0) {
            console.error('No test data files found!');
            return;
        }

        console.log(`Found ${testFiles.length} test data files`);

        // Step 2: Process each test file (simple validation only)
        let testResults = [];

        for (const file of testFiles) {
            console.log(`\nProcessing file: ${file}`);
            const filePath = path.join(TEST_DATA_PATH, file);
            const marketData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            // Simple validation of data structure
            console.log('Validating market data structure...');
            const validationResult = validateMarketData(marketData);

            // Save results
            testResults.push({
                testFile: file,
                timestamp: new Date(),
                valid: validationResult.valid,
                issues: validationResult.issues
            });

            console.log(`Validation result: ${validationResult.valid ? 'PASSED' : 'FAILED'}`);
            if (validationResult.issues.length > 0) {
                console.log('Issues found:');
                validationResult.issues.forEach(issue => console.log(`- ${issue}`));
            }
        }

        // Step 3: Save all test results
        const resultsFile = path.join(TEST_RESULTS_PATH, `offline-test-results-${Date.now()}.json`);
        fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
        console.log(`\nAll tests completed. Results saved to: ${resultsFile}`);

        // Step 4: Generate summary report
        console.log('\nGenerating summary report...');
        const summary = generateOfflineSummaryReport(testResults);
        const summaryFile = path.join(TEST_RESULTS_PATH, `offline-test-summary-${Date.now()}.txt`);
        fs.writeFileSync(summaryFile, summary);
        console.log(`Summary report saved to: ${summaryFile}`);
    } catch (error) {
        console.error('Test execution error:', error);
    }
}

// Function to validate market data structure
function validateMarketData(data) {
    const issues = [];

    // Check required fields
    if (!data.instrument) issues.push('Missing instrument');
    if (!data.timestamp) issues.push('Missing timestamp');
    if (!data.price) issues.push('Missing price');

    // Check volatility
    if (!data.volatility) {
        issues.push('Missing volatility data');
    } else {
        if (data.volatility.intraday === undefined) issues.push('Missing intraday volatility');
        if (data.volatility.hourly === undefined) issues.push('Missing hourly volatility');
        if (data.volatility.daily === undefined) issues.push('Missing daily volatility');
    }

    // Check indicators
    if (!data.indicators) {
        issues.push('Missing indicators data');
    }

    return {
        valid: issues.length === 0,
        issues
    };
}

function generateSummaryReport(testResults) {
    let summary = 'COMPREHENSIVE MARKET DATA TEST SUMMARY\n';
    summary += '=======================================\n\n';
    summary += `Test Date: ${new Date().toLocaleString()}\n`;
    summary += `Number of Test Files: ${testResults.length}\n\n`;

    // Add success rate statistics
    let successCount = 0;
    testResults.forEach(result => {
        if (result.success) {
            successCount++;
        }
    });

    const successRate = (successCount / testResults.length) * 100;
    summary += `Success Rate: ${successRate.toFixed(2)}%\n\n`;

    // Add individual test summaries
    summary += 'INDIVIDUAL TEST RESULTS\n';
    summary += '------------------------\n\n';

    testResults.forEach((result, index) => {
        summary += `Test #${index + 1}: ${result.testFile}\n`;
        if (result.success) {
            summary += `  Status: SUCCESS\n`;
            summary += `  Market Conditions: ${JSON.stringify(result.marketConditions)}\n`;
            summary += `  Recommended Templates: ${result.recommendations ? result.recommendations.length : 0}\n`;
        } else {
            summary += `  Status: FAILURE\n`;
            summary += `  Error: ${result.error}\n`;
        }
        summary += '\n';
    });

    return summary;
}

function generateOfflineSummaryReport(testResults) {
    let summary = 'OFFLINE MARKET DATA TEST SUMMARY\n';
    summary += '=================================\n\n';
    summary += `Test Date: ${new Date().toLocaleString()}\n`;
    summary += `Number of Test Files: ${testResults.length}\n\n`;

    // Add success rate statistics
    let validCount = 0;
    testResults.forEach(result => {
        if (result.valid) {
            validCount++;
        }
    });

    const validRate = (validCount / testResults.length) * 100;
    summary += `Valid Data Rate: ${validRate.toFixed(2)}%\n\n`;

    // Add individual test summaries
    summary += 'INDIVIDUAL TEST RESULTS\n';
    summary += '------------------------\n\n';

    testResults.forEach((result, index) => {
        summary += `Test #${index + 1}: ${result.testFile}\n`;
        summary += `  Status: ${result.valid ? 'VALID' : 'INVALID'}\n`;
        if (result.issues && result.issues.length > 0) {
            summary += `  Issues:\n`;
            result.issues.forEach(issue => {
                summary += `    - ${issue}\n`;
            });
        }
        summary += '\n';
    });

    return summary;
}

// Start the tests
main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

console.log('Test script loaded');
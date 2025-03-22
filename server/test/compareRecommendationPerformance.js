// File: C:\TradingDashboard\server\test\compareRecommendationPerformance.js

const fs = require('fs');
const path = require('path');

/**
 * Recommendation Performance Comparison
 * 
 * This script analyzes test results to compare the performance of
 * trading recommendations across different market conditions.
 */

// Define paths
const RESULTS_PATH = path.join(__dirname, 'results');
const COMPARISON_PATH = path.join(RESULTS_PATH, 'comparisons');

// Ensure comparisons directory exists
if (!fs.existsSync(COMPARISON_PATH)) {
    fs.mkdirSync(COMPARISON_PATH, { recursive: true });
}

// Main function
async function compareRecommendationPerformance() {
    try {
        console.log('Starting recommendation performance comparison...');

        // Find the most recent comprehensive test results
        const testResultFiles = fs.readdirSync(RESULTS_PATH)
            .filter(file => file.startsWith('comprehensive-test-results-'))
            .sort()
            .reverse();

        if (testResultFiles.length === 0) {
            console.error('No test result files found! Please run comprehensiveMarketTest.js first.');
            return;
        }

        const latestResultFile = testResultFiles[0];
        console.log(`Using latest test results: ${latestResultFile}`);

        // Load test results
        const resultsFilePath = path.join(RESULTS_PATH, latestResultFile);
        const testResults = JSON.parse(fs.readFileSync(resultsFilePath, 'utf8'));

        // Group results by market condition type
        const marketConditionGroups = groupResultsByMarketCondition(testResults);

        // Analyze recommendation performance by market condition
        const performanceAnalysis = analyzePerformanceByMarketCondition(marketConditionGroups);

        // Generate performance comparison report
        const comparisonReport = generateComparisonReport(performanceAnalysis);

        // Save performance comparison results
        const comparisonFilePath = path.join(COMPARISON_PATH, `performance-comparison-${Date.now()}.json`);
        fs.writeFileSync(comparisonFilePath, JSON.stringify(performanceAnalysis, null, 2));

        // Save human-readable report
        const reportFilePath = path.join(COMPARISON_PATH, `performance-report-${Date.now()}.txt`);
        fs.writeFileSync(reportFilePath, comparisonReport);

        console.log(`Performance comparison completed and saved to: ${comparisonFilePath}`);
        console.log(`Human-readable report saved to: ${reportFilePath}`);

        return performanceAnalysis;
    } catch (error) {
        console.error('Error during performance comparison:', error);
    }
}

// Group test results by market condition type
function groupResultsByMarketCondition(testResults) {
    const groups = {};

    testResults.forEach(result => {
        if (!result.success || !result.marketConditions) {
            return; // Skip failed tests
        }

        // Determine market condition type from the filename
        const filename = result.testFile;
        const conditionMatch = filename.match(/^([a-zA-Z]+)-\d+\.json$/);

        if (conditionMatch) {
            const conditionType = conditionMatch[1];

            if (!groups[conditionType]) {
                groups[conditionType] = [];
            }

            groups[conditionType].push(result);
        }
    });

    return groups;
}

// Analyze recommendation performance for each market condition
function analyzePerformanceByMarketCondition(marketConditionGroups) {
    const analysis = {
        summary: {
            totalScenarios: 0,
            conditionTypes: 0
        },
        conditionAnalysis: {}
    };

    // Process each condition type
    for (const [conditionType, results] of Object.entries(marketConditionGroups)) {
        analysis.summary.conditionTypes++;
        analysis.summary.totalScenarios += results.length;

        const typeAnalysis = {
            scenarioCount: results.length,
            recommendations: {
                flazhSettings: {},
                atmSettings: {}
            },
            volatilityRange: {
                min: Infinity,
                max: -Infinity,
                avg: 0
            },
            recommendationPatterns: []
        };

        // Collect data from each scenario
        results.forEach(result => {
            if (result.recommendations) {
                // Track Flazh settings 
                if (result.recommendations.flazhSettings) {
                    Object.entries(result.recommendations.flazhSettings).forEach(([key, value]) => {
                        if (!typeAnalysis.recommendations.flazhSettings[key]) {
                            typeAnalysis.recommendations.flazhSettings[key] = [];
                        }
                        typeAnalysis.recommendations.flazhSettings[key].push(value);
                    });
                }

                // Track ATM settings
                if (result.recommendations.atmSettings) {
                    Object.entries(result.recommendations.atmSettings).forEach(([key, value]) => {
                        if (!typeAnalysis.recommendations.atmSettings[key]) {
                            typeAnalysis.recommendations.atmSettings[key] = [];
                        }
                        typeAnalysis.recommendations.atmSettings[key].push(value);
                    });
                }

                // Extract pattern
                if (result.recommendations.pattern) {
                    typeAnalysis.recommendationPatterns.push(result.recommendations.pattern);
                }
            }

            // Track volatility
            if (result.marketConditions && result.marketConditions.volatility) {
                const intraday = result.marketConditions.volatility.intraday || 0;
                typeAnalysis.volatilityRange.min = Math.min(typeAnalysis.volatilityRange.min, intraday);
                typeAnalysis.volatilityRange.max = Math.max(typeAnalysis.volatilityRange.max, intraday);
                typeAnalysis.volatilityRange.avg += intraday / results.length;
            }
        });

        // Calculate most common settings for each parameter
        if (typeAnalysis.recommendations.flazhSettings) {
            Object.keys(typeAnalysis.recommendations.flazhSettings).forEach(key => {
                const values = typeAnalysis.recommendations.flazhSettings[key];
                typeAnalysis.recommendations.flazhSettings[key] = calculateMostCommon(values);
            });
        }

        if (typeAnalysis.recommendations.atmSettings) {
            Object.keys(typeAnalysis.recommendations.atmSettings).forEach(key => {
                const values = typeAnalysis.recommendations.atmSettings[key];
                typeAnalysis.recommendations.atmSettings[key] = calculateMostCommon(values);
            });
        }

        // Add to analysis
        analysis.conditionAnalysis[conditionType] = typeAnalysis;
    }

    return analysis;
}

// Calculate most common value and its frequency
function calculateMostCommon(values) {
    const counts = {};
    let mostCommon = null;
    let maxCount = 0;

    values.forEach(value => {
        // Convert value to string for comparison
        const key = typeof value === 'object' ? JSON.stringify(value) : String(value);

        if (!counts[key]) {
            counts[key] = 0;
        }

        counts[key]++;

        if (counts[key] > maxCount) {
            maxCount = counts[key];
            mostCommon = value;
        }
    });

    return {
        value: mostCommon,
        frequency: maxCount,
        confidencePercent: (maxCount / values.length) * 100
    };
}

// Generate human-readable comparison report
function generateComparisonReport(analysis) {
    let report = 'TRADING SYSTEM RECOMMENDATION PERFORMANCE COMPARISON\n';
    report += '====================================================\n\n';
    report += `Report Date: ${new Date().toLocaleString()}\n`;
    report += `Total Market Condition Types: ${analysis.summary.conditionTypes}\n`;
    report += `Total Scenarios Analyzed: ${analysis.summary.totalScenarios}\n\n`;

    report += 'MARKET CONDITION ANALYSIS\n';
    report += '------------------------\n\n';

    // Add details for each market condition type
    for (const [conditionType, typeAnalysis] of Object.entries(analysis.conditionAnalysis)) {
        report += `Market Condition: ${conditionType}\n`;
        report += `  Scenarios Analyzed: ${typeAnalysis.scenarioCount}\n`;
        report += `  Volatility Range: ${typeAnalysis.volatilityRange.min.toFixed(2)} - ${typeAnalysis.volatilityRange.max.toFixed(2)} (avg: ${typeAnalysis.volatilityRange.avg.toFixed(2)})\n\n`;

        // Recommended Flazh Infinity settings
        report += '  Recommended Flazh Infinity Settings:\n';
        for (const [param, data] of Object.entries(typeAnalysis.recommendations.flazhSettings)) {
            report += `    ${param}: ${formatValue(data.value)} (${data.confidencePercent.toFixed(0)}% confidence)\n`;
        }

        report += '\n  Recommended ATM Settings:\n';
        for (const [param, data] of Object.entries(typeAnalysis.recommendations.atmSettings)) {
            report += `    ${param}: ${formatValue(data.value)} (${data.confidencePercent.toFixed(0)}% confidence)\n`;
        }

        // Pattern analysis if available
        if (typeAnalysis.recommendationPatterns && typeAnalysis.recommendationPatterns.length > 0) {
            const patternCounts = {};
            typeAnalysis.recommendationPatterns.forEach(pattern => {
                if (!patternCounts[pattern]) {
                    patternCounts[pattern] = 0;
                }
                patternCounts[pattern]++;
            });

            report += '\n  Recommendation Patterns:\n';
            Object.entries(patternCounts)
                .sort((a, b) => b[1] - a[1])
                .forEach(([pattern, count]) => {
                    const percentage = (count / typeAnalysis.recommendationPatterns.length) * 100;
                    report += `    ${pattern}: ${count} (${percentage.toFixed(0)}%)\n`;
                });
        }

        report += '\n';
    }

    // Add comparison across market conditions
    report += 'CROSS-CONDITION COMPARISON\n';
    report += '-------------------------\n\n';

    // Compare volatility and recommended settings across different conditions
    report += 'Volatility Comparison:\n';
    Object.entries(analysis.conditionAnalysis)
        .sort((a, b) => b[1].volatilityRange.avg - a[1].volatilityRange.avg)
        .forEach(([condition, data]) => {
            report += `  ${condition}: ${data.volatilityRange.avg.toFixed(2)} (range: ${data.volatilityRange.min.toFixed(2)} - ${data.volatilityRange.max.toFixed(2)})\n`;
        });

    report += '\nSetting Recommendations by Market Condition:\n';

    // Compare a few key settings across conditions
    const keyFlazhSettings = ['range', 'sensitivity'];
    const keyATMSettings = ['stopLoss', 'profitTarget'];

    keyFlazhSettings.forEach(setting => {
        report += `\n  Flazh ${setting}:\n`;
        Object.entries(analysis.conditionAnalysis).forEach(([condition, data]) => {
            if (data.recommendations.flazhSettings[setting]) {
                report += `    ${condition}: ${formatValue(data.recommendations.flazhSettings[setting].value)}\n`;
            }
        });
    });

    keyATMSettings.forEach(setting => {
        report += `\n  ATM ${setting}:\n`;
        Object.entries(analysis.conditionAnalysis).forEach(([condition, data]) => {
            if (data.recommendations.atmSettings[setting]) {
                report += `    ${condition}: ${formatValue(data.recommendations.atmSettings[setting].value)}\n`;
            }
        });
    });

    return report;
}

// Helper function to format values for display
function formatValue(value) {
    if (value === null || value === undefined) {
        return 'N/A';
    } else if (typeof value === 'object') {
        return JSON.stringify(value);
    } else {
        return String(value);
    }
}

// Execute if run directly
if (require.main === module) {
    compareRecommendationPerformance()
        .then(() => console.log('Performance comparison completed'))
        .catch(err => console.error('Error in performance comparison:', err));
} else {
    // Export for use in other scripts
    module.exports = {
        compareRecommendationPerformance
    };
}
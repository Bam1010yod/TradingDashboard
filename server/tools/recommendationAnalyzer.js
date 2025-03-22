/**
 * Recommendation Analyzer
 * 
 * This script analyzes recommendation quality by comparing generated recommendations
 * with historical performance data to identify improvement opportunities.
 * 
 * File: C:\TradingDashboard\server\tools\recommendationAnalyzer.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose'); // Added missing mongoose import
require('dotenv').config();

// Import database connection
const connectDB = require('../config/database');

// Import models
const FlazhTemplate = require('../models/flazhTemplate');
const ATMTemplate = require('../models/atmTemplate');
const PerformanceRecord = require('../models/performanceRecord');
const SessionAnalysis = require('../models/sessionAnalysis');

// Import services
const marketConditionsService = require('../services/marketConditionsService');

// Constants
const RESULTS_DIR = path.join(__dirname, '../test/results');
const ANALYSIS_DIR = path.join(__dirname, '../analysis');
const IMPROVEMENT_THRESHOLD = 15; // Percentage improvement needed to suggest changes

// Ensure analysis directory exists
if (!fs.existsSync(ANALYSIS_DIR)) {
    fs.mkdirSync(ANALYSIS_DIR, { recursive: true });
}

// Main function
async function main() {
    try {
        // Connect to database
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected to database');

        // Get the latest test results
        const resultsFiles = fs.readdirSync(RESULTS_DIR)
            .filter(file => file.startsWith('comprehensive-test-results-'))
            .sort()
            .reverse();

        if (resultsFiles.length === 0) {
            console.log('No test results found to analyze');
            await mongoose.disconnect();
            return;
        }

        const latestResultFile = path.join(RESULTS_DIR, resultsFiles[0]);
        console.log(`Analyzing latest test results: ${latestResultFile}`);

        // Load test results
        const testResults = JSON.parse(fs.readFileSync(latestResultFile, 'utf8'));

        // Analyze each test result
        let analysisResults = [];

        for (const result of testResults) {
            if (!result.success) {
                console.log(`Skipping failed test: ${result.testFile}`);
                continue;
            }

            console.log(`\nAnalyzing recommendations for: ${result.testFile}`);
            const analysisResult = await analyzeRecommendation(result);
            analysisResults.push(analysisResult);
        }

        // Generate recommendations for improvement
        console.log('\nGenerating improvement suggestions...');
        const improvementSuggestions = generateImprovementSuggestions(analysisResults);

        // Save analysis results
        const analysisFile = path.join(ANALYSIS_DIR, `recommendation-analysis-${Date.now()}.json`);
        fs.writeFileSync(analysisFile, JSON.stringify({
            timestamp: new Date(),
            analysisResults,
            improvementSuggestions
        }, null, 2));
        console.log(`Analysis saved to: ${analysisFile}`);

        // Generate human-readable report
        console.log('Generating human-readable report...');
        const report = generateReadableReport(analysisResults, improvementSuggestions);
        const reportFile = path.join(ANALYSIS_DIR, `recommendation-report-${Date.now()}.txt`);
        fs.writeFileSync(reportFile, report);
        console.log(`Report saved to: ${reportFile}`);

        // Disconnect from database
        await mongoose.disconnect();
        console.log('Database connection closed');

    } catch (error) {
        console.error('Error during analysis:', error);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

// Analyze a single recommendation
async function analyzeRecommendation(testResult) {
    try {
        const marketConditions = testResult.marketConditions;
        const recommendations = testResult.recommendations;

        // Find similar historical sessions
        console.log('Finding similar historical sessions...');
        const similarSessions = await findSimilarSessions(marketConditions);
        console.log(`Found ${similarSessions.length} similar sessions`);

        // Get historical performance data for these sessions
        const performanceData = await getPerformanceData(similarSessions);
        console.log(`Found performance data for ${performanceData.length} sessions`);

        // Calculate optimal parameters based on historical data
        const optimalParameters = calculateOptimalParameters(performanceData);
        console.log('Calculated optimal parameters based on historical data');

        // Compare recommended parameters with optimal parameters
        const comparison = compareParameters(recommendations, optimalParameters);
        console.log('Completed parameter comparison');

        return {
            testFile: testResult.testFile,
            timestamp: testResult.timestamp,
            marketConditions,
            recommendations,
            similarSessions: similarSessions.map(s => s._id),
            optimalParameters,
            comparison,
            improvementPotential: comparison.overallDifference > IMPROVEMENT_THRESHOLD
        };
    } catch (error) {
        console.error('Error analyzing recommendation:', error);
        return {
            testFile: testResult.testFile,
            timestamp: testResult.timestamp,
            error: error.message,
            errorStack: error.stack
        };
    }
}

// Find similar historical sessions based on market conditions
async function findSimilarSessions(marketConditions) {
    // Extract key values for comparison
    const { currentSession, volatilityCategory } = marketConditions;

    // Query database for similar sessions
    const similarSessions = await SessionAnalysis.find({
        'marketConditions.currentSession': currentSession,
        'marketConditions.volatilityCategory': volatilityCategory
    }).limit(10).sort({ timestamp: -1 });

    return similarSessions;
}

// Get performance data for a set of sessions
async function getPerformanceData(sessions) {
    if (!sessions || sessions.length === 0) {
        return [];
    }

    const sessionIds = sessions.map(s => s._id);

    // Query database for performance records
    const performanceData = await PerformanceRecord.find({
        sessionId: { $in: sessionIds }
    }).populate('flazhTemplateId').populate('atmTemplateId');

    return performanceData;
}

// Calculate optimal parameters based on performance data
function calculateOptimalParameters(performanceData) {
    if (!performanceData || performanceData.length === 0) {
        // Return default parameters if no data is available
        return {
            flazh: {
                FastPeriod: 20,
                FastRange: 3,
                MediumPeriod: 40,
                MediumRange: 4,
                SlowPeriod: 70,
                SlowRange: 5,
                FilterMultiplier: 10,
                MinRetracementPercent: 40
            },
            atm: {
                StopLoss: 20,
                Target: 40,
                AutoBreakEvenProfitTrigger: 20,
                AutoBreakEvenPlus: 10
            },
            confidence: 'low',
            note: 'Default parameters used due to insufficient historical data'
        };
    }

    // Sort performance data by profitability
    const sortedData = [...performanceData].sort((a, b) => {
        return b.profitLoss - a.profitLoss;
    });

    // Get top 3 performing templates (or less if we don't have 3)
    const topPerformers = sortedData.slice(0, Math.min(3, sortedData.length));

    // Extract and average their parameters
    const flazhParams = {
        FastPeriod: 0,
        FastRange: 0,
        MediumPeriod: 0,
        MediumRange: 0,
        SlowPeriod: 0,
        SlowRange: 0,
        FilterMultiplier: 0,
        MinRetracementPercent: 0
    };

    const atmParams = {
        StopLoss: 0,
        Target: 0,
        AutoBreakEvenProfitTrigger: 0,
        AutoBreakEvenPlus: 0
    };

    let flazhCount = 0;
    let atmCount = 0;

    topPerformers.forEach(record => {
        if (record.flazhTemplateId) {
            Object.keys(flazhParams).forEach(key => {
                flazhParams[key] += record.flazhTemplateId[key] || 0;
            });
            flazhCount++;
        }

        if (record.atmTemplateId) {
            Object.keys(atmParams).forEach(key => {
                atmParams[key] += record.atmTemplateId[key] || 0;
            });
            atmCount++;
        }
    });

    // Calculate averages
    if (flazhCount > 0) {
        Object.keys(flazhParams).forEach(key => {
            flazhParams[key] = Math.round(flazhParams[key] / flazhCount);
        });
    }

    if (atmCount > 0) {
        Object.keys(atmParams).forEach(key => {
            atmParams[key] = Math.round(atmParams[key] / atmCount);
        });
    }

    // Calculate confidence level based on data quantity and consistency
    let confidence = 'low';
    if (topPerformers.length >= 3) {
        const profitVariance = calculateVariance(topPerformers.map(r => r.profitLoss));
        if (profitVariance < 100) {
            confidence = 'high';
        } else if (profitVariance < 300) {
            confidence = 'medium';
        }
    }

    return {
        flazh: flazhParams,
        atm: atmParams,
        confidence,
        basedOn: topPerformers.length
    };
}

// Compare recommended parameters with optimal parameters
function compareParameters(recommendations, optimalParameters) {
    // Extract recommendation values
    const recFlazh = recommendations.recommendations?.flazh ||
        recommendations.timeOfDay?.recommendations?.flazhParams || {};

    const recATM = recommendations.recommendations?.atm ||
        recommendations.timeOfDay?.recommendations?.atmParams || {};

    // Calculate differences
    const flazhDiffs = {};
    let flazhDiffTotal = 0;
    let flazhDiffCount = 0;

    Object.keys(optimalParameters.flazh).forEach(key => {
        if (recFlazh[key] !== undefined) {
            const optValue = optimalParameters.flazh[key];
            const recValue = recFlazh[key];
            const diff = Math.abs(optValue - recValue);
            const percentDiff = optValue !== 0 ? (diff / optValue) * 100 : 0;

            flazhDiffs[key] = {
                recommended: recValue,
                optimal: optValue,
                difference: diff,
                percentDifference: percentDiff
            };

            flazhDiffTotal += percentDiff;
            flazhDiffCount++;
        }
    });

    const atmDiffs = {};
    let atmDiffTotal = 0;
    let atmDiffCount = 0;

    Object.keys(optimalParameters.atm).forEach(key => {
        if (recATM[key] !== undefined) {
            const optValue = optimalParameters.atm[key];
            const recValue = recATM[key];
            const diff = Math.abs(optValue - recValue);
            const percentDiff = optValue !== 0 ? (diff / optValue) * 100 : 0;

            atmDiffs[key] = {
                recommended: recValue,
                optimal: optValue,
                difference: diff,
                percentDifference: percentDiff
            };

            atmDiffTotal += percentDiff;
            atmDiffCount++;
        }
    });

    // Calculate average differences
    const avgFlazhDiff = flazhDiffCount > 0 ? flazhDiffTotal / flazhDiffCount : 0;
    const avgATMDiff = atmDiffCount > 0 ? atmDiffTotal / atmDiffCount : 0;
    const overallDifference = (avgFlazhDiff + avgATMDiff) / 2;

    return {
        flazhDifferences: flazhDiffs,
        atmDifferences: atmDiffs,
        averageFlazhDifference: avgFlazhDiff,
        averageATMDifference: avgATMDiff,
        overallDifference
    };
}

// Generate suggestions for improvement
function generateImprovementSuggestions(analysisResults) {
    const suggestionsMap = {
        flazh: {},
        atm: {}
    };

    // Process each analysis result
    analysisResults.forEach(result => {
        if (result.error || !result.comparison) {
            return;
        }

        // Process Flazh parameters
        Object.entries(result.comparison.flazhDifferences || {}).forEach(([param, data]) => {
            if (data.percentDifference > IMPROVEMENT_THRESHOLD) {
                if (!suggestionsMap.flazh[param]) {
                    suggestionsMap.flazh[param] = {
                        count: 0,
                        totalRecommended: 0,
                        totalOptimal: 0,
                        conditions: []
                    };
                }

                suggestionsMap.flazh[param].count++;
                suggestionsMap.flazh[param].totalRecommended += data.recommended;
                suggestionsMap.flazh[param].totalOptimal += data.optimal;
                suggestionsMap.flazh[param].conditions.push({
                    marketConditions: result.marketConditions,
                    recommended: data.recommended,
                    optimal: data.optimal
                });
            }
        });

        // Process ATM parameters
        Object.entries(result.comparison.atmDifferences || {}).forEach(([param, data]) => {
            if (data.percentDifference > IMPROVEMENT_THRESHOLD) {
                if (!suggestionsMap.atm[param]) {
                    suggestionsMap.atm[param] = {
                        count: 0,
                        totalRecommended: 0,
                        totalOptimal: 0,
                        conditions: []
                    };
                }

                suggestionsMap.atm[param].count++;
                suggestionsMap.atm[param].totalRecommended += data.recommended;
                suggestionsMap.atm[param].totalOptimal += data.optimal;
                suggestionsMap.atm[param].conditions.push({
                    marketConditions: result.marketConditions,
                    recommended: data.recommended,
                    optimal: data.optimal
                });
            }
        });
    });

    // Convert map to suggestions array
    const suggestions = [];

    Object.entries(suggestionsMap.flazh).forEach(([param, data]) => {
        if (data.count > 0) {
            const avgRecommended = Math.round(data.totalRecommended / data.count);
            const avgOptimal = Math.round(data.totalOptimal / data.count);

            suggestions.push({
                parameter: param,
                type: 'flazh',
                currentAverage: avgRecommended,
                suggestedAverage: avgOptimal,
                occurrences: data.count,
                conditions: data.conditions
            });
        }
    });

    Object.entries(suggestionsMap.atm).forEach(([param, data]) => {
        if (data.count > 0) {
            const avgRecommended = Math.round(data.totalRecommended / data.count);
            const avgOptimal = Math.round(data.totalOptimal / data.count);

            suggestions.push({
                parameter: param,
                type: 'atm',
                currentAverage: avgRecommended,
                suggestedAverage: avgOptimal,
                occurrences: data.count,
                conditions: data.conditions
            });
        }
    });

    // Sort by number of occurrences (highest first)
    return suggestions.sort((a, b) => b.occurrences - a.occurrences);
}

// Generate human-readable report
function generateReadableReport(analysisResults, improvementSuggestions) {
    let report = 'RECOMMENDATION ANALYSIS REPORT\n';
    report += '==============================\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Number of tests analyzed: ${analysisResults.length}\n\n`;

    // Overall statistics
    const improvementNeeded = analysisResults.filter(r => r.improvementPotential).length;
    report += `Tests indicating potential improvements: ${improvementNeeded}/${analysisResults.length}\n\n`;

    // Improvement suggestions
    report += 'IMPROVEMENT SUGGESTIONS\n';
    report += '----------------------\n\n';

    if (improvementSuggestions.length === 0) {
        report += 'No significant improvement opportunities identified.\n\n';
    } else {
        improvementSuggestions.forEach((suggestion, index) => {
            report += `${index + 1}. ${suggestion.type.toUpperCase()} - ${suggestion.parameter}:\n`;
            report += `   Current average: ${suggestion.currentAverage}\n`;
            report += `   Suggested value: ${suggestion.suggestedAverage}\n`;
            report += `   Found in ${suggestion.occurrences} test cases\n`;
            report += `   Relevant market conditions: ${suggestion.conditions.map(c =>
                `${c.marketConditions.currentSession}/${c.marketConditions.volatilityCategory}`
            ).join(', ')}\n\n`;
        });
    }

    // Individual test results
    report += 'INDIVIDUAL TEST RESULTS\n';
    report += '----------------------\n\n';

    analysisResults.forEach((result, index) => {
        report += `Test #${index + 1}: ${result.testFile}\n`;
        if (result.error) {
            report += `  ERROR: ${result.error}\n\n`;
            return;
        }

        report += `  Market Conditions: ${result.marketConditions.currentSession}, ${result.marketConditions.volatilityCategory}\n`;
        report += `  Similar historical sessions found: ${result.similarSessions.length}\n`;
        report += `  Optimal parameters confidence: ${result.optimalParameters.confidence}\n`;
        report += `  Average difference from optimal (Flazh): ${result.comparison.averageFlazhDifference.toFixed(2)}%\n`;
        report += `  Average difference from optimal (ATM): ${result.comparison.averageATMDifference.toFixed(2)}%\n`;
        report += `  Overall difference: ${result.comparison.overallDifference.toFixed(2)}%\n`;
        report += `  Improvement needed: ${result.improvementPotential ? 'YES' : 'NO'}\n\n`;

        if (result.improvementPotential) {
            report += '  Key parameter differences:\n';

            // Add Flazh differences
            Object.entries(result.comparison.flazhDifferences).forEach(([param, data]) => {
                if (data.percentDifference > IMPROVEMENT_THRESHOLD) {
                    report += `    FLAZH ${param}: ${data.recommended} vs optimal ${data.optimal} (${data.percentDifference.toFixed(2)}% diff)\n`;
                }
            });

            // Add ATM differences
            Object.entries(result.comparison.atmDifferences).forEach(([param, data]) => {
                if (data.percentDifference > IMPROVEMENT_THRESHOLD) {
                    report += `    ATM ${param}: ${data.recommended} vs optimal ${data.optimal} (${data.percentDifference.toFixed(2)}% diff)\n`;
                }
            });

            report += '\n';
        }
    });

    // Recommendations for next steps
    report += 'RECOMMENDED NEXT STEPS\n';
    report += '---------------------\n\n';

    if (improvementSuggestions.length === 0) {
        report += '1. Current recommendations appear to be in line with historical optimal values\n';
        report += '2. Continue monitoring performance with more data samples\n';
        report += '3. Consider testing in more varied market conditions\n';
    } else {
        report += '1. Consider adjusting the following algorithm parameters:\n';
        improvementSuggestions.slice(0, 3).forEach(suggestion => {
            report += `   - ${suggestion.type.toUpperCase()} ${suggestion.parameter} from ${suggestion.currentAverage} to ${suggestion.suggestedAverage}\n`;
        });
        report += '\n2. Update recommendation algorithm to better account for the following market conditions:\n';

        // Identify commonly problematic market conditions
        const conditionCounts = {};
        improvementSuggestions.forEach(suggestion => {
            suggestion.conditions.forEach(condition => {
                const key = `${condition.marketConditions.currentSession}/${condition.marketConditions.volatilityCategory}`;
                conditionCounts[key] = (conditionCounts[key] || 0) + 1;
            });
        });

        // Sort and display top conditions
        Object.entries(conditionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .forEach(([condition, count]) => {
                report += `   - ${condition} (found in ${count} improvement suggestions)\n`;
            });

        report += '\n3. Collect more historical performance data for these specific market conditions\n';
    }

    return report;
}

// Helper function to calculate variance
function calculateVariance(values) {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

    return variance;
}

// Start the analysis
main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
// C:\TradingDashboard\server\test\test-enhanced-similarity.js

/**
 * Test Script for Enhanced Similarity Matching
 * Tests the improved backtesting similarity matching functionality
 */

const mongoose = require('mongoose');
const backtestingResultsService = require('../services/backtestingResultsService');
const Backtest = require('../models/backtest');

// MongoDB connection string
const dbConnection = 'mongodb://localhost:27017/trading-dashboard';

// Sample market conditions for testing
const testMarketConditions = [
    {
        name: "Current Market",
        timeOfDay: "Morning",
        sessionType: "Regular",
        volatilityScore: 6.5,
        atr: 42,
        volume: 15000,
        trend: "bullish",
        overnightRange: 65,
        priceRange: 85,
        dailyVolatility: 1.8
    },
    {
        name: "High Volatility Market",
        timeOfDay: "Morning",
        sessionType: "High Volatility",
        volatilityScore: 8.7,
        atr: 75,
        volume: 24000,
        trend: "bullish_strong",
        overnightRange: 120,
        priceRange: 150,
        dailyVolatility: 3.2
    },
    {
        name: "Low Volatility Market",
        timeOfDay: "Afternoon",
        sessionType: "Low Volatility",
        volatilityScore: 3.2,
        atr: 28,
        volume: 8500,
        trend: "neutral",
        overnightRange: 35,
        priceRange: 42,
        dailyVolatility: 0.9
    }
];

// Main test function
async function runEnhancedSimilarityTest() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(dbConnection);
        console.log('Connected to MongoDB');

        console.log('\n=======================================');
        console.log('ENHANCED SIMILARITY MATCHING TEST');
        console.log('=======================================\n');

        // 1. Test similarity calculation between different market conditions
        console.log('Testing similarity calculation between market conditions:');
        console.log('-------------------------------------------------------');

        const similarities = [];

        for (let i = 0; i < testMarketConditions.length; i++) {
            for (let j = 0; j < testMarketConditions.length; j++) {
                const condition1 = testMarketConditions[i];
                const condition2 = testMarketConditions[j];

                const similarity = backtestingResultsService.calculateMarketSimilarity(
                    condition1,
                    condition2
                );

                similarities.push({
                    market1: condition1.name,
                    market2: condition2.name,
                    similarityScore: similarity.score,
                    topMetrics: Object.entries(similarity.metricScores)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([key, value]) => ({ metric: key, score: value }))
                });
            }
        }

        // Display similarity results
        for (const sim of similarities) {
            console.log(`${sim.market1} vs ${sim.market2}: ${sim.similarityScore.toFixed(2)}%`);

            // Only show detailed breakdown for non-identical comparisons
            if (sim.market1 !== sim.market2) {
                console.log('  Top matching metrics:');
                for (const metric of sim.topMetrics) {
                    console.log(`    - ${metric.metric}: ${(metric.score * 100).toFixed(2)}%`);
                }
                console.log();
            }
        }

        // 2. Test getting backtests by similarity
        console.log('\nTesting backtest retrieval by similarity:');
        console.log('---------------------------------------');

        // Get backtest count for reference
        const totalBacktests = await Backtest.countDocuments({});
        console.log(`Total backtests in database: ${totalBacktests}`);

        // Test with each market condition
        for (const condition of testMarketConditions) {
            console.log(`\nTesting with ${condition.name} conditions:`);

            const filters = {
                timeOfDay: condition.timeOfDay,
                sessionType: condition.sessionType
            };

            const similarBacktests = await backtestingResultsService.getBacktestsBySimilarity(
                condition,
                filters,
                5
            );

            console.log(`Found ${similarBacktests.length} similar backtests`);

            if (similarBacktests.length > 0) {
                console.log('Top 3 most similar backtests:');

                const topBacktests = similarBacktests.slice(0, 3);
                for (let i = 0; i < topBacktests.length; i++) {
                    const backtest = topBacktests[i];
                    console.log(`  ${i + 1}. ${backtest.backtest.name} (${backtest.similarityScore.toFixed(2)}%)`);

                    // Show top matching metrics
                    const topMetrics = Object.entries(backtest.similarityDetails.metricScores)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3);

                    console.log('     Top matching metrics:');
                    for (const [metric, score] of topMetrics) {
                        console.log(`     - ${metric}: ${(score * 100).toFixed(2)}%`);
                    }
                }
            } else {
                console.log('No matching backtests found');
            }
        }

        // 3. Test performance metrics with enhanced similarity
        console.log('\nTesting performance metrics with enhanced similarity:');
        console.log('--------------------------------------------------');

        for (const condition of testMarketConditions) {
            console.log(`\nGetting performance metrics for ${condition.name}:`);

            const metrics = await backtestingResultsService.getPerformanceMetrics(
                condition.timeOfDay,
                condition.sessionType,
                condition.volatilityScore
            );

            if (metrics.success) {
                console.log(`Found ${metrics.sampleSize} similar backtests with confidence level: ${metrics.confidenceLevel}`);
                console.log(`Average similarity score: ${metrics.averageSimilarity.toFixed(2)}%`);
                console.log(`Win rate: ${(metrics.winRate * 100).toFixed(2)}%`);
                console.log(`Profit factor: ${metrics.profitFactor.toFixed(2)}`);

                console.log('\nRecommended adjustments:');
                console.log(`- Stop Loss: ${metrics.adjustmentFactors.stopLossAdjustment.toFixed(2)}x`);
                console.log(`- Target: ${metrics.adjustmentFactors.targetAdjustment.toFixed(2)}x`);
                console.log(`- Trailing Stop: ${metrics.adjustmentFactors.trailingStopAdjustment.toFixed(2)}x`);

                if (metrics.similarityDetails && metrics.similarityDetails.length > 0) {
                    console.log('\nTop backtest matches:');
                    for (const detail of metrics.similarityDetails) {
                        console.log(`- ${detail.name}: ${detail.similarityScore.toFixed(2)}%`);
                    }
                }
            } else {
                console.log('No valid metrics found - using default values');
                console.log(`Default adjustments: Stop Loss ${metrics.adjustmentFactors.stopLossAdjustment.toFixed(2)}x, Target ${metrics.adjustmentFactors.targetAdjustment.toFixed(2)}x`);
            }
        }

        console.log('\n=======================================');
        console.log('TEST COMPLETED SUCCESSFULLY');
        console.log('=======================================\n');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Test failed with error:', error);
        try {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        } catch (e) {
            console.error('Error disconnecting from MongoDB:', e);
        }
    }
}

// Run the test
runEnhancedSimilarityTest()
    .then(() => {
        console.log('Test script execution completed');
    })
    .catch(err => {
        console.error('Error running test script:', err);
    });
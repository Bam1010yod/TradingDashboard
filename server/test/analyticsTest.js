/**
 * Simple test methods for the performance analytics module
 */

const analyticsService = require('../services/analyticsService');
const journalService = require('../services/journalService');
const mongoose = require('mongoose');

/**
 * Ensure mongoose connection before running tests
 */
async function ensureMongooseConnection() {
  if (mongoose.connection.readyState !== 1) {
    try {
      console.log('Setting up test database connection...');
      await mongoose.connect('mongodb://localhost:27017/tradingDashboard');
    } catch (error) {
      console.warn('Could not connect to MongoDB, but proceeding with test anyway:', error.message);
    }
  }
}

/**
 * Create sample trades for testing
 */
async function createSampleTrades() {
  try {
    console.log('Creating sample trades for analytics testing...');
    
    // Create array of sample trades
    const sampleTrades = [
      {
        instrument: 'ES',
        direction: 'LONG',
        quantity: 1,
        entryPrice: 4500,
        exitPrice: 4520,
        entryTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
        exitTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10 + 1000 * 60 * 60), // 1 hour later
        status: 'CLOSED',
        profitLoss: 20,
        strategy: 'Breakout',
        session: 'NEW_YORK',
        tags: ['Momentum', 'Trend'],
        marketConditions: {
          volatility: 0.4,
          trend: 'UP',
          volume: 1200
        }
      },
      {
        instrument: 'ES',
        direction: 'SHORT',
        quantity: 1,
        entryPrice: 4480,
        exitPrice: 4460,
        entryTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9), // 9 days ago
        exitTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9 + 1000 * 60 * 60 * 2), // 2 hours later
        status: 'CLOSED',
        profitLoss: 20,
        strategy: 'Reversal',
        session: 'NEW_YORK',
        tags: ['Reversal', 'Oversold'],
        marketConditions: {
          volatility: 0.6,
          trend: 'DOWN',
          volume: 1500
        }
      },
      {
        instrument: 'NQ',
        direction: 'LONG',
        quantity: 1,
        entryPrice: 15000,
        exitPrice: 14950,
        entryTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
        exitTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8 + 1000 * 60 * 60), // 1 hour later
        status: 'CLOSED',
        profitLoss: -50,
        strategy: 'Breakout',
        session: 'LONDON',
        tags: ['Failed Breakout'],
        marketConditions: {
          volatility: 0.7,
          trend: 'SIDEWAYS',
          volume: 900
        }
      },
      {
        instrument: 'ES',
        direction: 'LONG',
        quantity: 2,
        entryPrice: 4510,
        exitPrice: 4540,
        entryTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
        exitTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 60 * 3), // 3 hours later
        status: 'CLOSED',
        profitLoss: 60,
        strategy: 'Trend Following',
        session: 'NEW_YORK',
        tags: ['Trend', 'Momentum'],
        marketConditions: {
          volatility: 0.3,
          trend: 'UP',
          volume: 1100
        }
      },
      {
        instrument: 'NQ',
        direction: 'SHORT',
        quantity: 1,
        entryPrice: 15200,
        exitPrice: 15250,
        entryTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
        exitTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6 + 1000 * 60 * 60 * 2), // 2 hours later
        status: 'CLOSED',
        profitLoss: -50,
        strategy: 'Reversal',
        session: 'ASIA',
        tags: ['Failed Reversal'],
        marketConditions: {
          volatility: 0.8,
          trend: 'UP',
          volume: 800
        }
      }
    ];
    
    // Track created trades
    const createdTrades = [];
    
    // Save each trade
    for (const trade of sampleTrades) {
      const result = await journalService.logTrade(trade);
      createdTrades.push(result);
    }
    
    console.log(`Created ${createdTrades.length} sample trades for testing`);
    return createdTrades;
  } catch (error) {
    console.error('Error creating sample trades:', error);
    throw error;
  }
}

/**
 * Test performance metrics
 */
async function testPerformanceMetrics() {
  try {
    console.log('Testing performance metrics calculation...');
    
    const metrics = await analyticsService.calculatePerformanceMetrics();
    
    console.log('Performance metrics calculated successfully!');
    console.log('Total trades:', metrics.totalTrades);
    console.log('Win rate:', metrics.metrics.basicMetrics.winRate.toFixed(2) + '%');
    console.log('Profit factor:', metrics.metrics.basicMetrics.profitFactor.toFixed(2));
    console.log('Expectancy:', metrics.metrics.ratios.expectancy.toFixed(2));
    
    return metrics;
  } catch (error) {
    console.error('Error testing performance metrics:', error);
    throw error;
  }
}

/**
 * Test financial ratios
 */
async function testFinancialRatios() {
  try {
    console.log('Testing financial ratios calculation...');
    
    const ratios = await analyticsService.calculateFinancialRatios();
    
    console.log('Financial ratios calculated successfully!');
    console.log('Sharpe ratio:', ratios.ratios.sharpeRatio.toFixed(2));
    console.log('Sortino ratio:', ratios.ratios.sortinoRatio.toFixed(2));
    console.log('Calmar ratio:', ratios.ratios.calmarRatio.toFixed(2));
    
    return ratios;
  } catch (error) {
    console.error('Error testing financial ratios:', error);
    throw error;
  }
}

/**
 * Test market correlation analysis
 */
async function testMarketCorrelation() {
  try {
    console.log('Testing market condition correlation analysis...');
    
    const correlation = await analyticsService.analyzeMarketConditionCorrelation();
    
    console.log('Market correlation analyzed successfully!');
    if (correlation.correlations.trend) {
      console.log('Trend correlations:', correlation.correlations.trend.length);
    }
    if (correlation.correlations.volatility) {
      console.log('Volatility correlations:', correlation.correlations.volatility.length);
    }
    if (correlation.summary) {
      console.log('Summary insights:', correlation.summary);
    }
    
    return correlation;
  } catch (error) {
    console.error('Error testing market correlation:', error);
    throw error;
  }
}

// If this file is run directly
if (require.main === module) {
  ensureMongooseConnection()
    .then(() => createSampleTrades())
    .then(() => testPerformanceMetrics())
    .then(() => testFinancialRatios())
    .then(() => testMarketCorrelation())
    .then(() => {
      console.log('All analytics tests completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = {
  createSampleTrades,
  testPerformanceMetrics,
  testFinancialRatios,
  testMarketCorrelation
};
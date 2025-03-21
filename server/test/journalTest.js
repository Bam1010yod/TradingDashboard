/**
 * Simple test methods for the trade journal
 */

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
 * Test logging a trade
 */
async function testLogTrade() {
    try {
        console.log('Testing trade logging...');

        // Ensure mongoose connection
        await ensureMongooseConnection();

        // Sample trade data
        const tradeData = {
            instrument: 'ES',
            direction: 'LONG',
            quantity: 1,
            entryPrice: 4500,
            stopLoss: 4480,
            takeProfit: 4530,
            entryTime: new Date(),
            status: 'OPEN',
            strategy: 'MA Crossover',
            session: 'NEW_YORK',
            tags: ['Breakout', 'Trend'],
            notes: 'Strong momentum on break of resistance',
            marketConditions: {
                volatility: 0.8,
                trend: 'UP',
                volume: 1200
            }
        };

        // Log the trade
        const trade = await journalService.logTrade(tradeData);

        console.log('Trade logged successfully!');
        console.log('Trade ID:', trade.tradeId);
        console.log('Entry time:', trade.entryTime);
        console.log('Status:', trade.status);

        return trade;
    } catch (error) {
        console.error('Error testing trade logging:', error);
        throw error;
    }
}

/**
 * Test updating a trade
 */
async function testUpdateTrade(tradeId) {
    try {
        console.log('Testing trade update...');

        // Update data to close the trade
        const updateData = {
            status: 'CLOSED',
            exitPrice: 4520,
            exitTime: new Date(),
            fees: 2.5,
            rating: 4,
            notes: 'Good entry with strong momentum, took partial profits too early'
        };

        // Update the trade
        const updatedTrade = await journalService.updateTrade(tradeId, updateData);

        console.log('Trade updated successfully!');
        console.log('Exit price:', updatedTrade.exitPrice);
        console.log('Profit/Loss:', updatedTrade.profitLoss);
        console.log('Net P&L:', updatedTrade.netProfitLoss);

        return updatedTrade;
    } catch (error) {
        console.error('Error testing trade update:', error);
        throw error;
    }
}

/**
 * Test searching for trades
 */
async function testSearchTrades() {
    try {
        console.log('Testing trade search...');

        // Search filters
        const filters = {
            instrument: 'ES',
            status: 'CLOSED'
        };

        // Pagination
        const pagination = {
            page: 1,
            limit: 10
        };

        // Search trades
        const result = await journalService.searchTrades(filters, pagination);

        console.log('Search completed successfully!');
        console.log('Total trades found:', result.pagination.total);
        console.log('Number of trades returned:', result.trades.length);

        return result;
    } catch (error) {
        console.error('Error testing trade search:', error);
        throw error;
    }
}

/**
 * Test getting trade statistics
 */
async function testTradeStatistics() {
    try {
        console.log('Testing trade statistics...');

        // Get statistics for all trades
        const stats = await journalService.getTradeStatistics();

        console.log('Statistics calculated successfully!');
        console.log('Total trades:', stats.totalTrades);
        console.log('Win rate:', stats.winRate.toFixed(2) + '%');
        console.log('Average win:', stats.averageWin.toFixed(2));
        console.log('Average loss:', stats.averageLoss.toFixed(2));
        console.log('Net profit:', stats.netProfit.toFixed(2));

        return stats;
    } catch (error) {
        console.error('Error testing trade statistics:', error);
        throw error;
    }
}

// If this file is run directly
if (require.main === module) {
    testLogTrade()
        .then(trade => testUpdateTrade(trade.tradeId))
        .then(() => testSearchTrades())
        .then(() => testTradeStatistics())
        .then(() => {
            console.log('All journal tests completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = {
    testLogTrade,
    testUpdateTrade,
    testSearchTrades,
    testTradeStatistics
};
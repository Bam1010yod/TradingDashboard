const mongoose = require('mongoose');

/**
 * Schema for storing backtest results
 */
const backtestSchema = new mongoose.Schema({
    // Basic information
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },

    // Strategy parameters
    strategyParams: {
        type: Object,
        required: true
    },

    // Test configuration
    instrument: {
        type: String,
        required: true
    },
    timeframe: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },

    // Results
    trades: [{
        entryTime: Date,
        exitTime: Date,
        entryPrice: Number,
        exitPrice: Number,
        quantity: Number,
        direction: {
            type: String,
            enum: ['LONG', 'SHORT']
        },
        profitLoss: Number,
        marketConditions: Object
    }],

    // Performance metrics
    performanceMetrics: {
        totalTrades: Number,
        winningTrades: Number,
        losingTrades: Number,
        winRate: Number,
        averageWin: Number,
        averageLoss: Number,
        netProfit: Number,
        maxDrawdown: Number,
        profitFactor: Number
    }
});

module.exports = mongoose.model('Backtest', backtestSchema);
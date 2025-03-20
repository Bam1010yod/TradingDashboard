const mongoose = require('mongoose');

const performanceRecordSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    session: {
        type: String,
        enum: ['LateMorning', 'EarlyAfternoon', 'PreClose'],
        required: true
    },
    atmTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AtmTemplate'
    },
    flazhTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlazhTemplate'
    },
    marketConditions: {
        volatility: {
            type: String,
            enum: ['Low', 'Medium', 'High']
        },
        trend: {
            type: String,
            enum: ['Bullish', 'Bearish', 'Sideways']
        }
    },
    performance: {
        profitLoss: Number,
        winCount: Number,
        lossCount: Number,
        totalTrades: Number,
        winRate: Number,
        averageWin: Number,
        averageLoss: Number,
        largestWin: Number,
        largestLoss: Number
    }
});

module.exports = mongoose.model('PerformanceRecord', performanceRecordSchema);

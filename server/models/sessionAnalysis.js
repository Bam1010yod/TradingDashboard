// File path: C:\TradingDashboard\server\models\sessionAnalysis.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SessionAnalysisSchema = new Schema({
    session: {
        type: String,
        required: true,
        enum: ['preMarket', 'regularHours', 'postMarket', 'overnight']
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    averageVolatility: {
        type: Number,
        default: 0
    },
    priceRange: {
        high: { type: Number, default: 0 },
        low: { type: Number, default: 0 },
        range: { type: Number, default: 0 }
    },
    momentum: {
        type: Number,
        default: 0
    },
    volumeProfile: {
        total: { type: Number, default: 0 },
        distribution: { type: Schema.Types.Mixed, default: {} }
    }
});

// Create compound index for efficient querying
SessionAnalysisSchema.index({ session: 1, date: -1 });

module.exports = mongoose.model('SessionAnalysis', SessionAnalysisSchema);
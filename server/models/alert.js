const mongoose = require('mongoose');

/**
 * Schema for storing alert configurations and history
 */
const alertSchema = new mongoose.Schema({
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

    // Alert type and configuration
    type: {
        type: String,
        enum: ['PROP_FIRM_LIMIT', 'MARKET_CONDITION', 'SYSTEM_ISSUE', 'TRADE_OPPORTUNITY', 'CUSTOM'],
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },

    // Condition settings
    conditions: {
        // Prop firm limit alerts
        maxDailyLossPercent: Number,
        maxDrawdownPercent: Number,
        positionSizeLimit: Number,

        // Market condition alerts
        instrument: String,
        volatilityThreshold: Number,
        volumeThreshold: Number,
        priceLevel: Number,

        // System issue alerts
        componentName: String,

        // Custom conditions (for flexible alerts)
        customCondition: String,
        customThreshold: Number
    },

    // Notification settings
    notifications: {
        inApp: {
            type: Boolean,
            default: true
        },
        email: {
            enabled: {
                type: Boolean,
                default: false
            },
            address: String
        },
        sound: {
            type: Boolean,
            default: false
        }
    },

    // Alert history
    history: [{
        triggeredAt: {
            type: Date,
            default: Date.now
        },
        message: String,
        value: Number,
        threshold: Number,
        acknowledged: {
            type: Boolean,
            default: false
        },
        acknowledgedAt: Date
    }]
});

// Add indexes for common queries
alertSchema.index({ type: 1 });
alertSchema.index({ active: 1 });
alertSchema.index({ 'history.triggeredAt': -1 });

module.exports = mongoose.model('Alert', alertSchema);
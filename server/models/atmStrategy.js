// C:\TradingDashboard\server\models\atmStrategy.js

const mongoose = require('mongoose');

// Bracket schema for stop loss and profit target settings
const BracketSchema = new mongoose.Schema({
    quantity: { type: Number, required: true },
    stopLoss: { type: Number, required: true },
    stopStrategy: {
        autoBreakEvenPlus: { type: Number, default: 0 },
        autoBreakEvenProfitTrigger: { type: Number, default: 0 },
        autoTrailSteps: { type: Array, default: [] },
        isSimStopEnabled: { type: Boolean, default: false },
        volumeTrigger: { type: Number, default: 0 }
    },
    target: { type: Number, required: true }
});

// Main ATM Strategy schema
const AtmStrategySchema = new mongoose.Schema({
    // Template identity
    templateName: { type: String, required: true, unique: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },

    // Core ATM settings
    calculationMode: { type: String, enum: ['Ticks', 'Price'], default: 'Ticks' },
    defaultQuantity: { type: Number, default: 1 },
    timeInForce: { type: String, default: 'Gtc' },

    // Stop loss and profit target configuration
    brackets: [BracketSchema],

    // Advanced settings
    isChase: { type: Boolean, default: false },
    chaseLimit: { type: Number, default: 0 },
    isTargetChase: { type: Boolean, default: false },
    reverseAtStop: { type: Boolean, default: false },
    reverseAtTarget: { type: Boolean, default: false },

    // Metadata
    marketCondition: { type: String, enum: ['Opening', 'Morning', 'Lunch', 'Early_Afternoon', 'Late_Afternoon', 'Evening', 'Overnight', 'High_Volatility', 'Low_Volatility', 'Normal_Volatility'], default: 'Normal_Volatility' },
    description: { type: String },
    lastModified: { type: Date, default: Date.now },

    // Raw XML content for reference
    xmlContent: { type: String, required: true }
});

// Add index for faster lookups by template name and market condition
AtmStrategySchema.index({ templateName: 1 });
AtmStrategySchema.index({ marketCondition: 1 });

// Create and export the model
const AtmStrategy = mongoose.model('AtmStrategy', AtmStrategySchema);

module.exports = AtmStrategy;
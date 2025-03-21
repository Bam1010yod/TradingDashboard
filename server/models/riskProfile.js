const mongoose = require('mongoose');

/**
 * Schema for storing risk profiles and settings
 */
const riskProfileSchema = new mongoose.Schema({
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
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Risk parameters
  maxDailyLoss: {
    type: Number,
    required: true
  },
  maxPositionSize: {
    type: Number,
    required: true
  },
  maxOpenPositions: {
    type: Number,
    default: 1
  },
  
  // Account risk limits
  accountSizeUSD: {
    type: Number,
    required: true
  },
  accountRiskPerTradePercent: {
    type: Number,
    required: true
  },
  
  // Prop firm specific settings
  propFirmSettings: {
    maxDailyDrawdownPercent: Number,
    maxTotalDrawdownPercent: Number,
    profitTargetPercent: Number,
    minimumTradingDays: Number,
    maxConsecutiveLossDays: Number
  },
  
  // Alert thresholds (as percentage of limits)
  alertThresholds: {
    dailyLossWarningPercent: {
      type: Number,
      default: 80
    },
    totalDrawdownWarningPercent: {
      type: Number,
      default: 80
    }
  }
});

module.exports = mongoose.model('RiskProfile', riskProfileSchema);
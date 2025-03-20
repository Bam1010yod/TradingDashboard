// C:\TradingDashboard\server\models\flazhInfinity.js

const mongoose = require('mongoose');

// Main Flazh Infinity schema
const FlazhInfinitySchema = new mongoose.Schema({
  // Template identity
  templateName: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  
  // Core Flazh settings - moving averages
  maType: { type: String, enum: ['SMA', 'EMA', 'WMA', 'TMA', 'VWMA'], default: 'EMA' },
  fastPeriod: { type: Number, required: true },
  fastRange: { type: Number, required: true },
  mediumPeriod: { type: Number, required: true },
  mediumRange: { type: Number, required: true },
  slowPeriod: { type: Number, required: true },
  slowRange: { type: Number, required: true },
  
  // Filter settings
  filterEnabled: { type: Boolean, default: true },
  filterMultiplier: { type: Number, default: 10 },
  
  // Retracement settings
  searchLimit: { type: Number, default: 10 },
  minOffset: { type: Number, default: 5 },
  minRetracementMode: { type: String, enum: ['Percent', 'Price'], default: 'Percent' },
  minRetracementPercent: { type: Number, default: 50 },
  
  // Session management
  sessionsManagementEnabled: { type: Boolean, default: false },
  timeSettings: {
    time1Enabled: { type: Boolean, default: false },
    time1Start: { type: String, default: '190000' },
    time1Duration: { type: String, default: '40000' },
    time2Enabled: { type: Boolean, default: false },
    time2Start: { type: String, default: '30000' },
    time2Duration: { type: String, default: '40000' },
    time3Enabled: { type: Boolean, default: false },
    time3Start: { type: String, default: '80000' },
    time3Duration: { type: String, default: '40000' }
  },
  
  // Trading conditions
  conditionTrend: { type: Boolean, default: false },
  conditionScalping: { type: Boolean, default: true },
  
  // Chart period settings
  barsPeriod: {
    periodType: { type: String, default: 'Minute' },
    baseValue: { type: Number, default: 1 },
    value: { type: Number },
    value2: { type: Number }
  },
  
  // Metadata
  marketCondition: { type: String, enum: ['Opening', 'Morning', 'Lunch', 'Early_Afternoon', 'Late_Afternoon', 'Evening', 'Overnight', 'High_Volatility', 'Low_Volatility', 'Normal_Volatility'], default: 'Normal_Volatility' },
  description: { type: String },
  userNote: { type: String },
  lastModified: { type: Date, default: Date.now },
  
  // Raw XML content for reference
  xmlContent: { type: String, required: true }
});

// Add index for faster lookups by template name and market condition
FlazhInfinitySchema.index({ templateName: 1 });
FlazhInfinitySchema.index({ marketCondition: 1 });

// Create and export the model
const FlazhInfinity = mongoose.model('FlazhInfinity', FlazhInfinitySchema);

module.exports = FlazhInfinity;
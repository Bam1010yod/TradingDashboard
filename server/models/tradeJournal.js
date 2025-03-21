const mongoose = require('mongoose');

const tradeJournalSchema = new mongoose.Schema({
  // Trade identification
  tradeId: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Trade details
  instrument: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    enum: ['LONG', 'SHORT'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  entryPrice: {
    type: Number,
    required: true
  },
  exitPrice: Number,
  stopLoss: Number,
  takeProfit: Number,
  
  // Trade status
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'CANCELED'],
    default: 'OPEN'
  },
  entryTime: {
    type: Date,
    required: true
  },
  exitTime: Date,
  
  // Performance metrics
  profitLoss: Number,
  profitLossPercent: Number,
  fees: Number,
  netProfitLoss: Number,
  
  // Strategy information
  strategy: String,
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template'
  },
  parameters: Object,
  
  // Market conditions
  marketConditions: {
    volatility: Number,
    trend: String,
    volume: Number,
    marketNews: [String],
    keyLevels: [Number]
  },
  
  // Tags and notes
  tags: [String],
  notes: String,
  
  // Trade evaluation
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  mistakes: [String],
  improvements: [String],
  
  // Session information
  session: {
    type: String,
    enum: ['LONDON', 'NEW_YORK', 'ASIA', 'OTHER']
  },
  dayOfWeek: String,
  
  // Media
  screenshots: [String],
  
  // Custom fields
  customFields: Object
});

// Add indexes for common queries
tradeJournalSchema.index({ timestamp: -1 });
tradeJournalSchema.index({ instrument: 1 });
tradeJournalSchema.index({ status: 1 });
tradeJournalSchema.index({ tags: 1 });

module.exports = mongoose.model('TradeJournal', tradeJournalSchema);
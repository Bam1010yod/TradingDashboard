const mongoose = require('mongoose');

// ATM Strategy Schema
const atmStrategySchema = new mongoose.Schema({
    templateName: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    fileName: {
        type: String
    },
    filePath: {
        type: String
    },
    calculationMode: {
        type: String,
        enum: ['Ticks', 'Price'],
        default: 'Ticks'
    },
    defaultQuantity: {
        type: Number,
        default: 1
    },
    timeInForce: {
        type: String,
        enum: ['Day', 'Gtc', 'Gtd'],
        default: 'Gtc'
    },
    brackets: [{
        quantity: {
            type: Number,
            default: 1
        },
        stopLoss: {
            type: Number,
            required: true
        },
        target: {
            type: Number,
            required: true
        },
        stopStrategy: {
            autoBreakEvenPlus: {
                type: Number,
                default: 0
            },
            autoBreakEvenProfitTrigger: {
                type: Number,
                default: 0
            },
            autoTrailSteps: [{}],
            isSimStopEnabled: {
                type: Boolean,
                default: false
            },
            volumeTrigger: {
                type: Number,
                default: 0
            }
        }
    }],
    isChase: {
        type: Boolean,
        default: false
    },
    chaseLimit: {
        type: Number,
        default: 0
    },
    isTargetChase: {
        type: Boolean,
        default: false
    },
    reverseAtStop: {
        type: Boolean,
        default: false
    },
    reverseAtTarget: {
        type: Boolean,
        default: false
    },
    marketCondition: {
        type: String,
        default: 'Normal_Volatility'
    },
    session: {
        type: String,
        enum: ['Late_Morning', 'Early_Afternoon', 'Pre_Close', 'Unknown_Session'],
        default: 'Unknown_Session'
    },
    volatility: {
        type: String,
        enum: ['Low_Volatility', 'Medium_Volatility', 'High_Volatility', 'Normal_Volatility'],
        default: 'Normal_Volatility'
    },
    dayOfWeek: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', null],
        default: null
    },
    description: {
        type: String
    },
    xmlContent: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastModified: {
        type: Date,
        default: Date.now
    }
});

// Create model
const AtmStrategy = mongoose.model('AtmStrategy', atmStrategySchema);

module.exports = AtmStrategy;
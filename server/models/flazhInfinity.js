const mongoose = require('mongoose');

// Flazh Infinity Schema
const flazhInfinitySchema = new mongoose.Schema({
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
    maType: {
        type: String,
        enum: ['SMA', 'EMA', 'WMA', 'TEMA'],
        default: 'EMA'
    },
    fastPeriod: {
        type: Number,
        required: true
    },
    fastRange: {
        type: Number,
        required: true
    },
    mediumPeriod: {
        type: Number,
        required: true
    },
    mediumRange: {
        type: Number,
        required: true
    },
    slowPeriod: {
        type: Number,
        required: true
    },
    slowRange: {
        type: Number,
        required: true
    },
    filterEnabled: {
        type: Boolean,
        default: true
    },
    filterMultiplier: {
        type: Number,
        required: true
    },
    searchLimit: {
        type: Number,
        required: true
    },
    minOffset: {
        type: Number,
        required: true
    },
    minRetracementMode: {
        type: String,
        enum: ['Percent', 'Ticks'],
        default: 'Percent'
    },
    minRetracementPercent: {
        type: Number,
        default: 50
    },
    sessionsManagementEnabled: {
        type: Boolean,
        default: false
    },
    timeSettings: {
        time1Enabled: {
            type: Boolean,
            default: true
        },
        time1Start: {
            type: String,
            default: '190000'
        },
        time1Duration: {
            type: String,
            default: '40000'
        },
        time2Enabled: {
            type: Boolean,
            default: true
        },
        time2Start: {
            type: String,
            default: '30000'
        },
        time2Duration: {
            type: String,
            default: '40000'
        },
        time3Enabled: {
            type: Boolean,
            default: true
        },
        time3Start: {
            type: String,
            default: '80000'
        },
        time3Duration: {
            type: String,
            default: '40000'
        }
    },
    conditionTrend: {
        type: Boolean,
        default: false
    },
    conditionScalping: {
        type: Boolean,
        default: true
    },
    barsPeriod: {
        periodType: {
            type: String,
            default: 'Minute'
        },
        baseValue: {
            type: Number,
            default: 1
        },
        value: {
            type: Number,
            required: true
        },
        value2: {
            type: Number,
            required: true
        }
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
    userNote: {
        type: String
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
const FlazhInfinity = mongoose.model('FlazhInfinity', flazhInfinitySchema);

module.exports = FlazhInfinity;
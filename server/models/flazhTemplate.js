const mongoose = require('mongoose');

const flazhTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    barsPeriod: {
    periodType: String,
    value: Number,
    value2: Number
},
    maType: String,
    fastPeriod: Number,
    fastRange: Number,
    mediumPeriod: Number,
    mediumRange: Number,
    slowPeriod: Number,
    slowRange: Number,
    filterEnabled: Boolean,
    filterMultiplier: Number,
    searchLimit: Number,
    minOffset: Number,
    rawXml: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FlazhTemplate', flazhTemplateSchema);

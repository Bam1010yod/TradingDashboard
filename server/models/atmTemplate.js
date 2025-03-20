const mongoose = require('mongoose');

const atmTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    calculationMode: {
        type: String,
        enum: ['Ticks', 'Currency', 'Percent'],
        default: 'Ticks'
    },
    brackets: [{
        quantity: Number,
        stopLoss: Number,
        target: Number,
        stopStrategy: {
            autoBreakEvenPlus: Number,
            autoBreakEvenProfitTrigger: Number
        }
    }],
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

module.exports = mongoose.model('AtmTemplate', atmTemplateSchema);

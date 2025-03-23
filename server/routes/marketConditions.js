// Full path: C:\TradingDashboard\server\routes\marketConditions.js

const express = require('express');
const router = express.Router();
const marketConditionsService = require('../services/marketConditionsService');

// Get current market conditions
router.get('/', async (req, res) => {
    console.log('Market conditions endpoint hit');
    try {
        console.log('Calling analyzeMarketConditions()');
        const marketConditions = marketConditionsService.analyzeMarketConditions();
        console.log('Market conditions analysis result:', JSON.stringify(marketConditions).substring(0, 100) + '...');
        res.json(marketConditions);
    } catch (error) {
        console.error('Error in market conditions route:', error);
        // Return a fallback response instead of an error
        const fallback = {
            success: true,
            session: marketConditionsService.getCurrentSession(),
            volatility: 'MEDIUM_VOLATILITY',
            isFallback: true,
            currentTime: new Date().toISOString(),
            errorMessage: 'Using fallback market conditions due to an error'
        };
        console.log('Sending fallback:', JSON.stringify(fallback).substring(0, 100) + '...');
        res.json(fallback);
    }
});

module.exports = router;
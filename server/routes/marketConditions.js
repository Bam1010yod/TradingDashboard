// Full path: C:\TradingDashboard\server\routes\marketConditions.js

const express = require('express');
const router = express.Router();
const marketConditionsService = require('../services/analysis/marketConditionsService');

// Get current market conditions and parameter recommendations
router.get('/', async (req, res) => {
    try {
        const analysis = marketConditionsService.analyzeMarketConditions();
        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing market conditions:', error);
        res.status(500).json({ error: 'Failed to analyze market conditions' });
    }
});

// Get parameter recommendations for a specific session and volatility
router.get('/parameters/:session/:volatility', async (req, res) => {
    try {
        const { session, volatility } = req.params;

        // Validate inputs
        if (!marketConditionsService.TRADING_SESSIONS[session]) {
            return res.status(400).json({ error: 'Invalid session' });
        }

        if (!marketConditionsService.PARAMETER_ADJUSTMENTS[volatility]) {
            return res.status(400).json({ error: 'Invalid volatility category' });
        }

        const recommendations = marketConditionsService.getRecommendedParameters(
            session, volatility
        );

        res.json(recommendations);
    } catch (error) {
        console.error('Error getting parameter recommendations:', error);
        res.status(500).json({ error: 'Failed to get parameter recommendations' });
    }
});

// Get current trading session
router.get('/session', async (req, res) => {
    try {
        const timeStr = req.query.time; // Optional time parameter
        const session = marketConditionsService.getCurrentSession(timeStr);
        const sessionInfo = marketConditionsService.TRADING_SESSIONS[session];

        res.json({
            session,
            sessionInfo
        });
    } catch (error) {
        console.error('Error determining trading session:', error);
        res.status(500).json({ error: 'Failed to determine trading session' });
    }
});

module.exports = router;
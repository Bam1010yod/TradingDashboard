// File path: C:\TradingDashboard\server\routes\tradingSession.js

const express = require('express');
const router = express.Router();
const tradingSessionService = require('../services/tradingSessionService');

/**
 * Get current trading session
 * GET /api/session/current
 */
router.get('/current', (req, res) => {
    try {
        const session = tradingSessionService.getCurrentSession();
        res.json({ session });
    } catch (error) {
        console.error('Error getting current session:', error);
        res.status(500).json({ error: 'Failed to get current session' });
    }
});

/**
 * Get analysis for a trading session
 * GET /api/session/analysis/:session?
 */
router.get('/analysis/:session?', async (req, res) => {
    try {
        const session = req.params.session;
        const analysis = await tradingSessionService.analyzeSession(session);
        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing session:', error);
        res.status(500).json({ error: 'Failed to analyze session' });
    }
});

/**
 * Get recommended parameters for a trading session
 * GET /api/session/recommendations/:session?
 */
router.get('/recommendations/:session?', async (req, res) => {
    try {
        const session = req.params.session;
        const recommendations = await tradingSessionService.getRecommendedParameters(session);
        res.json(recommendations);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

/**
 * Analyze all sessions and return results
 * GET /api/session/analyze-all
 */
router.get('/analyze-all', async (req, res) => {
    try {
        const sessions = ['preMarket', 'regularHours', 'postMarket', 'overnight'];
        const results = {};

        for (const session of sessions) {
            results[session] = await tradingSessionService.analyzeSession(session);
        }

        res.json(results);
    } catch (error) {
        console.error('Error analyzing all sessions:', error);
        res.status(500).json({ error: 'Failed to analyze all sessions' });
    }
});

module.exports = router;
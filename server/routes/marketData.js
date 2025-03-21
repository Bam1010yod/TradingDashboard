/**
 * Market Data Routes
 * API endpoints for accessing market data
 */

const express = require('express');
const router = express.Router();
const marketDataService = require('../services/marketDataService');

/**
 * @route   GET /api/market-data
 * @desc    Get latest market data
 * @access  Public
 */
router.get('/', (req, res) => {
    const data = marketDataService.getLatestMarketData();
    if (!data) {
        return res.status(404).json({ message: 'No market data available yet' });
    }
    res.json(data);
});

/**
 * @route   GET /api/market-data/history
 * @desc    Get historical market data
 * @access  Public
 */
router.get('/history', async (req, res) => {
    try {
        // Parse query parameters
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

        const data = await marketDataService.getHistoricalMarketData(startDate, endDate);
        res.json(data);
    } catch (error) {
        console.error('Error retrieving historical market data:', error);
        res.status(500).json({ message: 'Error retrieving historical market data' });
    }
});

/**
 * @route   GET /api/market-data/volatility
 * @desc    Get current volatility level
 * @access  Public
 */
router.get('/volatility', (req, res) => {
    const data = marketDataService.getLatestMarketData();
    if (!data) {
        return res.status(404).json({ message: 'No market data available yet' });
    }

    res.json({
        volatilityScore: data.volatilityScore,
        volatilityLevel: data.volatilityLevel
    });
});

module.exports = router;
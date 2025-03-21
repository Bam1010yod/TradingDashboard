/**
 * Market News Routes
 * API endpoints for accessing market news
 */

const express = require('express');
const router = express.Router();
const marketNewsService = require('../services/marketNewsService');

/**
 * @route   GET /api/market-news
 * @desc    Get latest market news
 * @access  Public
 */
router.get('/', (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const news = marketNewsService.getLatestNews(limit);
        res.json(news);
    } catch (error) {
        console.error('Error retrieving market news:', error);
        res.status(500).json({ message: 'Error retrieving market news' });
    }
});

/**
 * @route   GET /api/market-news/relevant
 * @desc    Get high-relevance market news
 * @access  Public
 */
router.get('/relevant', (req, res) => {
    try {
        const minRelevance = req.query.minRelevance ? parseInt(req.query.minRelevance) : 7;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;

        const news = marketNewsService.getRelevantNews(minRelevance, limit);
        res.json(news);
    } catch (error) {
        console.error('Error retrieving relevant market news:', error);
        res.status(500).json({ message: 'Error retrieving relevant market news' });
    }
});

/**
 * @route   GET /api/market-news/history
 * @desc    Get historical market news
 * @access  Public
 */
router.get('/history', async (req, res) => {
    try {
        // Parse query parameters
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;

        const news = await marketNewsService.getHistoricalNews(startDate, endDate, limit);
        res.json(news);
    } catch (error) {
        console.error('Error retrieving historical market news:', error);
        res.status(500).json({ message: 'Error retrieving historical market news' });
    }
});

module.exports = router;
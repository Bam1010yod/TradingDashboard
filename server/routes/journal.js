/**
 * Trade Journal API Routes
 */

const express = require('express');
const router = express.Router();
const journalService = require('../services/journalService');

/**
 * @route   POST /api/journal
 * @desc    Log a new trade
 * @access  Public
 */
router.post('/', async (req, res) => {
    try {
        const trade = await journalService.logTrade(req.body);
        res.status(201).json({
            success: true,
            data: trade
        });
    } catch (error) {
        console.error('Error in log trade route:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/journal/:tradeId
 * @desc    Get a single trade
 * @access  Public
 */
router.get('/:tradeId', async (req, res) => {
    try {
        const trade = await journalService.getTrade(req.params.tradeId);
        res.json({
            success: true,
            data: trade
        });
    } catch (error) {
        console.error('Error in get trade route:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/journal/:tradeId
 * @desc    Update a trade
 * @access  Public
 */
router.put('/:tradeId', async (req, res) => {
    try {
        const trade = await journalService.updateTrade(req.params.tradeId, req.body);
        res.json({
            success: true,
            data: trade
        });
    } catch (error) {
        console.error('Error in update trade route:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/journal/:tradeId
 * @desc    Delete a trade
 * @access  Public
 */
router.delete('/:tradeId', async (req, res) => {
    try {
        const success = await journalService.deleteTrade(req.params.tradeId);

        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Trade not found'
            });
        }

        res.json({
            success: true,
            message: 'Trade deleted successfully'
        });
    } catch (error) {
        console.error('Error in delete trade route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/journal
 * @desc    Search trades with filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        // Extract filters from query parameters
        const filters = {};

        if (req.query.instrument) filters.instrument = req.query.instrument;
        if (req.query.direction) filters.direction = req.query.direction;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.strategy) filters.strategy = req.query.strategy;
        if (req.query.session) filters.session = req.query.session;
        if (req.query.dayOfWeek) filters.dayOfWeek = req.query.dayOfWeek;
        if (req.query.startDate) filters.startDate = req.query.startDate;
        if (req.query.endDate) filters.endDate = req.query.endDate;
        if (req.query.minPnL) filters.minPnL = parseFloat(req.query.minPnL);
        if (req.query.maxPnL) filters.maxPnL = parseFloat(req.query.maxPnL);

        // Tags (comma-separated)
        if (req.query.tags) {
            filters.tags = req.query.tags.split(',').map(tag => tag.trim());
        }

        // Pagination
        const pagination = {
            page: parseInt(req.query.page, 10) || 1,
            limit: parseInt(req.query.limit, 10) || 20
        };

        const result = await journalService.searchTrades(filters, pagination);

        res.json({
            success: true,
            pagination: result.pagination,
            data: result.trades
        });
    } catch (error) {
        console.error('Error in search trades route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/journal/stats/summary
 * @desc    Get trade statistics
 * @access  Public
 */
router.get('/stats/summary', async (req, res) => {
    try {
        // Extract filters from query parameters
        const filters = {};

        if (req.query.instrument) filters.instrument = req.query.instrument;
        if (req.query.direction) filters.direction = req.query.direction;
        if (req.query.strategy) filters.strategy = req.query.strategy;
        if (req.query.startDate) filters.startDate = req.query.startDate;
        if (req.query.endDate) filters.endDate = req.query.endDate;

        const stats = await journalService.getTradeStatistics(filters);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error in trade statistics route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/journal/stats/group/:field
 * @desc    Group trades by a specific field
 * @access  Public
 */
router.get('/stats/group/:field', async (req, res) => {
    try {
        // Extract filters from query parameters
        const filters = {};

        if (req.query.instrument) filters.instrument = req.query.instrument;
        if (req.query.direction) filters.direction = req.query.direction;
        if (req.query.strategy) filters.strategy = req.query.strategy;
        if (req.query.startDate) filters.startDate = req.query.startDate;
        if (req.query.endDate) filters.endDate = req.query.endDate;

        const result = await journalService.groupTradesByField(req.params.field, filters);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in group trades route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
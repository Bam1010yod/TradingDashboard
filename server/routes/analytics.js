/**
 * Performance Analytics API Routes
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');

/**
 * @route   GET /api/analytics/performance
 * @desc    Get performance metrics
 * @access  Public
 */
router.get('/performance', async (req, res) => {
    try {
        // Extract filters from query parameters
        const filters = _extractFiltersFromQuery(req.query);

        const metrics = await analyticsService.calculatePerformanceMetrics(filters);

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('Error in performance metrics route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/drawdown
 * @desc    Get drawdown metrics
 * @access  Public
 */
router.get('/drawdown', async (req, res) => {
    try {
        const filters = _extractFiltersFromQuery(req.query);

        const metrics = await analyticsService.calculateDrawdownMetrics(filters);

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('Error in drawdown metrics route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/ratios
 * @desc    Get financial ratios
 * @access  Public
 */
router.get('/ratios', async (req, res) => {
    try {
        const filters = _extractFiltersFromQuery(req.query);
        const riskFreeRate = req.query.riskFreeRate ? parseFloat(req.query.riskFreeRate) : 0.02;

        const ratios = await analyticsService.calculateFinancialRatios(filters, riskFreeRate);

        res.json({
            success: true,
            data: ratios
        });
    } catch (error) {
        console.error('Error in financial ratios route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/time/:period
 * @desc    Get performance by time period
 * @access  Public
 */
router.get('/time/:period', async (req, res) => {
    try {
        const filters = _extractFiltersFromQuery(req.query);
        const periodType = req.params.period;

        const analysis = await analyticsService.getPerformanceByTimePeriod(periodType, filters);

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('Error in time analysis route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/winrate/:factor
 * @desc    Analyze win rate by factor
 * @access  Public
 */
router.get('/winrate/:factor', async (req, res) => {
    try {
        const filters = _extractFiltersFromQuery(req.query);
        const factor = req.params.factor;

        const analysis = await analyticsService.analyzeWinRateByFactor(factor, filters);

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('Error in win rate analysis route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/streaks
 * @desc    Analyze consecutive wins and losses
 * @access  Public
 */
router.get('/streaks', async (req, res) => {
    try {
        const filters = _extractFiltersFromQuery(req.query);

        const analysis = await analyticsService.analyzeConsecutiveResults(filters);

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('Error in streak analysis route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/market-correlation
 * @desc    Analyze market condition correlation
 * @access  Public
 */
router.get('/market-correlation', async (req, res) => {
    try {
        const filters = _extractFiltersFromQuery(req.query);

        const analysis = await analyticsService.analyzeMarketConditionCorrelation(filters);

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('Error in market correlation route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Extract filters from query parameters
 * @param {Object} query - Express request query object
 * @returns {Object} - Formatted filters
 * @private
 */
function _extractFiltersFromQuery(query) {
    const filters = {};

    if (query.instrument) filters.instrument = query.instrument;
    if (query.direction) filters.direction = query.direction;
    if (query.strategy) filters.strategy = query.strategy;
    if (query.session) filters.session = query.session;
    if (query.dayOfWeek) filters.dayOfWeek = query.dayOfWeek;
    if (query.startDate) filters.startDate = query.startDate;
    if (query.endDate) filters.endDate = query.endDate;

    // Tags (comma-separated)
    if (query.tags) {
        filters.tags = query.tags.split(',').map(tag => tag.trim());
    }

    return filters;
}

module.exports = router;
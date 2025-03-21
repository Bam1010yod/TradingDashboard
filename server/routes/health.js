/**
 * System Health API Routes
 */

const express = require('express');
const router = express.Router();
const healthService = require('../services/healthService');

/**
 * @route   GET /api/health
 * @desc    Get overall system health status
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const health = await healthService.checkSystemHealth();

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        console.error('Error in health status route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/health/database
 * @desc    Get database status
 * @access  Public
 */
router.get('/database', async (req, res) => {
    try {
        const dbStatus = await healthService.checkDatabaseStatus();

        res.json({
            success: true,
            data: dbStatus
        });
    } catch (error) {
        console.error('Error in database status route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/health/services
 * @desc    Get services status
 * @access  Public
 */
router.get('/services', async (req, res) => {
    try {
        const servicesStatus = await healthService.checkServicesStatus();

        res.json({
            success: true,
            data: servicesStatus
        });
    } catch (error) {
        console.error('Error in services status route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/health/ninjatrader
 * @desc    Get NinjaTrader status
 * @access  Public
 */
router.get('/ninjatrader', async (req, res) => {
    try {
        const ntStatus = await healthService.checkNinjaTraderStatus();

        res.json({
            success: true,
            data: ntStatus
        });
    } catch (error) {
        console.error('Error in NinjaTrader status route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/health/performance
 * @desc    Get system performance metrics
 * @access  Public
 */
router.get('/performance', async (req, res) => {
    try {
        const performance = await healthService.getSystemPerformance();

        res.json({
            success: true,
            data: performance
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
 * @route   GET /api/health/disk
 * @desc    Get disk space status
 * @access  Public
 */
router.get('/disk', async (req, res) => {
    try {
        const diskStatus = await healthService.checkDiskSpace();

        res.json({
            success: true,
            data: diskStatus
        });
    } catch (error) {
        console.error('Error in disk status route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/health/errors
 * @desc    Get recent error logs
 * @access  Public
 */
router.get('/errors', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
        const errors = await healthService.getErrorLogs(limit);

        res.json({
            success: true,
            count: errors.length,
            data: errors
        });
    } catch (error) {
        console.error('Error in error logs route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
/**
 * Alert System API Routes
 */

const express = require('express');
const router = express.Router();
const alertService = require('../services/alertService');

/**
 * @route   POST /api/alerts
 * @desc    Create a new alert
 * @access  Public
 */
router.post('/', async (req, res) => {
    try {
        const alert = await alertService.createAlert(req.body);
        res.status(201).json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error in create alert route:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/alerts
 * @desc    Get all alerts
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        // Extract filters from query parameters
        const filters = {};

        if (req.query.type) filters.type = req.query.type;
        if (req.query.active !== undefined) filters.active = req.query.active === 'true';

        const alerts = await alertService.getAlerts(filters);

        res.json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        console.error('Error in get alerts route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/alerts/:id
 * @desc    Get a single alert
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const alert = await alertService.getAlert(req.params.id);

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error in get alert route:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/alerts/:id
 * @desc    Update an alert
 * @access  Public
 */
router.put('/:id', async (req, res) => {
    try {
        const alert = await alertService.updateAlert(req.params.id, req.body);

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error in update alert route:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Delete an alert
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
    try {
        const success = await alertService.deleteAlert(req.params.id);

        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        res.json({
            success: true,
            message: 'Alert deleted successfully'
        });
    } catch (error) {
        console.error('Error in delete alert route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/alerts/history
 * @desc    Get alert history
 * @access  Public
 */
router.get('/history', async (req, res) => {
    try {
        // Extract filters from query parameters
        const filters = {};

        if (req.query.type) filters.type = req.query.type;
        if (req.query.acknowledged !== undefined) filters.acknowledged = req.query.acknowledged === 'true';
        if (req.query.startDate) filters.startDate = req.query.startDate;
        if (req.query.endDate) filters.endDate = req.query.endDate;

        // Pagination
        const pagination = {
            page: parseInt(req.query.page, 10) || 1,
            limit: parseInt(req.query.limit, 10) || 20
        };

        const result = await alertService.getAlertHistory(filters, pagination);

        res.json({
            success: true,
            pagination: result.pagination,
            data: result.history
        });
    } catch (error) {
        console.error('Error in alert history route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/alerts/:id/acknowledge/:historyId
 * @desc    Acknowledge an alert
 * @access  Public
 */
router.post('/:id/acknowledge/:historyId', async (req, res) => {
    try {
        const alert = await alertService.acknowledgeAlert(req.params.id, req.params.historyId);

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error in acknowledge alert route:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/alerts/check
 * @desc    Check for alerts
 * @access  Public
 */
router.post('/check', async (req, res) => {
    try {
        const result = await alertService.checkAllAlerts();

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in check alerts route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
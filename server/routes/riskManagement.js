/**
 * Risk Management API Routes
 */

const express = require('express');
const router = express.Router();
const riskManagementService = require('../services/riskManagementService');

/**
 * @route   GET /api/risk
 * @desc    Get dashboard data with all risk information
 * @access  Public
 */
router.get('/dashboard', async (req, res) => {
    try {
        const dashboardData = await riskManagementService.getDashboardData();
        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Error in risk dashboard route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/risk/profiles
 * @desc    Get all risk profiles
 * @access  Public
 */
router.get('/profiles', async (req, res) => {
    try {
        const profiles = await riskManagementService.getAllRiskProfiles();
        res.json({
            success: true,
            count: profiles.length,
            data: profiles
        });
    } catch (error) {
        console.error('Error in get all risk profiles route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/risk/profiles/:id
 * @desc    Get a single risk profile
 * @access  Public
 */
router.get('/profiles/:id', async (req, res) => {
    try {
        const profile = await riskManagementService.getRiskProfile(req.params.id);
        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Error in get risk profile route:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/risk/profiles
 * @desc    Create a new risk profile
 * @access  Public
 */
router.post('/profiles', async (req, res) => {
    try {
        const profile = await riskManagementService.createRiskProfile(req.body);
        res.status(201).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Error in create risk profile route:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/risk/profiles/:id
 * @desc    Update a risk profile
 * @access  Public
 */
router.put('/profiles/:id', async (req, res) => {
    try {
        const profile = await riskManagementService.updateRiskProfile(req.params.id, req.body);
        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Error in update risk profile route:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/risk/profiles/:id
 * @desc    Delete a risk profile
 * @access  Public
 */
router.delete('/profiles/:id', async (req, res) => {
    try {
        const success = await riskManagementService.deleteRiskProfile(req.params.id);

        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Risk profile not found'
            });
        }

        res.json({
            success: true,
            message: 'Risk profile deleted successfully'
        });
    } catch (error) {
        console.error('Error in delete risk profile route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/risk/metrics/:profileId
 * @desc    Calculate current risk metrics for a profile
 * @access  Public
 */
router.get('/metrics/:profileId', async (req, res) => {
    try {
        const metrics = await riskManagementService.calculateRiskMetrics(req.params.profileId);
        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('Error in risk metrics route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/risk/violations/:profileId
 * @desc    Check for prop firm rule violations
 * @access  Public
 */
router.get('/violations/:profileId', async (req, res) => {
    try {
        const violations = await riskManagementService.checkPropFirmRuleViolations(req.params.profileId);
        res.json({
            success: true,
            data: violations
        });
    } catch (error) {
        console.error('Error in rule violations route:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
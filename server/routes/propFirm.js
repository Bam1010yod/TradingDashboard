/**
 * Prop Firm Routes
 * API endpoints for accessing prop firm rules and trading restrictions
 */

const express = require('express');
const router = express.Router();
const propFirmService = require('../services/propFirmService');

/**
 * @route   GET /api/prop-firm-rules
 * @desc    Get all prop firm rules
 * @access  Public
 */
router.get('/', (req, res) => {
    try {
        const apexRules = propFirmService.getRules('APEX');
        const tptRules = propFirmService.getRules('TPT');

        res.json({
            APEX: apexRules,
            TPT: tptRules
        });
    } catch (error) {
        console.error('Error retrieving prop firm rules:', error);
        res.status(500).json({ message: 'Error retrieving prop firm rules' });
    }
});

/**
 * @route   GET /api/prop-firm-rules/:firm
 * @desc    Get rules for a specific prop firm
 * @access  Public
 */
router.get('/:firm', (req, res) => {
    try {
        const rules = propFirmService.getRules(req.params.firm);

        if (!rules) {
            return res.status(404).json({ message: 'Prop firm not found' });
        }

        res.json(rules);
    } catch (error) {
        console.error(`Error retrieving rules for ${req.params.firm}:`, error);
        res.status(500).json({ message: `Error retrieving rules for ${req.params.firm}` });
    }
});

/**
 * @route   POST /api/prop-firm-rules/check-news
 * @desc    Check if trading is allowed based on news restrictions
 * @access  Public
 */
router.post('/check-news', (req, res) => {
    try {
        const { firm, currentTime, newsEvents } = req.body;

        if (!firm || !currentTime || !newsEvents) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const status = propFirmService.checkNewsRestrictions(
            firm,
            new Date(currentTime),
            newsEvents
        );

        res.json(status);
    } catch (error) {
        console.error('Error checking news restrictions:', error);
        res.status(500).json({ message: 'Error checking news restrictions' });
    }
});

/**
 * @route   POST /api/prop-firm-rules/check-compliance
 * @desc    Check if a trade complies with prop firm rules
 * @access  Public
 */
router.post('/check-compliance', (req, res) => {
    try {
        const { firm, accountStats } = req.body;

        if (!firm || !accountStats) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const compliance = propFirmService.checkTradeCompliance(firm, accountStats);
        res.json(compliance);
    } catch (error) {
        console.error('Error checking trade compliance:', error);
        res.status(500).json({ message: 'Error checking trade compliance' });
    }
});

/**
 * @route   GET /api/prop-firm-rules/update
 * @desc    Force an update of prop firm rules
 * @access  Public
 */
router.get('/update', async (req, res) => {
    try {
        const updated = await propFirmService.updatePropFirmRules();

        if (updated) {
            res.json({ message: 'Prop firm rules updated successfully' });
        } else {
            res.status(500).json({ message: 'Error updating prop firm rules' });
        }
    } catch (error) {
        console.error('Error updating prop firm rules:', error);
        res.status(500).json({ message: 'Error updating prop firm rules' });
    }
});

module.exports = router;
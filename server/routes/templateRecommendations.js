/**
 * Template Recommendations Routes
 * Provides API endpoints for recommending optimal trading templates
 */

const express = require('express');
const router = express.Router();
const recommendationEngineService = require('../services/recommendationEngineService');

/**
 * @route GET /api/recommendations
 * @description Get recommended templates based on current market conditions and news
 * @access Public
 */
router.get('/', async (req, res) => {
    try {
        // Get query parameters or use defaults
        const timeOfDay = req.query.timeOfDay || getCurrentTimeOfDay();
        const sessionType = req.query.sessionType || 'Regular';

        // Get comprehensive recommendations
        const recommendations = await recommendationEngineService.generateRecommendations(
            timeOfDay,
            sessionType
        );

        res.json(recommendations);
    } catch (error) {
        console.error('Error getting template recommendations:', error);
        res.status(500).json({ message: 'Failed to get template recommendations' });
    }
});

/**
 * Determine the current time of day (Morning, Afternoon, Evening)
 * @returns {String} - Current time of day
 */
function getCurrentTimeOfDay() {
    const hour = new Date().getHours();

    if (hour >= 4 && hour < 12) {
        return 'Morning';
    } else if (hour >= 12 && hour < 17) {
        return 'Afternoon';
    } else {
        return 'Evening';
    }
}

module.exports = router;
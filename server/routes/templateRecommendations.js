const express = require('express');
const router = express.Router();
const templateSelector = require('../services/templateSelector');

// GET recommended template based on current conditions
router.get('/recommend', async (req, res) => {
    try {
        console.log('Received request to /recommend'); // Add this line
        const { type } = req.query;

        // Validate type parameter
        if (!type || !['ATM', 'Flazh'].includes(type.toUpperCase())) {
            console.log('Invalid template type:', type); // Add this line
            return res.status(400).json({
                success: false,
                message: 'Invalid template type. Must be ATM or Flazh.'
            });
        }

        // Get recommended template
        console.log('Getting recommended template...'); // Add this line
        const template = await templateSelector.getRecommendedTemplate(
            type,
            new Date(), // Use current time
            {}          // Empty market data for now
        );

        if (!template) {
            console.log('No template found'); // Add this line
            return res.status(404).json({
                success: false,
                message: `No suitable ${type} template found for the current conditions.`
            });
        }

        // Return template information
        console.log('Template found:', template); // Add this line
        res.json({
            success: true,
            template: {
                _id: template._id,
                name: template.templateName,
                session: template.session,
                volatility: template.volatility,
                dayOfWeek: template.dayOfWeek
            }
        });
    } catch (error) {
        console.error('Error recommending template:', error);
        res.status(500).json({
            success: false,
            message: 'Error recommending template',
            error: error.message
        });
    }
});

module.exports = router;
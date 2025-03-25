// File: C:\TradingDashboard\server\check-enhanced-recommendations.js

/**
 * This script tests the enhanced template recommendations API endpoint
 * to ensure it's returning the expected data format
 */

const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/database');
const marketConditionsService = require('./services/marketConditionsService');
const enhancedTemplateSelector = require('./services/enhancedTemplateSelector');

async function testEnhancedRecommendations() {
    try {
        console.log('Starting enhanced recommendations test...');

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.database, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connection successful');

        // Test getting market conditions
        console.log('\nTesting marketConditionsService.getCurrentMarketConditions()...');
        let marketConditions = null;
        try {
            marketConditions = await marketConditionsService.getCurrentMarketConditions();
            console.log('Market conditions:', JSON.stringify(marketConditions, null, 2));
        } catch (err) {
            console.error('Error getting market conditions:', err.message);

            // Use fallback market conditions
            console.log('Using fallback market conditions');
            marketConditions = {
                volatility: 'medium',
                trend: 'neutral',
                volume: 'normal',
                session: 'regular',
                timestamp: new Date().toISOString()
            };
        }

        // Test the enhanced template selector
        console.log('\nTesting enhancedTemplateSelector.getRecommendedTemplate()...');
        try {
            const recommendations = await enhancedTemplateSelector.getRecommendedTemplate(marketConditions);
            console.log('Recommendations result:', JSON.stringify(recommendations, null, 2));

            // Verify the response format
            if (recommendations && recommendations.flazh && recommendations.atm) {
                console.log('\n✅ PASS: enhancedTemplateSelector returned expected format');

                // Check if templates have all necessary fields
                const requiredFields = ['name', 'parameters'];
                let missingFields = [];

                if (!recommendations.flazh.name) missingFields.push('flazh.name');
                if (!recommendations.flazh.parameters) missingFields.push('flazh.parameters');

                if (!recommendations.atm.name) missingFields.push('atm.name');
                if (!recommendations.atm.parameters) missingFields.push('atm.parameters');

                if (missingFields.length === 0) {
                    console.log('✅ PASS: Templates have all required fields');
                } else {
                    console.log('⚠️ WARNING: Missing required fields:', missingFields.join(', '));
                }
            } else {
                console.log('❌ FAIL: Unexpected response format');
                console.log('Expected properties: flazh, atm, marketConditions');
            }
        } catch (err) {
            console.error('Error testing enhanced template selector:', err);
        }

        // Directly test the API route handler
        console.log('\nTesting the route handler directly...');

        // Mock Express request/response objects
        const req = {};
        const res = {
            json: (data) => {
                console.log('Route handler response:', JSON.stringify(data, null, 2));

                // Verify response format
                if (data && data.flazh && data.atm) {
                    console.log('\n✅ PASS: Route handler returned expected format');
                } else {
                    console.log('❌ FAIL: Route handler returned unexpected format');
                }
            },
            status: (code) => {
                console.log(`Status code: ${code}`);
                return res;  // For chaining
            }
        };

        // Load the route handler
        try {
            const recommendationsRoute = require('./routes/enhancedTemplateRecommendations');

            // Check if the route has a handler function
            if (typeof recommendationsRoute === 'function') {
                console.log('Route is an Express router function');

                // We can't directly test the router function, so skip this test
                console.log('Skipping direct router test - router is a function');
            } else {
                console.error('Route is not a router function');
            }
        } catch (err) {
            console.error('Error loading route:', err.message);
        }

    } catch (err) {
        console.error('Unexpected error during test:', err);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('\nTest complete');
    }
}

// Run the test
testEnhancedRecommendations();
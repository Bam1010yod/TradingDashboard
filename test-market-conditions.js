const path = require('path');
require('dotenv').config();
const connectDB = require('./config/database');
const marketCondition = require('./services/analysis/marketCondition');

const testMarketConditions = async () => {
    try {
        // Connect to database
        await connectDB();

        console.log('Testing market condition detection...');

        // Test different times of day
        const testTimes = [
            { time: '09:45', description: 'Opening' },
            { time: '11:30', description: 'Morning' },
            { time: '12:30', description: 'Lunch' },
            { time: '14:15', description: 'Early Afternoon' },
            { time: '15:30', description: 'Late Afternoon' },
            { time: '16:45', description: 'Evening' },
            { time: '20:00', description: 'Overnight' }
        ];

        const today = new Date().toISOString().split('T')[0]; // Get today's date

        for (const test of testTimes) {
            const testTime = new Date(`${today}T${test.time}:00`);
            console.log(`\nTesting time: ${test.time} (${test.description})`);

            const conditions = marketCondition.detectCurrentConditions(testTime);
            console.log('Detected conditions:', conditions);

            // Try to find matching templates
            try {
                const matches = await marketCondition.findMatchingTemplates(conditions);
                console.log('Matching ATM templates:', matches.atm.length);
                console.log('Matching Flazh templates:', matches.flazh.length);
            } catch (error) {
                console.error('Error finding matches:', error.message);
            }
        }

        // Test current time
        console.log('\nTesting current time:');
        const currentConditions = marketCondition.detectCurrentConditions();
        console.log('Current conditions:', currentConditions);

        const currentMatches = await marketCondition.findMatchingTemplates(currentConditions);
        console.log('Matching ATM templates for current time:', currentMatches.atm.map(t => t.name));
        console.log('Matching Flazh templates for current time:', currentMatches.flazh.map(t => t.name));

        process.exit(0);
    } catch (error) {
        console.error('Error during test:', error);
        process.exit(1);
    }
};

testMarketConditions();
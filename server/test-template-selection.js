// C:\TradingDashboard\server\test-template-selection.js

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const templateImport = require('./services/templateImport');
const templateSelector = require('./services/templateSelector');

// MongoDB connection
const connectToDatabase = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/trading-dashboard';
        await mongoose.connect(mongoURI, {});
        console.log('MongoDB connected successfully');
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        return false;
    }
};

// Test template selection for different days and times
const testTemplateSelection = async () => {
    // Create test market data
    const marketData = {
        volatility: 1.0  // Medium volatility
    };

    // Test different days and times
    const testCases = [
        { day: 'Monday', hour: 11, minute: 15, session: 'Late_Morning', volatility: 'Medium_Volatility' },
        { day: 'Monday', hour: 13, minute: 30, session: 'Early_Afternoon', volatility: 'Medium_Volatility' },
        { day: 'Monday', hour: 15, minute: 15, session: 'Pre_Close', volatility: 'Medium_Volatility' },
        { day: 'Friday', hour: 11, minute: 15, session: 'Late_Morning', volatility: 'Medium_Volatility' },
        { day: 'Friday', hour: 13, minute: 30, session: 'Early_Afternoon', volatility: 'Medium_Volatility' },
        { day: 'Friday', hour: 15, minute: 15, session: 'Pre_Close', volatility: 'Medium_Volatility' }
    ];

    // Test different volatility levels
    const volatilityLevels = [
        { level: 0.3, expected: 'Low_Volatility' },
        { level: 1.0, expected: 'Medium_Volatility' },
        { level: 2.0, expected: 'High_Volatility' }
    ];

    console.log('=== Testing template selection for different days and sessions ===');
    for (const testCase of testCases) {
        // Create date for the test case
        const date = new Date();

        // Set day of week
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDay = days.indexOf(testCase.day);
        const currentDay = date.getDay();
        const diff = targetDay - currentDay;
        date.setDate(date.getDate() + diff);

        // Set time
        date.setHours(testCase.hour, testCase.minute, 0, 0);

        console.log(`\nTest case: ${testCase.day} ${testCase.hour}:${testCase.minute} - Expected session: ${testCase.session}`);

        // Test both ATM and Flazh templates
        for (const templateType of ['ATM', 'Flazh']) {
            const template = await templateSelector.getRecommendedTemplate(templateType, date, marketData);

            console.log(`${templateType} template selected:`,
                template ? template.templateName : 'None found');
        }
    }

    console.log('\n=== Testing template selection for different volatility levels ===');

    // Use fixed date/time (Monday at 11:15)
    const fixedDate = new Date();
    // Set to Monday
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.indexOf('Monday');
    const currentDay = fixedDate.getDay();
    const diff = targetDay - currentDay;
    fixedDate.setDate(fixedDate.getDate() + diff);
    // Set to 11:15
    fixedDate.setHours(11, 15, 0, 0);

    for (const volatility of volatilityLevels) {
        const customMarketData = {
            volatility: volatility.level
        };

        console.log(`\nTest case: Volatility ${volatility.level} - Expected: ${volatility.expected}`);

        // Test both ATM and Flazh templates
        for (const templateType of ['ATM', 'Flazh']) {
            const template = await templateSelector.getRecommendedTemplate(templateType, fixedDate, customMarketData);

            console.log(`${templateType} template selected:`,
                template ? template.templateName : 'None found');
        }
    }
};

// Create test day-specific templates to demonstrate day-of-week capability
const createTestDayTemplates = async () => {
    console.log('\n=== Creating test day-specific templates ===');

    // NinjaTrader directories
    const ntAtmDir = 'C:\\Users\\bridg\\Documents\\NinjaTrader 8\\templates\\ATM';
    const ntFlazhDir = 'C:\\Users\\bridg\\Documents\\NinjaTrader 8\\templates\\Indicator\\RenkoKings_FlazhInfinity';

    // Create a test directory if it doesn't exist
    const testDir = path.join(__dirname, 'test');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
    }

    // Create Monday and Friday specific templates
    const templateFiles = [
        {
            path: path.join(testDir, 'ATM_MON_EA_MED.xml'),
            original: path.join(ntAtmDir, 'ATM_EA_MED.xml'),
            newName: 'ATM_MON_EA_MED'
        },
        {
            path: path.join(testDir, 'FLAZH_MON_EA_MED.xml'),
            original: path.join(ntFlazhDir, 'Flazh_EA_MED.xml'),
            newName: 'FLAZH_MON_EA_MED'
        },
        {
            path: path.join(testDir, 'ATM_FRI_EA_MED.xml'),
            original: path.join(ntAtmDir, 'ATM_EA_MED.xml'),
            newName: 'ATM_FRI_EA_MED'
        },
        {
            path: path.join(testDir, 'FLAZH_FRI_EA_MED.xml'),
            original: path.join(ntFlazhDir, 'Flazh_EA_MED.xml'),
            newName: 'FLAZH_FRI_EA_MED'
        }
    ];

    // Create each test template
    for (const template of templateFiles) {
        try {
            // Check if original file exists
            if (!fs.existsSync(template.original)) {
                console.error(`Error: Original file ${template.original} does not exist`);
                continue;
            }

            // Read original file
            let content = fs.readFileSync(template.original, 'utf8');

            // Replace template name
            if (template.original.includes('ATM')) {
                content = content.replace(/<Template>.*?<\/Template>/, `<Template>${template.newName}</Template>`);
            } else {
                content = content.replace(/UserNote>.*?<\/UserNote>/, `UserNote>${template.newName} Template</UserNote>`);
            }

            // Write new file
            fs.writeFileSync(template.path, content);
            console.log(`Created ${template.path}`);

            // Import the template
            const result = await templateImport.importTemplate(template.path);
            console.log(`Import result: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
        } catch (error) {
            console.error(`Error creating template ${template.path}:`, error);
        }
    }
};

// Main function
const runTest = async () => {
    try {
        // Connect to database
        const connected = await connectToDatabase();
        if (!connected) {
            console.error('Failed to connect to database. Exiting test.');
            return;
        }

        // Create day-specific test templates
        await createTestDayTemplates();

        // Run the template selection test
        await testTemplateSelection();

        // Disconnect from database
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error running test:', error);
        await mongoose.connection.close();
    }
};

// Run the test
runTest();
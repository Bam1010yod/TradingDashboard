// C:\TradingDashboard\server\check-template-structure.js
const mongoose = require('mongoose');
const connectDB = require('./config/database');

const checkTemplateStructure = async () => {
    try {
        // Connect to database
        await connectDB();

        // Check ATM templates
        console.log('\nATM Template Structure:');
        const atmTemplate = await mongoose.connection.db.collection('atmtemplates').findOne({});
        console.log(JSON.stringify(atmTemplate, null, 2));

        // Check Flazh templates
        console.log('\nFlazh Template Structure:');
        const flazhTemplate = await mongoose.connection.db.collection('flazhtemplates').findOne({});
        console.log(JSON.stringify(flazhTemplate, null, 2));

        // Disconnect from MongoDB
        await mongoose.disconnect();

    } catch (error) {
        console.error('Error checking template structure:', error);
    }
};

checkTemplateStructure();
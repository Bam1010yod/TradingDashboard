// Full path: C:\TradingDashboard\server\test-mongo-connection.js

const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/database');

const testConnection = async () => {
    try {
        console.log('Testing MongoDB connection...');

        // Try to connect using our enhanced database.js
        const conn = await connectDB();

        // If we get here, connection was successful
        console.log('✅ MongoDB connection successful!');

        // Check if we have the necessary collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        console.log(`\nAvailable collections: ${collectionNames.join(', ') || 'No collections found'}`);

        // Check if we have the needed collections for our application
        const requiredCollections = ['atmtemplates', 'flazhtemplates'];
        const missingCollections = requiredCollections.filter(
            name => !collectionNames.includes(name)
        );

        if (missingCollections.length > 0) {
            console.log(`\n⚠️ Missing required collections: ${missingCollections.join(', ')}`);
            console.log('You may need to initialize the database with sample data.');
        } else {
            console.log('\n✅ All required collections exist');

            // Check for documents in each collection
            for (const collection of requiredCollections) {
                const count = await mongoose.connection.db.collection(collection).countDocuments();
                console.log(`Collection ${collection}: ${count} documents`);

                if (count === 0) {
                    console.log(`⚠️ Collection ${collection} is empty. Initialize with sample data.`);
                }
            }
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');

    } catch (error) {
        console.error('❌ MongoDB connection test failed:');
        console.error(error);
    }
};

testConnection();
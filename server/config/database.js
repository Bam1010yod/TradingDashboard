const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Set mongoose options for better debugging and stability
        const options = {
            serverSelectionTimeoutMS: 15000, // Increase from default 10000
            socketTimeoutMS: 45000,
            connectTimeoutMS: 15000,
            maxPoolSize: 10,
            family: 4 // Force IPv4
        };

        console.log(`Attempting to connect to MongoDB at: ${process.env.MONGODB_URI}`);

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        console.log(`MongoDB connected: ${conn.connection.host}`);

        // Test the connection with a simple operation
        const collections = await conn.connection.db.listCollections().toArray();
        console.log(`Available collections: ${collections.map(c => c.name).join(', ') || 'No collections found'}`);

        return conn;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        console.error(`Full error details: ${JSON.stringify(error, null, 2)}`);

        // Don't exit immediately to allow for retry mechanisms
        // process.exit(1);
        throw error; // Re-throw to allow handling by caller
    }
};

module.exports = connectDB;
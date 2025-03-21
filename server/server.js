/**
 * Trading Dashboard Server
 * Main server file for the NinjaTrader Dynamic ATM Trading System
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Import database configuration
const connectDB = require('./config/database');

// Import services
const marketDataService = require('./services/marketDataService');
const propFirmService = require('./services/propFirmService');
const marketNewsService = require('./services/marketNewsService');
const templateService = require('./services/templateService');
const healthService = require('./services/healthService');
const backtestService = require('./services/backtestService');
const riskManagementService = require('./services/riskManagementService');
const journalService = require('./services/journalService');
const analyticsService = require('./services/analyticsService');
const alertService = require('./services/alertService');

// Import routes
const templateRoutes = require('./routes/templates');
const marketDataRoutes = require('./routes/marketData');
const propFirmRoutes = require('./routes/propFirm');
const marketNewsRoutes = require('./routes/marketNews');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/templates', templateRoutes);
app.use('/api/market-data', marketDataRoutes);
app.use('/api/prop-firm-rules', propFirmRoutes);
app.use('/api/market-news', marketNewsRoutes);
app.use('/api/risk', require('./routes/riskManagement'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/health', require('./routes/health'));
app.use('/api/backtest', require('./routes/backtest'));
app.use('/api/templates', require('./routes/templates'));

// Home route
app.get('/', (req, res) => {
    res.send('TradingDashboard API is running');
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Initialize services
(async () => {
    try {
        // Initialize services with socket.io for real-time updates
        await marketDataService.initialize(io);
        await propFirmService.initialize();
        await marketNewsService.initialize(io);
        await backtestService.initialize();
        await riskManagementService.initialize();
        await journalService.initialize();
        await analyticsService.initialize();
        await alertService.initialize();

        // Start periodic health check (every 5 minutes)
        healthService.startPeriodicHealthCheck(5);

        console.log('All services initialized successfully');
    } catch (error) {
        console.error('Error initializing services:', error);
    }
})();

// Set port and start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Don't exit the server in production
    // process.exit(1);
});

module.exports = server;
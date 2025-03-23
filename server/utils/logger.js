// Full path: C:\TradingDashboard\server\utils\logger.js

const fs = require('fs');
const path = require('path');

// Simple logger utility
const logger = {
    logFile: path.join(__dirname, '..', 'logs', 'application.log'),

    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    },

    formatLogMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}\n`;
    },

    log(level, message) {
        this.ensureLogDirectory();
        const logMessage = this.formatLogMessage(level, message);
        console.log(logMessage.trim());
        fs.appendFileSync(this.logFile, logMessage);
    },

    info(message) {
        this.log('INFO', message);
    },

    error(message) {
        this.log('ERROR', message);
    },

    warn(message) {
        this.log('WARN', message);
    },

    debug(message) {
        this.log('DEBUG', message);
    }
};

module.exports = logger;
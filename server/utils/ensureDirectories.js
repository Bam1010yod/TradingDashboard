// Full path: C:\TradingDashboard\server\utils\ensureDirectories.js

const fs = require('fs');
const path = require('path');

// Ensure required directories exist
const requiredDirs = [
    path.resolve('C:\\TradingDashboard\\server\\public'),
    path.resolve('C:\\TradingDashboard\\server\\services\\analysis'),
    path.resolve('C:\\NinjaTraderData')
];

requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

console.log('All required directories verified.');
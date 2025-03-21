// File path: C:\TradingDashboard\server\test\readVolatilityFile.js

const fs = require('fs');

const filePath = 'C:\\NinjaTraderData\\VolatilityMetrics.json';

console.log(`Attempting to read file: ${filePath}`);

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading file: ${err.message}`);
        if (err.code === 'ENOENT') {
            console.error('File does not exist at the specified location.');
        }
        return;
    }

    console.log('File contents:');
    console.log(data);

    try {
        const jsonData = JSON.parse(data);
        console.log('\nParsed JSON data:');
        console.log(JSON.stringify(jsonData, null, 2));
    } catch (jsonErr) {
        console.error(`Error parsing JSON: ${jsonErr.message}`);
    }
});
// Save to test-template.js
const fs = require('fs');
const path = require('path');

// Define both possible folder structures
const NT_USER_DIR = 'C:\\Users\\bridg\\Documents\\NinjaTrader 8';
const FLAZH_DIR_1 = path.join(NT_USER_DIR, 'templates', 'Indicator', 'RenkoKings_FlazhInfinity');
const FLAZH_DIR_2 = path.join(NT_USER_DIR, 'templates', 'Indicator', 'RenkoKings', 'RenkoKings_FlazhInfinity');

// Create a simple test template
const testTemplate = `<?xml version="1.0" encoding="utf-8"?>
<NinjaTrader>
  <TestTemplate>
    <Name>TestTemplate</Name>
    <Value>TestValue</Value>
  </TestTemplate>
</NinjaTrader>`;

// Try writing to both locations
console.log(`Attempting to write to ${FLAZH_DIR_1}`);
try {
    if (fs.existsSync(FLAZH_DIR_1)) {
        fs.writeFileSync(path.join(FLAZH_DIR_1, 'test_template.xml'), testTemplate);
        console.log('Successfully wrote to location 1');
    } else {
        console.log('Directory 1 does not exist');
    }
} catch (err) {
    console.error('Error writing to location 1:', err.message);
}

console.log(`Attempting to write to ${FLAZH_DIR_2}`);
try {
    if (fs.existsSync(FLAZH_DIR_2)) {
        fs.writeFileSync(path.join(FLAZH_DIR_2, 'test_template.xml'), testTemplate);
        console.log('Successfully wrote to location 2');
    } else {
        console.log('Directory 2 does not exist');
    }
} catch (err) {
    console.error('Error writing to location 2:', err.message);
}

// Also list all folders in the Indicator directory to see what's available
const indicatorDir = path.join(NT_USER_DIR, 'templates', 'Indicator');
console.log(`Listing all subdirectories in ${indicatorDir}`);
try {
    if (fs.existsSync(indicatorDir)) {
        const subdirs = fs.readdirSync(indicatorDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        console.log('Subdirectories:', subdirs);
    } else {
        console.log('Indicator directory does not exist');
    }
} catch (err) {
    console.error('Error listing subdirectories:', err.message);
}
// C:\TradingDashboard\server\check-template-recommendations.js
const fs = require('fs');
const path = require('path');

// Function to check templateRecommendations.js content
const checkFile = () => {
    try {
        const filePath = path.join(__dirname, 'routes', 'templateRecommendations.js');

        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${filePath}`);
            return;
        }

        console.log(`\nContents of templateRecommendations.js:`);
        console.log('====================================');

        const content = fs.readFileSync(filePath, 'utf8');
        console.log(content);

        // Check for route definitions
        if (content.includes('router.get(\'/')) {
            console.log('\nRoute definitions found in templateRecommendations.js');

            // Extract route definitions
            const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
            let match;
            console.log('\nDefined routes:');
            while ((match = routeRegex.exec(content)) !== null) {
                const method = match[1].toUpperCase();
                const path = match[2];
                console.log(`  ${method} /api/template-recommendations${path}`);
            }
        } else {
            console.log('\nNo route definitions found in templateRecommendations.js');
        }

    } catch (error) {
        console.error(`Error reading file: ${error.message}`);
    }
};

// Check the file
checkFile();
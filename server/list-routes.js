// C:\TradingDashboard\server\list-routes.js
const express = require('express');
const fs = require('fs');
const path = require('path');

// Create a temporary Express app
const app = express();

// Function to load all route files
const loadRoutes = (routesDir) => {
    console.log('Loading routes from directory:', routesDir);
    const routeFiles = fs.readdirSync(routesDir);

    console.log('\nRegistered API Routes:');
    console.log('=====================');

    routeFiles.forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(routesDir, file);
            const routeName = file.replace('.js', '');

            try {
                // Try to load the route file
                console.log(`\nFrom ${file}:`);

                // Read the file content to analyze routes
                const content = fs.readFileSync(filePath, 'utf8');

                // Look for router.get, router.post, etc. patterns
                const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
                let match;
                let count = 0;

                while ((match = routeRegex.exec(content)) !== null) {
                    const method = match[1].toUpperCase();
                    const path = match[2];
                    console.log(`  ${method} /api/${routeName}${path}`);
                    count++;
                }

                if (count === 0) {
                    console.log('  No routes found in this file');
                }

            } catch (error) {
                console.error(`Error loading route: ${file}`, error);
            }
        }
    });
};

// Get the routes directory from the project structure
const routesDir = path.join(__dirname, 'routes');

// Check if the routes directory exists
if (fs.existsSync(routesDir)) {
    loadRoutes(routesDir);
} else {
    console.error('Routes directory not found:', routesDir);
}
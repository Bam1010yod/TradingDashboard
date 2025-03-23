// C:\TradingDashboard\server\check-server-config.js
const fs = require('fs');
const path = require('path');

// Function to check server.js content
const checkServerFile = () => {
  try {
    const filePath = path.join(__dirname, 'server.js');
    
    if (!fs.existsSync(filePath)) {
      console.log(`Main server file not found: ${filePath}`);
      return;
    }
    
    console.log(`\nContents of server.js:`);
    console.log('========================');
    
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(content);
    
    // Check if templateRecommendations is registered
    if (content.includes('templateRecommendations')) {
      console.log('\nTemplateRecommendations route is registered in server.js');
    } else {
      console.log('\nWarning: templateRecommendations route is NOT registered in server.js');
    }
    
    // Check for route registration pattern
    const routeRegistrationPattern = /app\.use\(['"]\/api\/([^'"]+)['"]\s*,\s*require\(['"]\.\/routes\/([^'"]+)['"]\)\)/g;
    
    console.log('\nRegistered API routes in server.js:');
    let match;
    while ((match = routeRegistrationPattern.exec(content)) !== null) {
      const routePath = match[1];
      const routeFile = match[2];
      console.log(`  /api/${routePath} -> ./routes/${routeFile}`);
    }
    
  } catch (error) {
    console.error(`Error reading server file: ${error.message}`);
  }
};

// Check server.js
checkServerFile();

// Verify templateRecommendations.js exists
const templateRecommendationsPath = path.join(__dirname, 'routes', 'templateRecommendations.js');
if (fs.existsSync(templateRecommendationsPath)) {
  console.log('\ntemplateRecommendations.js exists in the routes directory');
} else {
  console.log('\nWarning: templateRecommendations.js does NOT exist in the routes directory');
}
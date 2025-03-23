// C:\TradingDashboard\server\check-routes.js
const fs = require('fs');
const path = require('path');

// Function to check route file content
const checkRouteFile = (fileName) => {
  try {
    const filePath = path.join(__dirname, 'routes', fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    console.log(`\nContents of ${fileName}:`);
    console.log('========================');
    
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(content);
    
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
  }
};

// Check templateRecommendations.js
checkRouteFile('templateRecommendations.js');

// Check the tradingSession.js for comparison
checkRouteFile('tradingSession.js');

// Also check templates.js to see how templates are handled
checkRouteFile('templates.js');
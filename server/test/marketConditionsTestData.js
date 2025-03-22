// File: C:\TradingDashboard\server\test\marketConditionsTestData.js

const fs = require('fs');
const path = require('path');

// Define various market conditions scenarios
const marketScenarios = {
  highVolatility: {
    name: 'High Volatility',
    vix: 28.5,
    rangeExpansion: true,
    priceAction: 'erratic',
    volume: 'high',
    news: 'major economic announcement',
    timeOfDay: 'market open',
    trendStrength: 'weak',
    supportResistance: 'breaking levels',
    recommendedFlazhSettings: {
      range: 14,
      sensitivity: 8,
      priceLevels: 'wide',
      alerts: 'frequent'
    },
    recommendedATMSettings: {
      stopLoss: 'wide',
      profitTarget: 'multiple targets',
      trailStop: true,
      position: 'reduced size'
    }
  },
  
  lowVolatility: {
    name: 'Low Volatility',
    vix: 12.6,
    rangeExpansion: false,
    priceAction: 'choppy',
    volume: 'low',
    news: 'no significant announcements',
    timeOfDay: 'midday',
    trendStrength: 'very weak',
    supportResistance: 'holding levels',
    recommendedFlazhSettings: {
      range: 8,
      sensitivity: 5,
      priceLevels: 'narrow',
      alerts: 'minimal'
    },
    recommendedATMSettings: {
      stopLoss: 'tight',
      profitTarget: 'scaled',
      trailStop: false,
      position: 'minimal size'
    }
  },
  
  strongUptrend: {
    name: 'Strong Uptrend',
    vix: 16.8,
    rangeExpansion: true,
    priceAction: 'directional',
    volume: 'increasing',
    news: 'positive sector news',
    timeOfDay: 'first two hours',
    trendStrength: 'strong',
    supportResistance: 'clear levels',
    recommendedFlazhSettings: {
      range: 12,
      sensitivity: 7,
      priceLevels: 'trending',
      alerts: 'breakouts'
    },
    recommendedATMSettings: {
      stopLoss: 'moderate',
      profitTarget: 'extended',
      trailStop: true,
      position: 'full size'
    }
  },
  
  strongDowntrend: {
    name: 'Strong Downtrend',
    vix: 22.4,
    rangeExpansion: true,
    priceAction: 'directional',
    volume: 'increasing',
    news: 'negative economic data',
    timeOfDay: 'first two hours',
    trendStrength: 'strong',
    supportResistance: 'breaking down',
    recommendedFlazhSettings: {
      range: 12,
      sensitivity: 7,
      priceLevels: 'trending',
      alerts: 'breakdowns'
    },
    recommendedATMSettings: {
      stopLoss: 'moderate',
      profitTarget: 'extended',
      trailStop: true,
      position: 'full size'
    }
  },
  
  rangebound: {
    name: 'Rangebound Market',
    vix: 14.2,
    rangeExpansion: false,
    priceAction: 'oscillating',
    volume: 'average',
    news: 'mixed news',
    timeOfDay: 'various',
    trendStrength: 'none',
    supportResistance: 'strong levels',
    recommendedFlazhSettings: {
      range: 10,
      sensitivity: 6,
      priceLevels: 'range bounds',
      alerts: 'range extremes'
    },
    recommendedATMSettings: {
      stopLoss: 'beyond range',
      profitTarget: 'to opposite bound',
      trailStop: false,
      position: 'moderate size'
    }
  }
};

// Function to generate test data file
function generateMarketConditionsTestData() {
  const outputDir = path.join(__dirname, 'results');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write each scenario to a separate file
  Object.entries(marketScenarios).forEach(([scenarioKey, scenario]) => {
    const filePath = path.join(outputDir, `${scenarioKey}.json`);
    fs.writeFileSync(filePath, JSON.stringify(scenario, null, 2));
    console.log(`Created scenario file: ${filePath}`);
  });
  
  // Create a combined file with all scenarios
  const allScenariosPath = path.join(outputDir, 'allMarketScenarios.json');
  fs.writeFileSync(allScenariosPath, JSON.stringify(marketScenarios, null, 2));
  console.log(`Created combined scenarios file: ${allScenariosPath}`);
  
  return {
    scenariosCount: Object.keys(marketScenarios).length,
    outputDir
  };
}

// Execute if run directly
if (require.main === module) {
  const result = generateMarketConditionsTestData();
  console.log(`Successfully generated ${result.scenariosCount} market condition scenarios in ${result.outputDir}`);
} else {
  // Export for use in other test files
  module.exports = {
    marketScenarios,
    generateMarketConditionsTestData
  };
}
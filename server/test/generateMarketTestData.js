// File: C:\TradingDashboard\server\test\generateMarketTestData.js

const fs = require('fs');
const path = require('path');

/**
 * Market Test Data Generator
 * 
 * Generates various market condition test cases for the TradingDashboard system.
 * These test cases can be used with the comprehensiveMarketTest.js to validate
 * system recommendations across different market scenarios.
 */

// Define market condition scenarios
const marketScenarios = {
    highVolatility: {
        instrument: "NQ",
        timestamp: new Date().toISOString(),
        price: 18745.50,
        volatility: {
            intraday: 2.8,
            hourly: 1.2,
            daily: 3.5,
            weekly: 4.2
        },
        volume: {
            current: 245000,
            average: 180000,
            ratio: 1.36
        },
        indicators: {
            trendStrength: "weak",
            priceAction: "erratic",
            rangeExpansion: true,
            supportResistance: {
                broken: true,
                strength: "weak"
            }
        },
        marketContext: {
            sessionType: "regular",
            timeOfDay: "open",
            dayOfWeek: new Date().getDay(),
            vix: 28.5,
            news: {
                impact: "high",
                sentiment: "negative",
                type: "economic announcement"
            }
        }
    },

    lowVolatility: {
        instrument: "NQ",
        timestamp: new Date().toISOString(),
        price: 18622.25,
        volatility: {
            intraday: 0.7,
            hourly: 0.3,
            daily: 0.9,
            weekly: 1.4
        },
        volume: {
            current: 95000,
            average: 180000,
            ratio: 0.53
        },
        indicators: {
            trendStrength: "very weak",
            priceAction: "choppy",
            rangeExpansion: false,
            supportResistance: {
                broken: false,
                strength: "strong"
            }
        },
        marketContext: {
            sessionType: "regular",
            timeOfDay: "midday",
            dayOfWeek: new Date().getDay(),
            vix: 12.6,
            news: {
                impact: "low",
                sentiment: "neutral",
                type: "no significant announcements"
            }
        }
    },

    strongUptrend: {
        instrument: "NQ",
        timestamp: new Date().toISOString(),
        price: 18935.75,
        volatility: {
            intraday: 1.8,
            hourly: 0.8,
            daily: 2.3,
            weekly: 2.8
        },
        volume: {
            current: 215000,
            average: 180000,
            ratio: 1.19
        },
        indicators: {
            trendStrength: "strong",
            priceAction: "directional",
            rangeExpansion: true,
            supportResistance: {
                broken: true,
                strength: "moderate"
            }
        },
        marketContext: {
            sessionType: "regular",
            timeOfDay: "morning",
            dayOfWeek: new Date().getDay(),
            vix: 16.8,
            news: {
                impact: "moderate",
                sentiment: "positive",
                type: "positive sector news"
            }
        }
    },

    strongDowntrend: {
        instrument: "NQ",
        timestamp: new Date().toISOString(),
        price: 18435.25,
        volatility: {
            intraday: 2.1,
            hourly: 0.9,
            daily: 2.5,
            weekly: 3.1
        },
        volume: {
            current: 225000,
            average: 180000,
            ratio: 1.25
        },
        indicators: {
            trendStrength: "strong",
            priceAction: "directional",
            rangeExpansion: true,
            supportResistance: {
                broken: true,
                strength: "weak"
            }
        },
        marketContext: {
            sessionType: "regular",
            timeOfDay: "morning",
            dayOfWeek: new Date().getDay(),
            vix: 22.4,
            news: {
                impact: "high",
                sentiment: "negative",
                type: "negative economic data"
            }
        }
    },

    rangebound: {
        instrument: "NQ",
        timestamp: new Date().toISOString(),
        price: 18683.50,
        volatility: {
            intraday: 1.2,
            hourly: 0.5,
            daily: 1.7,
            weekly: 2.1
        },
        volume: {
            current: 165000,
            average: 180000,
            ratio: 0.92
        },
        indicators: {
            trendStrength: "none",
            priceAction: "oscillating",
            rangeExpansion: false,
            supportResistance: {
                broken: false,
                strength: "strong"
            }
        },
        marketContext: {
            sessionType: "regular",
            timeOfDay: "various",
            dayOfWeek: new Date().getDay(),
            vix: 14.2,
            news: {
                impact: "low",
                sentiment: "mixed",
                type: "mixed news"
            }
        }
    },

    preMarketGap: {
        instrument: "NQ",
        timestamp: new Date().toISOString(),
        price: 18892.75,
        volatility: {
            intraday: 1.9,
            hourly: 0.7,
            daily: 2.2,
            weekly: 2.5
        },
        volume: {
            current: 75000,
            average: 60000,
            ratio: 1.25
        },
        indicators: {
            trendStrength: "moderate",
            priceAction: "gapping",
            rangeExpansion: true,
            supportResistance: {
                broken: true,
                strength: "uncertain"
            }
        },
        marketContext: {
            sessionType: "pre-market",
            timeOfDay: "pre-open",
            dayOfWeek: new Date().getDay(),
            vix: 17.5,
            news: {
                impact: "moderate",
                sentiment: "positive",
                type: "earnings announcement"
            }
        }
    },

    afterHoursVolatility: {
        instrument: "NQ",
        timestamp: new Date().toISOString(),
        price: 18562.25,
        volatility: {
            intraday: 2.0,
            hourly: 0.8,
            daily: 2.4,
            weekly: 2.7
        },
        volume: {
            current: 85000,
            average: 70000,
            ratio: 1.21
        },
        indicators: {
            trendStrength: "moderate",
            priceAction: "volatile",
            rangeExpansion: true,
            supportResistance: {
                broken: true,
                strength: "weak"
            }
        },
        marketContext: {
            sessionType: "after-hours",
            timeOfDay: "after-close",
            dayOfWeek: new Date().getDay(),
            vix: 19.8,
            news: {
                impact: "high",
                sentiment: "negative",
                type: "earnings miss"
            }
        }
    },

    nfpDay: {
        instrument: "NQ",
        timestamp: new Date().toISOString(),
        price: 18795.50,
        volatility: {
            intraday: 2.5,
            hourly: 1.1,
            daily: 3.0,
            weekly: 3.5
        },
        volume: {
            current: 235000,
            average: 180000,
            ratio: 1.31
        },
        indicators: {
            trendStrength: "uncertain",
            priceAction: "volatile",
            rangeExpansion: true,
            supportResistance: {
                broken: true,
                strength: "weak during announcement"
            }
        },
        marketContext: {
            sessionType: "regular",
            timeOfDay: "morning",
            dayOfWeek: 5, // Friday
            vix: 21.2,
            news: {
                impact: "very high",
                sentiment: "depends on data",
                type: "NFP Economic Data Release"
            }
        }
    },

    fomc: {
        instrument: "NQ",
        timestamp: new Date().toISOString(),
        price: 18645.75,
        volatility: {
            intraday: 2.7,
            hourly: 1.3,
            daily: 3.2,
            weekly: 3.8
        },
        volume: {
            current: 255000,
            average: 180000,
            ratio: 1.42
        },
        indicators: {
            trendStrength: "uncertain",
            priceAction: "whipsaw",
            rangeExpansion: true,
            supportResistance: {
                broken: true,
                strength: "temporarily irrelevant"
            }
        },
        marketContext: {
            sessionType: "regular",
            timeOfDay: "afternoon",
            dayOfWeek: 3, // Wednesday (typical FOMC day)
            vix: 24.8,
            news: {
                impact: "very high",
                sentiment: "depends on announcement",
                type: "FOMC Rate Decision"
            }
        }
    },

    holidayThinVolume: {
        instrument: "NQ",
        timestamp: new Date().toISOString(),
        price: 18668.25,
        volatility: {
            intraday: 1.0,
            hourly: 0.4,
            daily: 1.4,
            weekly: 1.9
        },
        volume: {
            current: 75000,
            average: 180000,
            ratio: 0.42
        },
        indicators: {
            trendStrength: "weak",
            priceAction: "drifting",
            rangeExpansion: false,
            supportResistance: {
                broken: false,
                strength: "untested"
            }
        },
        marketContext: {
            sessionType: "holiday-shortened",
            timeOfDay: "various",
            dayOfWeek: new Date().getDay(),
            vix: 13.5,
            news: {
                impact: "low",
                sentiment: "neutral",
                type: "holiday trading session"
            }
        }
    }
};

// Function to generate test data files
function generateMarketTestData() {
    const realDataPath = path.join(__dirname, 'real', 'market-data-samples');

    // Ensure directories exist
    if (!fs.existsSync(realDataPath)) {
        fs.mkdirSync(realDataPath, { recursive: true });
    }

    // Write each scenario to a separate file
    Object.entries(marketScenarios).forEach(([scenarioKey, scenario]) => {
        const filePath = path.join(realDataPath, `${scenarioKey}-${Date.now()}.json`);
        fs.writeFileSync(filePath, JSON.stringify(scenario, null, 2));
        console.log(`Created scenario file: ${filePath}`);
    });

    console.log(`\nSuccessfully generated ${Object.keys(marketScenarios).length} market condition test data files in ${realDataPath}`);
    return {
        scenariosCount: Object.keys(marketScenarios).length,
        outputDir: realDataPath
    };
}

// Execute if run directly
if (require.main === module) {
    generateMarketTestData();
} else {
    // Export for use in other test files
    module.exports = {
        marketScenarios,
        generateMarketTestData
    };
}
// Full path: C:\TradingDashboard\server\services\marketConditionsService.js

const fs = require('fs');
const path = require('path');

// Define trading sessions and their typical characteristics
const TRADING_SESSIONS = {
    ASIA: {
        name: 'Asian Session',
        timeRange: { start: '19:00:00', end: '03:00:00' }, // EST
        typicalVolatility: 'low',
        typicalVolume: 'low',
        noteableFeatures: ['Range-bound often', 'Key levels established', 'Slower pace']
    },
    EUROPE: {
        name: 'European Session',
        timeRange: { start: '03:00:00', end: '08:00:00' }, // EST
        typicalVolatility: 'medium',
        typicalVolume: 'medium',
        noteableFeatures: ['Increasing activity', 'Reaction to Asian session', 'Economic releases']
    },
    US_OPEN: {
        name: 'US Opening',
        timeRange: { start: '08:00:00', end: '10:00:00' }, // EST
        typicalVolatility: 'high',
        typicalVolume: 'high',
        noteableFeatures: ['High momentum', 'Directional moves', 'Quick reactions to news']
    },
    US_MIDDAY: {
        name: 'US Midday',
        timeRange: { start: '10:00:00', end: '14:00:00' }, // EST
        typicalVolatility: 'medium',
        typicalVolume: 'medium',
        noteableFeatures: ['Consolidation period', 'Lunch hour slowdown', 'Range-finding']
    },
    US_AFTERNOON: {
        name: 'US Afternoon',
        timeRange: { start: '14:00:00', end: '16:00:00' }, // EST
        typicalVolatility: 'medium-high',
        typicalVolume: 'medium-high',
        noteableFeatures: ['Position squaring', 'Late day momentum', 'Closing trends']
    },
    OVERNIGHT: {
        name: 'Overnight',
        timeRange: { start: '16:00:00', end: '19:00:00' }, // EST
        typicalVolatility: 'low',
        typicalVolume: 'low',
        noteableFeatures: ['Thinner markets', 'Can be choppy', 'Often retraces day session']
    }
};

// Parameter adjustments based on market conditions
const PARAMETER_ADJUSTMENTS = {
    HIGH_VOLATILITY: {
        flazh: {
            FastPeriod: 14,      // Shorter for quicker response
            FastRange: 4,
            MediumPeriod: 28,
            MediumRange: 5,
            SlowPeriod: 50,
            SlowRange: 6,
            FilterMultiplier: 15, // Higher to filter more noise
            MinRetracementPercent: 50, // Require deeper retracements
        },
        atm: {
            StopLoss: 28,        // Wider to handle swings
            Target: 56,          // 2:1 ratio maintained
            AutoBreakEvenProfitTrigger: 28,
            AutoBreakEvenPlus: 15,
        }
    },
    MEDIUM_VOLATILITY: {
        flazh: {
            FastPeriod: 21,
            FastRange: 3,
            MediumPeriod: 41,
            MediumRange: 4,
            SlowPeriod: 70,
            SlowRange: 5,
            FilterMultiplier: 10,
            MinRetracementPercent: 40,
        },
        atm: {
            StopLoss: 21,
            Target: 42,
            AutoBreakEvenProfitTrigger: 21,
            AutoBreakEvenPlus: 10,
        }
    },
    LOW_VOLATILITY: {
        flazh: {
            FastPeriod: 28,      // Longer for steadier signals
            FastRange: 2,
            MediumPeriod: 55,
            MediumRange: 3,
            SlowPeriod: 89,
            SlowRange: 4,
            FilterMultiplier: 8,  // Lower for less filtering
            MinRetracementPercent: 30, // Accept shallower retracements
        },
        atm: {
            StopLoss: 14,        // Tighter stop to preserve capital
            Target: 28,          // 2:1 ratio maintained
            AutoBreakEvenProfitTrigger: 14,
            AutoBreakEvenPlus: 7,
        }
    }
};

// Function to identify current trading session
function getCurrentSession(timeStr = null) {
    // Use provided time or current time
    const now = timeStr ? new Date(`2025-01-01T${timeStr}`) : new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInHHMM = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

    // Determine which session we're in
    for (const [sessionKey, session] of Object.entries(TRADING_SESSIONS)) {
        // Handle overnight session that crosses midnight
        if (sessionKey === 'ASIA' &&
            ((timeInHHMM >= session.timeRange.start) || (timeInHHMM < session.timeRange.end))) {
            return sessionKey;
        }
        // Handle normal sessions
        else if (timeInHHMM >= session.timeRange.start && timeInHHMM < session.timeRange.end) {
            return sessionKey;
        }
    }
    return 'UNKNOWN';
}

// Function to analyze volatility from NinjaTrader exported data
function analyzeVolatility(volatilityData) {
    // Default to medium if no data available
    if (!volatilityData || !volatilityData.metrics || volatilityData.metrics.length === 0) {
        return 'MEDIUM_VOLATILITY';
    }

    // Extract relevant metrics
    const atr = volatilityData.metrics.find(m => m.name === 'ATR');
    const volume = volatilityData.metrics.find(m => m.name === 'Volume');
    const range = volatilityData.metrics.find(m => m.name === 'Range');

    // Simple scoring system based on ATR and volume
    let volatilityScore = 0;

    if (atr) {
        const atrValue = atr.value;
        const atrAvg = atr.average;

        if (atrValue > atrAvg * 1.5) volatilityScore += 2;
        else if (atrValue > atrAvg * 1.1) volatilityScore += 1;
        else if (atrValue < atrAvg * 0.7) volatilityScore -= 2;
        else if (atrValue < atrAvg * 0.9) volatilityScore -= 1;
    }

    if (volume) {
        const volumeValue = volume.value;
        const volumeAvg = volume.average;

        if (volumeValue > volumeAvg * 1.5) volatilityScore += 2;
        else if (volumeValue > volumeAvg * 1.1) volatilityScore += 1;
        else if (volumeValue < volumeAvg * 0.7) volatilityScore -= 2;
        else if (volumeValue < volumeAvg * 0.9) volatilityScore -= 1;
    }

    // Determine volatility category based on score
    if (volatilityScore >= 2) return 'HIGH_VOLATILITY';
    else if (volatilityScore <= -2) return 'LOW_VOLATILITY';
    else return 'MEDIUM_VOLATILITY';
}

// Function to get recommended parameters based on current conditions
function getRecommendedParameters(session, volatilityCategory) {
    const sessionInfo = TRADING_SESSIONS[session];
    const volatilityParams = PARAMETER_ADJUSTMENTS[volatilityCategory];

    return {
        sessionInfo,
        flazhParams: volatilityParams.flazh,
        atmParams: volatilityParams.atm,
        timestamp: new Date().toISOString(),
        rationale: `Parameters optimized for ${sessionInfo.name} with ${volatilityCategory.toLowerCase().replace('_', ' ')}`
    };
}

// Function to read volatility data from NinjaTrader output
function getVolatilityData() {
    try {
        const volatilityFile = path.resolve('C:\\NinjaTraderData\\VolatilityMetrics.json');
        if (fs.existsSync(volatilityFile)) {
            const rawData = fs.readFileSync(volatilityFile, 'utf8');
            return JSON.parse(rawData);
        } else {
            console.log('Volatility metrics file not found, using defaults');
            return null;
        }
    } catch (error) {
        console.error('Error reading volatility metrics:', error.message);
        return null;
    }
}

// Main function to analyze current market conditions
function analyzeMarketConditions() {
    // Get current session
    const currentSession = getCurrentSession();

    // Get volatility data and analyze
    const volatilityData = getVolatilityData();
    const volatilityCategory = analyzeVolatility(volatilityData);

    // Get recommended parameters
    const recommendations = getRecommendedParameters(currentSession, volatilityCategory);

    return {
        currentTime: new Date().toISOString(),
        currentSession: currentSession,
        volatilityCategory: volatilityCategory,
        volatilityData: volatilityData,
        recommendations: recommendations
    };
}

module.exports = {
    analyzeMarketConditions,
    getCurrentSession,
    analyzeVolatility,
    getRecommendedParameters,
    TRADING_SESSIONS,
    PARAMETER_ADJUSTMENTS
};
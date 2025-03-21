// Update in C:\TradingDashboard\server\services\analysis\marketConditionsService.js

// Define trading sessions with Central Time Zone (CT) times
const TRADING_SESSIONS = {
    ASIA: {
        name: 'Asian Session',
        timeRange: { start: '18:00:00', end: '02:00:00' }, // CT
        typicalVolatility: 'low',
        typicalVolume: 'low',
        noteableFeatures: ['Range-bound often', 'Key levels established', 'Slower pace']
    },
    EUROPE: {
        name: 'European Session',
        timeRange: { start: '02:00:00', end: '07:00:00' }, // CT
        typicalVolatility: 'medium',
        typicalVolume: 'medium',
        noteableFeatures: ['Increasing activity', 'Reaction to Asian session', 'Economic releases']
    },
    US_OPEN: {
        name: 'US Opening',
        timeRange: { start: '07:00:00', end: '09:30:00' }, // CT, with NQ open at 8:30 CT
        typicalVolatility: 'high',
        typicalVolume: 'high',
        noteableFeatures: ['High momentum', 'Directional moves', 'Quick reactions to news']
    },
    US_MIDDAY: {
        name: 'US Midday',
        timeRange: { start: '09:30:00', end: '13:00:00' }, // CT
        typicalVolatility: 'medium',
        typicalVolume: 'medium',
        noteableFeatures: ['Consolidation period', 'Lunch hour slowdown', 'Range-finding']
    },
    US_AFTERNOON: {
        name: 'US Afternoon',
        timeRange: { start: '13:00:00', end: '15:00:00' }, // CT
        typicalVolatility: 'medium-high',
        typicalVolume: 'medium-high',
        noteableFeatures: ['Position squaring', 'Late day momentum', 'Closing trends']
    },
    OVERNIGHT: {
        name: 'Overnight',
        timeRange: { start: '15:00:00', end: '18:00:00' }, // CT
        typicalVolatility: 'low',
        typicalVolume: 'low',
        noteableFeatures: ['Thinner markets', 'Can be choppy', 'Often retraces day session']
    }
};
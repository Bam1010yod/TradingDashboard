// Full path: C:\TradingDashboard\server\test\test-market-regime-integration.js

const integratedRecommendationService = require('../services/integratedRecommendationService');

async function testMarketRegimeIntegration() {
    console.log('Testing market regime integration with template selection...');

    try {
        // Test for morning session
        console.log('\n=== TESTING MORNING SESSION ===');
        const morningRecommendations = await integratedRecommendationService.getIntegratedRecommendations('Morning');

        // Print key information
        console.log('\nMarket Regime:');
        console.log(`Current Session: ${morningRecommendations.marketRegime.currentSession}`);
        console.log(`Volatility: ${morningRecommendations.marketRegime.volatilityCategory}`);

        console.log('\nSelected Templates:');
        console.log(`ATM Template: ${morningRecommendations.enhancedTemplates.atm.templateName} (Similarity: ${morningRecommendations.enhancedTemplates.atm.similarityScore})`);
        console.log(`Flazh Template: ${morningRecommendations.enhancedTemplates.flazh.templateName} (Similarity: ${morningRecommendations.enhancedTemplates.flazh.similarityScore})`);

        console.log('\nRationale:');
        console.log(morningRecommendations.rationale);

        // Test for afternoon session
        console.log('\n=== TESTING AFTERNOON SESSION ===');
        const afternoonRecommendations = await integratedRecommendationService.getIntegratedRecommendations('Afternoon');

        // Print key information
        console.log('\nMarket Regime:');
        console.log(`Current Session: ${afternoonRecommendations.marketRegime.currentSession}`);
        console.log(`Volatility: ${afternoonRecommendations.marketRegime.volatilityCategory}`);

        console.log('\nSelected Templates:');
        console.log(`ATM Template: ${afternoonRecommendations.enhancedTemplates.atm.templateName} (Similarity: ${afternoonRecommendations.enhancedTemplates.atm.similarityScore})`);
        console.log(`Flazh Template: ${afternoonRecommendations.enhancedTemplates.flazh.templateName} (Similarity: ${afternoonRecommendations.enhancedTemplates.flazh.similarityScore})`);

        console.log('\nRationale:');
        console.log(afternoonRecommendations.rationale);

        console.log('\nTest completed successfully!');
    } catch (error) {
        console.error('Error in market regime integration test:', error);
    }
}

// Run the test
testMarketRegimeIntegration();
/**
 * Simple test methods for the system health monitoring
 */

const healthService = require('../services/healthService');

/**
 * Test overall system health check
 */
async function testSystemHealth() {
    try {
        console.log('Testing system health check...');

        const health = await healthService.checkSystemHealth();

        console.log('System health check completed!');
        console.log('Overall status:', health.status);
        console.log('Database status:', health.components.database.status);
        console.log('CPU usage:', health.performance.cpu.usage.toFixed(2) + '%');
        console.log('Memory usage:', health.performance.memory.usagePercent.toFixed(2) + '%');
        console.log('Disk usage:', health.disk.usagePercent.toFixed(2) + '%');

        return health;
    } catch (error) {
        console.error('Error testing system health:', error);
        throw error;
    }
}

/**
 * Test database status check
 */
async function testDatabaseStatus() {
    try {
        console.log('Testing database status check...');

        const dbStatus = await healthService.checkDatabaseStatus();

        console.log('Database status check completed!');
        console.log('Status:', dbStatus.status);
        console.log('Description:', dbStatus.description);

        return dbStatus;
    } catch (error) {
        console.error('Error testing database status:', error);
        throw error;
    }
}

/**
 * Test services status check
 */
async function testServicesStatus() {
    try {
        console.log('Testing services status check...');

        const servicesStatus = await healthService.checkServicesStatus();

        console.log('Services status check completed!');

        for (const [service, status] of Object.entries(servicesStatus)) {
            console.log(`${service}: ${status.status}`);
        }

        return servicesStatus;
    } catch (error) {
        console.error('Error testing services status:', error);
        throw error;
    }
}

/**
 * Test error logs retrieval
 */
async function testErrorLogs() {
    try {
        console.log('Testing error logs retrieval...');

        const logs = await healthService.getErrorLogs(5);

        console.log('Error logs retrieved!');
        console.log('Number of logs:', logs.length);

        for (const log of logs) {
            console.log(`${log.timestamp.toISOString()} [${log.level}] ${log.service}: ${log.message}`);
        }

        return logs;
    } catch (error) {
        console.error('Error testing error logs retrieval:', error);
        throw error;
    }
}

// If this file is run directly
if (require.main === module) {
    testSystemHealth()
        .then(() => testDatabaseStatus())
        .then(() => testServicesStatus())
        .then(() => testErrorLogs())
        .then(() => {
            console.log('All health monitoring tests completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = {
    testSystemHealth,
    testDatabaseStatus,
    testServicesStatus,
    testErrorLogs
};
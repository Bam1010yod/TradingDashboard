/**
 * Health Service
 * Monitors the status of all system components
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');

class HealthService {
    /**
     * Initialize the health service
     * @returns {Promise<boolean>} - Initialization success
     */
    async initialize() {
        console.log('Health Service initialized');
        return true;
    }

    /**
     * Check the overall system health
     * @returns {Promise<Object>} - System health status
     */
    async checkSystemHealth() {
        try {
            // Check all components
            const [
                databaseStatus,
                servicesStatus,
                ninjaTraderStatus,
                systemPerformance,
                diskStatus
            ] = await Promise.all([
                this.checkDatabaseStatus(),
                this.checkServicesStatus(),
                this.checkNinjaTraderStatus(),
                this.getSystemPerformance(),
                this.checkDiskSpace()
            ]);

            // Determine overall system status
            const allComponents = [
                databaseStatus,
                ...Object.values(servicesStatus),
                ninjaTraderStatus
            ];

            const systemStatus = allComponents.every(component => component.status === 'operational')
                ? 'operational'
                : allComponents.some(component => component.status === 'down')
                    ? 'degraded'
                    : 'warning';

            return {
                timestamp: new Date(),
                status: systemStatus,
                components: {
                    database: databaseStatus,
                    services: servicesStatus,
                    ninjaTrader: ninjaTraderStatus
                },
                performance: systemPerformance,
                disk: diskStatus
            };
        } catch (error) {
            console.error('Error checking system health:', error);
            throw error;
        }
    }

    /**
     * Check database connection status
     * @returns {Promise<Object>} - Database status
     */
    async checkDatabaseStatus() {
        try {
            // Check MongoDB connection
            const status = mongoose.connection.readyState;

            // Convert numeric status to descriptive status
            let statusText;
            let statusDescription;

            switch (status) {
                case 0:
                    statusText = 'down';
                    statusDescription = 'Disconnected';
                    break;
                case 1:
                    statusText = 'operational';
                    statusDescription = 'Connected';
                    break;
                case 2:
                    statusText = 'warning';
                    statusDescription = 'Connecting';
                    break;
                case 3:
                    statusText = 'warning';
                    statusDescription = 'Disconnecting';
                    break;
                default:
                    statusText = 'unknown';
                    statusDescription = 'Unknown status';
            }

            // Get connection details
            const connectionDetails = mongoose.connection.client
                ? {
                    host: mongoose.connection.host,
                    port: mongoose.connection.port,
                    name: mongoose.connection.name
                }
                : null;

            return {
                name: 'MongoDB',
                status: statusText,
                description: statusDescription,
                connection: connectionDetails,
                lastChecked: new Date()
            };
        } catch (error) {
            console.error('Error checking database status:', error);

            return {
                name: 'MongoDB',
                status: 'error',
                description: `Error checking status: ${error.message}`,
                lastChecked: new Date()
            };
        }
    }

    /**
     * Check status of all services
     * @returns {Promise<Object>} - Services status
     */
    async checkServicesStatus() {
        try {
            // List of services to check
            const services = [
                'marketDataService',
                'propFirmService',
                'marketNewsService',
                'templateService'
            ];

            const serviceStatus = {};

            // In a real implementation, you would check if each service is
            // functioning properly. For simplicity, we'll simulate this.
            for (const service of services) {
                serviceStatus[service] = await this._simulateServiceCheck(service);
            }

            return serviceStatus;
        } catch (error) {
            console.error('Error checking services status:', error);
            throw error;
        }
    }

    /**
     * Check NinjaTrader connection status
     * @returns {Promise<Object>} - NinjaTrader status
     */
    async checkNinjaTraderStatus() {
        try {
            // In a real implementation, you would check the actual NinjaTrader connection
            // For this example, we'll simulate it

            // Simulate an 80% chance of NinjaTrader being operational
            const isOperational = Math.random() > 0.2;

            return {
                name: 'NinjaTrader',
                status: isOperational ? 'operational' : 'down',
                description: isOperational
                    ? 'Connected to NinjaTrader'
                    : 'Not connected to NinjaTrader',
                lastChecked: new Date()
            };
        } catch (error) {
            console.error('Error checking NinjaTrader status:', error);

            return {
                name: 'NinjaTrader',
                status: 'error',
                description: `Error checking status: ${error.message}`,
                lastChecked: new Date()
            };
        }
    }

    /**
     * Get system performance metrics
     * @returns {Promise<Object>} - System performance
     */
    async getSystemPerformance() {
        try {
            // Get CPU load
            const cpuLoad = os.loadavg()[0];
            const cpuCount = os.cpus().length;
            const cpuUsagePercent = (cpuLoad / cpuCount) * 100;

            // Get memory usage
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            const memoryUsagePercent = (usedMemory / totalMemory) * 100;

            // Get uptime
            const uptime = os.uptime();

            return {
                cpu: {
                    usage: cpuUsagePercent,
                    cores: cpuCount,
                    load: cpuLoad
                },
                memory: {
                    total: totalMemory,
                    used: usedMemory,
                    free: freeMemory,
                    usagePercent: memoryUsagePercent
                },
                uptime: uptime,
                platform: os.platform(),
                hostname: os.hostname(),
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error getting system performance:', error);

            return {
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    /**
     * Check disk space
     * @returns {Promise<Object>} - Disk space status
     */
    async checkDiskSpace() {
        try {
            // Get application directory
            const appDir = path.resolve('.');

            // In a real implementation, you would use a package like 'diskusage'
            // For this example, we'll simulate disk usage

            const totalSpace = 1000 * 1024 * 1024 * 1024; // 1TB
            const freeSpace = totalSpace * (0.3 + Math.random() * 0.4); // 30-70% free
            const usedSpace = totalSpace - freeSpace;
            const usagePercent = (usedSpace / totalSpace) * 100;

            return {
                directory: appDir,
                total: totalSpace,
                free: freeSpace,
                used: usedSpace,
                usagePercent: usagePercent,
                status: usagePercent > 90 ? 'warning' : 'operational',
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error checking disk space:', error);

            return {
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    /**
     * Get error logs
     * @param {number} limit - Maximum number of errors to return
     * @returns {Promise<Array>} - Recent error logs
     */
    async getErrorLogs(limit = 20) {
        try {
            // In a real implementation, you would read from an error log file
            // For this example, we'll return simulated error logs

            const sampleErrors = [
                {
                    timestamp: new Date(Date.now() - 1000 * 60 * 5),
                    service: 'marketDataService',
                    level: 'ERROR',
                    message: 'Failed to connect to market data feed: timeout'
                },
                {
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    service: 'ninjaTrader',
                    level: 'WARNING',
                    message: 'NinjaTrader connection unstable'
                },
                {
                    timestamp: new Date(Date.now() - 1000 * 60 * 60),
                    service: 'database',
                    level: 'ERROR',
                    message: 'MongoDB write operation timeout'
                }
            ];

            // Return the most recent errors
            return sampleErrors.slice(0, limit);
        } catch (error) {
            console.error('Error getting error logs:', error);
            return [];
        }
    }

    /**
     * Run a periodic health check
     * @param {number} intervalMinutes - Check interval in minutes
     */
    startPeriodicHealthCheck(intervalMinutes = 5) {
        // Convert minutes to milliseconds
        const interval = intervalMinutes * 60 * 1000;

        console.log(`Starting periodic health check every ${intervalMinutes} minutes`);

        // Run an initial check
        this.checkSystemHealth()
            .then(health => {
                console.log(`Initial health check: System is ${health.status}`);
            })
            .catch(error => {
                console.error('Error in initial health check:', error);
            });

        // Set up periodic check
        setInterval(() => {
            this.checkSystemHealth()
                .then(health => {
                    if (health.status !== 'operational') {
                        console.warn(`Health check warning: System is ${health.status}`);
                    }
                })
                .catch(error => {
                    console.error('Error in periodic health check:', error);
                });
        }, interval);
    }

    // Private helper methods

    /**
     * Simulate service status check
     * @param {string} serviceName - Name of the service
     * @returns {Promise<Object>} - Service status
     * @private
     */
    async _simulateServiceCheck(serviceName) {
        // Randomize service status (90% chance of being operational)
        const isOperational = Math.random() > 0.1;
        const isWarning = !isOperational && Math.random() > 0.5;

        let status;
        let description;

        if (isOperational) {
            status = 'operational';
            description = `${serviceName} is running normally`;
        } else if (isWarning) {
            status = 'warning';
            description = `${serviceName} is experiencing intermittent issues`;
        } else {
            status = 'down';
            description = `${serviceName} is not responding`;
        }

        return {
            name: serviceName,
            status,
            description,
            lastChecked: new Date()
        };
    }
}

module.exports = new HealthService();
// File: C:\TradingDashboard\server\tools\dataArchiving.js

/**
 * Database Archiving and Maintenance Tool
 * 
 * This script provides functionality to archive old data from the MongoDB database
 * and maintain optimal database performance.
 * 
 * Features:
 * - Archives old market data to compressed files
 * - Prunes database collections to maintain performance
 * - Schedules regular maintenance tasks
 * - Generates maintenance reports
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { createGzip } = require('zlib');
const { pipeline } = require('stream');
const { promisify } = require('util');
const { createReadStream, createWriteStream } = require('fs');
require('dotenv').config();

// Import database connection
const connectDB = require('../config/database');

// Set paths
const ARCHIVE_DIR = path.join(__dirname, '..', 'backups', 'archives');
const REPORT_DIR = path.join(__dirname, '..', 'backups', 'reports');

// Ensure directories exist
if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}
if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Configuration
const config = {
    // Data older than this will be archived (in days)
    archiveThreshold: 90,

    // Keep this many days of data in the main database
    retentionPeriod: 30,

    // Maximum records per archive file
    maxRecordsPerFile: 10000,

    // Collections to archive
    collectionsToArchive: [
        { name: 'marketdata', dateField: 'timestamp' },
        { name: 'tradejournals', dateField: 'date' },
        { name: 'backtests', dateField: 'runDate' },
        { name: 'performancerecords', dateField: 'date' }
    ]
};

// Main function
async function runDatabaseMaintenance() {
    try {
        console.log('Starting database maintenance...');
        console.log(`Archive threshold: ${config.archiveThreshold} days`);
        console.log(`Retention period: ${config.retentionPeriod} days`);

        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Archive old data
        const archiveResults = await archiveOldData();

        // Prune database (delete archived data)
        const pruneResults = await pruneDatabase();

        // Run database optimization
        const optimizationResults = await optimizeDatabase();

        // Generate maintenance report
        const report = generateMaintenanceReport(archiveResults, pruneResults, optimizationResults);

        // Save report
        const reportFilePath = path.join(REPORT_DIR, `maintenance-report-${Date.now()}.txt`);
        fs.writeFileSync(reportFilePath, report);
        console.log(`Maintenance report saved to: ${reportFilePath}`);

        console.log('Database maintenance completed successfully');
    } catch (error) {
        console.error('Database maintenance error:', error);
    } finally {
        // Close database connection
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('Database connection closed');
        }
    }
}

// Archive old data from database
async function archiveOldData() {
    console.log('\nArchiving old data...');
    const archiveResults = [];

    // Calculate archive date threshold
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - config.archiveThreshold);

    // Process each collection
    for (const collection of config.collectionsToArchive) {
        console.log(`\nProcessing collection: ${collection.name}`);

        try {
            // Get collection from database
            const db = mongoose.connection.db;
            const dbCollection = db.collection(collection.name);

            // Create query for old data
            const query = { [collection.dateField]: { $lt: archiveDate } };

            // Count documents to archive
            const count = await dbCollection.countDocuments(query);
            console.log(`Found ${count} documents to archive`);

            if (count === 0) {
                archiveResults.push({
                    collection: collection.name,
                    archived: 0,
                    files: 0,
                    status: 'No data to archive'
                });
                continue;
            }

            // Archive data in batches
            let archived = 0;
            let fileCount = 0;
            let cursor = dbCollection.find(query).sort({ [collection.dateField]: 1 });

            while (await cursor.hasNext()) {
                // Create archive file
                const fileName = `${collection.name}-${Date.now()}-${fileCount}.json.gz`;
                const filePath = path.join(ARCHIVE_DIR, fileName);
                const fileStream = createWriteStream(filePath);
                const gzip = createGzip();
                const pipelineAsync = promisify(pipeline);

                // Write opening bracket for JSON array
                gzip.write('[\n');

                // Process batch of records
                let batchCount = 0;
                let firstInBatch = true;

                while (await cursor.hasNext() && batchCount < config.maxRecordsPerFile) {
                    const doc = await cursor.next();

                    // Add comma before all but first document
                    if (!firstInBatch) {
                        gzip.write(',\n');
                    } else {
                        firstInBatch = false;
                    }

                    // Write document to archive
                    gzip.write(JSON.stringify(doc));

                    batchCount++;
                    archived++;
                }

                // Write closing bracket for JSON array
                gzip.write('\n]');
                gzip.end();

                // Wait for pipeline to finish
                await pipelineAsync(gzip, fileStream);
                fileCount++;

                console.log(`Created archive: ${fileName} with ${batchCount} records`);

                // If no more records, break out of loop
                if (batchCount < config.maxRecordsPerFile) {
                    break;
                }
            }

            archiveResults.push({
                collection: collection.name,
                archived,
                files: fileCount,
                status: 'Success'
            });

            console.log(`Archived ${archived} documents from ${collection.name} in ${fileCount} files`);

        } catch (error) {
            console.error(`Error archiving ${collection.name}:`, error);
            archiveResults.push({
                collection: collection.name,
                error: error.message,
                status: 'Failed'
            });
        }
    }

    return archiveResults;
}

// Prune database (delete archived data)
async function pruneDatabase() {
    console.log('\nPruning database...');
    const pruneResults = [];

    // Calculate retention date threshold
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - config.retentionPeriod);

    // Process each collection
    for (const collection of config.collectionsToArchive) {
        console.log(`\nPruning collection: ${collection.name}`);

        try {
            // Get collection from database
            const db = mongoose.connection.db;
            const dbCollection = db.collection(collection.name);

            // Create query for data beyond retention period
            const query = { [collection.dateField]: { $lt: retentionDate } };

            // Count documents to delete
            const count = await dbCollection.countDocuments(query);
            console.log(`Found ${count} documents to delete`);

            if (count === 0) {
                pruneResults.push({
                    collection: collection.name,
                    deleted: 0,
                    status: 'No data to delete'
                });
                continue;
            }

            // Delete old data
            const result = await dbCollection.deleteMany(query);

            pruneResults.push({
                collection: collection.name,
                deleted: result.deletedCount,
                status: 'Success'
            });

            console.log(`Deleted ${result.deletedCount} documents from ${collection.name}`);

        } catch (error) {
            console.error(`Error pruning ${collection.name}:`, error);
            pruneResults.push({
                collection: collection.name,
                error: error.message,
                status: 'Failed'
            });
        }
    }

    return pruneResults;
}

// Optimize database
async function optimizeDatabase() {
    console.log('\nOptimizing database...');
    const optimizationResults = [];

    try {
        const db = mongoose.connection.db;

        // Run database stats
        const stats = await db.stats();
        console.log('Database stats:', JSON.stringify(stats, null, 2));

        // Get all collections
        const collections = await db.listCollections().toArray();

        // Optimize each collection
        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`Optimizing collection: ${collectionName}`);

            try {
                // Repair collection
                await db.command({ repairDatabase: 1 });

                // Run collection stats
                const collStats = await db.collection(collectionName).stats();

                optimizationResults.push({
                    collection: collectionName,
                    status: 'Optimized',
                    size: collStats.size,
                    count: collStats.count
                });

            } catch (error) {
                console.error(`Error optimizing ${collectionName}:`, error);
                optimizationResults.push({
                    collection: collectionName,
                    status: 'Failed',
                    error: error.message
                });
            }
        }

    } catch (error) {
        console.error('Database optimization error:', error);
    }

    return optimizationResults;
}

// Generate maintenance report
function generateMaintenanceReport(archiveResults, pruneResults, optimizationResults) {
    const now = new Date();

    let report = 'DATABASE MAINTENANCE REPORT\n';
    report += '==========================\n\n';
    report += `Date: ${now.toLocaleString()}\n\n`;

    // Archive results
    report += 'ARCHIVE RESULTS\n';
    report += '--------------\n\n';
    archiveResults.forEach(result => {
        report += `Collection: ${result.collection}\n`;
        report += `Status: ${result.status}\n`;
        if (result.archived !== undefined) {
            report += `Documents Archived: ${result.archived}\n`;
            report += `Archive Files Created: ${result.files}\n`;
        }
        if (result.error) {
            report += `Error: ${result.error}\n`;
        }
        report += '\n';
    });

    // Prune results
    report += 'PRUNE RESULTS\n';
    report += '------------\n\n';
    pruneResults.forEach(result => {
        report += `Collection: ${result.collection}\n`;
        report += `Status: ${result.status}\n`;
        if (result.deleted !== undefined) {
            report += `Documents Deleted: ${result.deleted}\n`;
        }
        if (result.error) {
            report += `Error: ${result.error}\n`;
        }
        report += '\n';
    });

    // Optimization results
    report += 'OPTIMIZATION RESULTS\n';
    report += '-------------------\n\n';
    optimizationResults.forEach(result => {
        report += `Collection: ${result.collection}\n`;
        report += `Status: ${result.status}\n`;
        if (result.size !== undefined) {
            report += `Collection Size: ${formatBytes(result.size)}\n`;
            report += `Document Count: ${result.count}\n`;
        }
        if (result.error) {
            report += `Error: ${result.error}\n`;
        }
        report += '\n';
    });

    // Summary
    report += 'SUMMARY\n';
    report += '-------\n\n';

    const totalArchived = archiveResults.reduce((sum, result) => sum + (result.archived || 0), 0);
    const totalDeleted = pruneResults.reduce((sum, result) => sum + (result.deleted || 0), 0);
    const failedArchives = archiveResults.filter(r => r.status === 'Failed').length;
    const failedPrunes = pruneResults.filter(r => r.status === 'Failed').length;
    const failedOptimizations = optimizationResults.filter(r => r.status === 'Failed').length;

    report += `Total Documents Archived: ${totalArchived}\n`;
    report += `Total Documents Deleted: ${totalDeleted}\n`;
    report += `Failed Operations: ${failedArchives + failedPrunes + failedOptimizations}\n\n`;

    report += `Next Scheduled Maintenance: ${getNextMaintenanceDate(now)}\n`;

    return report;
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Get next maintenance date (7 days from now)
function getNextMaintenanceDate(now) {
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + 7);
    return nextDate.toLocaleString();
}

// Add function to schedule maintenance
function scheduleMaintenance() {
    console.log('Scheduling database maintenance...');

    // Run maintenance once a week (604800000 ms = 7 days)
    const interval = 7 * 24 * 60 * 60 * 1000;

    setInterval(() => {
        console.log('Running scheduled maintenance...');
        runDatabaseMaintenance();
    }, interval);

    console.log(`Maintenance scheduled to run every ${interval / (24 * 60 * 60 * 1000)} days`);
}

// Run maintenance if script is called directly
if (require.main === module) {
    if (process.argv[2] === '--schedule') {
        // Schedule regular maintenance
        scheduleMaintenance();
        // Run initial maintenance
        runDatabaseMaintenance();
    } else {
        // Run maintenance once
        runDatabaseMaintenance();
    }
} else {
    // Export functions for use in other scripts
    module.exports = {
        runDatabaseMaintenance,
        archiveOldData,
        pruneDatabase,
        optimizeDatabase,
        scheduleMaintenance
    };
}
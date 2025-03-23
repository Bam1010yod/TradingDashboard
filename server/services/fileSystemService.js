// Full path: C:\TradingDashboard\server\services\fileSystemService.js

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const mongoose = require('mongoose');

/**
 * File System Service
 * Handles reading and writing templates from/to NinjaTrader folders
 */
class FileSystemService {
    constructor() {
        // NinjaTrader template paths
        this.atmTemplatesPath = 'C:\\Users\\bridg\\Documents\\NinjaTrader 8\\templates\\ATM';
        this.flazhTemplatesPath = 'C:\\Users\\bridg\\Documents\\NinjaTrader 8\\templates\\Indicator\\RenkoKings_FlazhInfinity';

        // XML parser/builder
        this.parser = new xml2js.Parser({ explicitArray: false });
        this.builder = new xml2js.Builder();
    }

    /**
     * Read all Flazh templates from the file system
     * @returns {Promise<Array>} - Array of template objects
     */
    async readFlazhTemplates() {
        try {
            console.log(`Reading Flazh templates from: ${this.flazhTemplatesPath}`);
            const templateFiles = await fs.promises.readdir(this.flazhTemplatesPath);
            const flazhFiles = templateFiles.filter(file => file.startsWith('Flazh_') && file.endsWith('.xml'));

            console.log(`Found ${flazhFiles.length} Flazh template files`);

            // Read each template file
            const templates = [];
            for (const file of flazhFiles) {
                const filePath = path.join(this.flazhTemplatesPath, file);
                const template = await this.readFlazhTemplate(filePath);
                if (template) {
                    templates.push(template);
                }
            }

            return templates;
        } catch (error) {
            console.error(`Error reading Flazh templates: ${error.message}`);
            return [];
        }
    }

    /**
     * Read all ATM templates from the file system
     * @returns {Promise<Array>} - Array of template objects
     */
    async readAtmTemplates() {
        try {
            console.log(`Reading ATM templates from: ${this.atmTemplatesPath}`);
            const templateFiles = await fs.promises.readdir(this.atmTemplatesPath);
            const atmFiles = templateFiles.filter(file => file.startsWith('ATM_') && file.endsWith('.xml'));

            console.log(`Found ${atmFiles.length} ATM template files`);

            // Read each template file
            const templates = [];
            for (const file of atmFiles) {
                const filePath = path.join(this.atmTemplatesPath, file);
                const template = await this.readAtmTemplate(filePath);
                if (template) {
                    templates.push(template);
                }
            }

            return templates;
        } catch (error) {
            console.error(`Error reading ATM templates: ${error.message}`);
            return [];
        }
    }

    /**
     * Read a single Flazh template file
     * @param {string} filePath - Full path to the template file
     * @returns {Promise<Object>} - Template object
     */
    async readFlazhTemplate(filePath) {
        try {
            const fileName = path.basename(filePath);
            const xmlData = await fs.promises.readFile(filePath, 'utf8');

            // Parse XML to JS object
            const result = await this.parseXml(xmlData);

            if (!result || !result.NinjaTrader || !result.NinjaTrader.RenkoKings_FlazhInfinity || !result.NinjaTrader.RenkoKings_FlazhInfinity.RenkoKings_FlazhInfinity) {
                console.error(`Invalid Flazh template format: ${fileName}`);
                return null;
            }

            const flazhData = result.NinjaTrader.RenkoKings_FlazhInfinity.RenkoKings_FlazhInfinity;

            // Extract key template parameters
            const template = {
                name: fileName.replace('.xml', ''),
                fastPeriod: parseInt(flazhData.FastPeriod) || 0,
                fastRange: parseInt(flazhData.FastRange) || 0,
                mediumPeriod: parseInt(flazhData.MediumPeriod) || 0,
                mediumRange: parseInt(flazhData.MediumRange) || 0,
                slowPeriod: parseInt(flazhData.SlowPeriod) || 0,
                slowRange: parseInt(flazhData.SlowRange) || 0,
                filterMultiplier: parseInt(flazhData.FilterMultiplier) || 0,
                searchLimit: parseInt(flazhData.SearchLimit) || 0,
                minOffset: parseInt(flazhData.MinOffset) || 0,
                minRetracementPercent: parseInt(flazhData.MinRetracementPercent) || 0,
                sourceFilePath: filePath,
                rawXml: xmlData
            };

            return template;
        } catch (error) {
            console.error(`Error reading Flazh template ${filePath}: ${error.message}`);
            return null;
        }
    }

    /**
     * Read a single ATM template file
     * @param {string} filePath - Full path to the template file
     * @returns {Promise<Object>} - Template object
     */
    async readAtmTemplate(filePath) {
        try {
            const fileName = path.basename(filePath);
            const xmlData = await fs.promises.readFile(filePath, 'utf8');

            // Parse XML to JS object
            const result = await this.parseXml(xmlData);

            if (!result || !result.NinjaTrader || !result.NinjaTrader.AtmStrategy) {
                console.error(`Invalid ATM template format: ${fileName}`);
                return null;
            }

            const atmData = result.NinjaTrader.AtmStrategy;

            // Extract key template parameters
            const template = {
                name: fileName.replace('.xml', ''),
                calculationMode: atmData.CalculationMode || 'Ticks',
                brackets: []
            };

            // Process brackets if they exist
            if (atmData.Brackets && atmData.Brackets.Bracket) {
                // Handle case where there's only one bracket (not an array)
                if (!Array.isArray(atmData.Brackets.Bracket)) {
                    const bracket = atmData.Brackets.Bracket;
                    template.brackets.push({
                        quantity: parseInt(bracket.Quantity) || 1,
                        stopLoss: parseInt(bracket.StopLoss) || 0,
                        target: parseInt(bracket.Target) || 0,
                        stopStrategy: bracket.StopStrategy ? {
                            autoBreakEvenPlus: parseInt(bracket.StopStrategy.AutoBreakEvenPlus) || 0,
                            autoBreakEvenProfitTrigger: parseInt(bracket.StopStrategy.AutoBreakEvenProfitTrigger) || 0
                        } : {}
                    });
                } else {
                    // Handle case where there are multiple brackets
                    for (const bracket of atmData.Brackets.Bracket) {
                        template.brackets.push({
                            quantity: parseInt(bracket.Quantity) || 1,
                            stopLoss: parseInt(bracket.StopLoss) || 0,
                            target: parseInt(bracket.Target) || 0,
                            stopStrategy: bracket.StopStrategy ? {
                                autoBreakEvenPlus: parseInt(bracket.StopStrategy.AutoBreakEvenPlus) || 0,
                                autoBreakEvenProfitTrigger: parseInt(bracket.StopStrategy.AutoBreakEvenProfitTrigger) || 0
                            } : {}
                        });
                    }
                }
            }

            template.sourceFilePath = filePath;
            template.rawXml = xmlData;

            return template;
        } catch (error) {
            console.error(`Error reading ATM template ${filePath}: ${error.message}`);
            return null;
        }
    }

    /**
     * Write a Flazh template to file
     * @param {Object} template - The template object
     * @returns {Promise<boolean>} - Success status
     */
    async writeFlazhTemplate(template) {
        try {
            if (!template || !template.name) {
                throw new Error('Invalid template data');
            }

            // Determine filename
            const fileName = template.name.endsWith('.xml') ? template.name : `${template.name}.xml`;
            const filePath = path.join(this.flazhTemplatesPath, fileName);

            console.log(`Writing Flazh template to: ${filePath}`);

            // If we have the original XML, update the relevant parameters and save
            if (template.rawXml) {
                const result = await this.parseXml(template.rawXml);

                if (result && result.NinjaTrader && result.NinjaTrader.RenkoKings_FlazhInfinity &&
                    result.NinjaTrader.RenkoKings_FlazhInfinity.RenkoKings_FlazhInfinity) {

                    const flazhData = result.NinjaTrader.RenkoKings_FlazhInfinity.RenkoKings_FlazhInfinity;

                    // Update with new values
                    flazhData.FastPeriod = template.fastPeriod;
                    flazhData.FastRange = template.fastRange;
                    flazhData.MediumPeriod = template.mediumPeriod;
                    flazhData.MediumRange = template.mediumRange;
                    flazhData.SlowPeriod = template.slowPeriod;
                    flazhData.SlowRange = template.slowRange;
                    flazhData.FilterMultiplier = template.filterMultiplier;

                    if (template.searchLimit) flazhData.SearchLimit = template.searchLimit;
                    if (template.minOffset) flazhData.MinOffset = template.minOffset;
                    if (template.minRetracementPercent) flazhData.MinRetracementPercent = template.minRetracementPercent;

                    // Convert back to XML
                    const updatedXml = this.builder.buildObject(result);

                    // Write to file
                    await fs.promises.writeFile(filePath, updatedXml);
                    console.log(`Successfully wrote updated Flazh template: ${fileName}`);
                    return true;
                }
            }

            // If we don't have raw XML, need to create from a template (not implemented now)
            console.error(`Raw XML not available for template: ${template.name}`);
            return false;

        } catch (error) {
            console.error(`Error writing Flazh template: ${error.message}`);
            return false;
        }
    }

    /**
     * Write an ATM template to file
     * @param {Object} template - The template object
     * @returns {Promise<boolean>} - Success status
     */
    async writeAtmTemplate(template) {
        try {
            if (!template || !template.name) {
                throw new Error('Invalid template data');
            }

            // Determine filename
            const fileName = template.name.endsWith('.xml') ? template.name : `${template.name}.xml`;
            const filePath = path.join(this.atmTemplatesPath, fileName);

            console.log(`Writing ATM template to: ${filePath}`);

            // If we have the original XML, update the relevant parameters and save
            if (template.rawXml) {
                const result = await this.parseXml(template.rawXml);

                if (result && result.NinjaTrader && result.NinjaTrader.AtmStrategy) {
                    const atmData = result.NinjaTrader.AtmStrategy;

                    // Update with new values
                    atmData.CalculationMode = template.calculationMode;

                    // Update brackets
                    if (template.brackets && template.brackets.length > 0 && atmData.Brackets) {
                        if (!Array.isArray(atmData.Brackets.Bracket)) {
                            // Single bracket case
                            const bracket = template.brackets[0];
                            atmData.Brackets.Bracket.StopLoss = bracket.stopLoss;
                            atmData.Brackets.Bracket.Target = bracket.target;

                            if (bracket.stopStrategy && atmData.Brackets.Bracket.StopStrategy) {
                                atmData.Brackets.Bracket.StopStrategy.AutoBreakEvenPlus = bracket.stopStrategy.autoBreakEvenPlus;
                                atmData.Brackets.Bracket.StopStrategy.AutoBreakEvenProfitTrigger = bracket.stopStrategy.autoBreakEvenProfitTrigger;
                            }
                        } else {
                            // Multiple brackets case
                            for (let i = 0; i < atmData.Brackets.Bracket.length && i < template.brackets.length; i++) {
                                const bracket = template.brackets[i];
                                atmData.Brackets.Bracket[i].StopLoss = bracket.stopLoss;
                                atmData.Brackets.Bracket[i].Target = bracket.target;

                                if (bracket.stopStrategy && atmData.Brackets.Bracket[i].StopStrategy) {
                                    atmData.Brackets.Bracket[i].StopStrategy.AutoBreakEvenPlus = bracket.stopStrategy.autoBreakEvenPlus;
                                    atmData.Brackets.Bracket[i].StopStrategy.AutoBreakEvenProfitTrigger = bracket.stopStrategy.autoBreakEvenProfitTrigger;
                                }
                            }
                        }
                    }

                    // Convert back to XML
                    const updatedXml = this.builder.buildObject(result);

                    // Write to file
                    await fs.promises.writeFile(filePath, updatedXml);
                    console.log(`Successfully wrote updated ATM template: ${fileName}`);
                    return true;
                }
            }

            // If we don't have raw XML, need to create from a template (not implemented now)
            console.error(`Raw XML not available for template: ${template.name}`);
            return false;

        } catch (error) {
            console.error(`Error writing ATM template: ${error.message}`);
            return false;
        }
    }

    /**
     * Helper method to parse XML safely
     * @param {string} xml - XML string to parse
     * @returns {Promise<Object>} - Parsed object
     */
    parseXml(xml) {
        return new Promise((resolve, reject) => {
            this.parser.parseString(xml, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Sync templates between file system and MongoDB
     * @returns {Promise<boolean>} - Success status
     */
    async syncTemplatesWithDatabase() {
        try {
            console.log('Syncing templates between file system and MongoDB...');

            // Read templates from file system
            const flazhTemplates = await this.readFlazhTemplates();
            const atmTemplates = await this.readAtmTemplates();

            // Update database with file system templates
            for (const template of flazhTemplates) {
                await this.updateFlazhTemplateInDb(template);
            }

            for (const template of atmTemplates) {
                await this.updateAtmTemplateInDb(template);
            }

            console.log('Template synchronization completed successfully');
            return true;
        } catch (error) {
            console.error(`Error syncing templates: ${error.message}`);
            return false;
        }
    }

    /**
     * Update Flazh template in MongoDB
     * @param {Object} template - Template to update
     * @returns {Promise<boolean>} - Success status
     */
    async updateFlazhTemplateInDb(template) {
        try {
            const collection = mongoose.connection.db.collection('flazhtemplates');

            // Check if template already exists
            const existingTemplate = await collection.findOne({ name: template.name });

            if (existingTemplate) {
                // Update existing template
                await collection.updateOne(
                    { name: template.name },
                    { $set: template }
                );
                console.log(`Updated Flazh template in DB: ${template.name}`);
            } else {
                // Insert new template
                await collection.insertOne(template);
                console.log(`Inserted new Flazh template in DB: ${template.name}`);
            }

            return true;
        } catch (error) {
            console.error(`Error updating Flazh template in DB: ${error.message}`);
            return false;
        }
    }

    /**
     * Update ATM template in MongoDB
     * @param {Object} template - Template to update
     * @returns {Promise<boolean>} - Success status
     */
    async updateAtmTemplateInDb(template) {
        try {
            const collection = mongoose.connection.db.collection('atmtemplates');

            // Check if template already exists
            const existingTemplate = await collection.findOne({ name: template.name });

            if (existingTemplate) {
                // Update existing template
                await collection.updateOne(
                    { name: template.name },
                    { $set: template }
                );
                console.log(`Updated ATM template in DB: ${template.name}`);
            } else {
                // Insert new template
                await collection.insertOne(template);
                console.log(`Inserted new ATM template in DB: ${template.name}`);
            }

            return true;
        } catch (error) {
            console.error(`Error updating ATM template in DB: ${error.message}`);
            return false;
        }
    }
}

module.exports = new FileSystemService();
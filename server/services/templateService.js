const fs = require('fs').promises;
const path = require('path');
const xmlParser = require('../utils/xmlParser');
const AtmTemplate = require('../models/atmTemplate');
const FlazhTemplate = require('../models/flazhTemplate');

// Function to import templates from a directory
async function importTemplatesFromDirectory(directory) {
    try {
        const files = await fs.readdir(directory);
        const xmlFiles = files.filter(file => file.endsWith('.xml'));

        console.log(`Found ${xmlFiles.length} XML files in ${directory}`);

        for (const file of xmlFiles) {
            const filePath = path.join(directory, file);
            await importTemplate(filePath);
        }

        return { success: true, count: xmlFiles.length };
    } catch (error) {
        console.error('Error importing templates:', error);
        return { success: false, error: error.message };
    }
}

// Function to import a single template file
async function importTemplate(filePath) {
    try {
        // Determine template type based on filename
        const fileName = path.basename(filePath);

        if (fileName.includes('ATM')) {
            const atmParams = await xmlParser.extractAtmParameters(filePath);
            const rawXml = await fs.readFile(filePath, 'utf-8');

            // Check if template already exists
            let template = await AtmTemplate.findOne({ name: atmParams.template });

            if (template) {
                // Update existing template
                template.calculationMode = atmParams.calculationMode;
                template.brackets = atmParams.brackets;
                template.rawXml = rawXml;
                template.updatedAt = new Date();
            } else {
                // Create new template
                template = new AtmTemplate({
                    name: atmParams.template,
                    calculationMode: atmParams.calculationMode,
                    brackets: atmParams.brackets,
                    rawXml: rawXml
                });
            }

            await template.save();
            console.log(`Imported ATM template: ${atmParams.template}`);
            return { success: true, type: 'ATM', name: atmParams.template };
        } else if (fileName.includes('FLAZH')) {
            const flazhParams = await xmlParser.extractFlazhParameters(filePath);
            const rawXml = await fs.readFile(filePath, 'utf-8');

            // Check if template already exists
            let template = await FlazhTemplate.findOne({ name: flazhParams.name || path.parse(fileName).name });

            if (template) {
                // Update existing template
                template = Object.assign(template, flazhParams);
                template.rawXml = rawXml;
                template.updatedAt = new Date();
            } else {
                // Create new template
                template = new FlazhTemplate({
                    name: flazhParams.name || path.parse(fileName).name,
                    ...flazhParams,
                    rawXml: rawXml
                });
            }

            await template.save();
            console.log(`Imported Flazh template: ${template.name}`);
            return { success: true, type: 'Flazh', name: template.name };
        } else {
            console.warn(`Unknown template type: ${fileName}`);
            return { success: false, error: 'Unknown template type' };
        }
    } catch (error) {
        console.error(`Error importing template ${filePath}:`, error);
        return { success: false, error: error.message };
    }
}

// Function to get all templates
async function getAllTemplates() {
    try {
        const atmTemplates = await AtmTemplate.find().lean();
        const flazhTemplates = await FlazhTemplate.find().lean();

        return {
            success: true,
            data: {
                atm: atmTemplates,
                flazh: flazhTemplates
            }
        };
    } catch (error) {
        console.error('Error fetching templates:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    importTemplatesFromDirectory,
    importTemplate,
    getAllTemplates
};
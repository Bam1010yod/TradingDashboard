const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const templateImport = require('../services/templateImport');
const FlazhInfinity = require('../models/flazhInfinity');
const AtmStrategy = require('../models/atmStrategy');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        // Allow only XML files
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.xml') {
            return cb(new Error('Only XML files are allowed'), false);
        }
        cb(null, true);
    }
});

// Get all templates
router.get('/', async (req, res) => {
    try {
        const atmTemplates = await AtmStrategy.find().lean();
        const flazhTemplates = await FlazhInfinity.find().lean();

        res.json({
            success: true,
            count: {
                atm: atmTemplates.length,
                flazh: flazhTemplates.length,
                total: atmTemplates.length + flazhTemplates.length
            },
            templates: {
                atm: atmTemplates,
                flazh: flazhTemplates
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving templates',
            error: error.message
        });
    }
});

// Get templates by type
router.get('/:type', async (req, res) => {
    try {
        const type = req.params.type.toLowerCase();
        let templates = [];

        if (type === 'atm') {
            templates = await AtmStrategy.find().lean();
        } else if (type === 'flazh') {
            templates = await FlazhInfinity.find().lean();
        } else {
            return res.status(400).json({
                success: false,
                message: `Invalid template type: ${type}`,
                error: 'Invalid template type'
            });
        }

        res.json({
            success: true,
            count: templates.length,
            templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving templates',
            error: error.message
        });
    }
});

// Validate a template without importing
router.post('/validate', upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
                error: 'No file uploaded'
            });
        }

        const result = await templateImport.validateTemplate(req.file.path);

        // Delete the uploaded file after validation
        const fs = require('fs');
        fs.unlinkSync(req.file.path);

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error validating template',
            error: error.message
        });
    }
});

// Upload and import a template
router.post('/upload', upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
                error: 'No file uploaded'
            });
        }

        const result = await templateImport.importTemplate(req.file.path);

        // Delete the uploaded file after importing
        const fs = require('fs');
        fs.unlinkSync(req.file.path);

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error importing template',
            error: error.message
        });
    }
});

// Import templates from directory
router.post('/import-directory', async (req, res) => {
    try {
        const { directory } = req.body;
        if (!directory) {
            return res.status(400).json({
                success: false,
                message: 'Directory path is required',
                error: 'Directory path is required'
            });
        }

        const result = await templateImport.importTemplatesFromDirectory(directory);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error importing templates from directory',
            error: error.message
        });
    }
});

// Get template by ID
router.get('/:type/:id', async (req, res) => {
    try {
        const type = req.params.type.toLowerCase();
        const id = req.params.id;

        let template;

        if (type === 'atm') {
            template = await AtmStrategy.findById(id).lean();
        } else if (type === 'flazh') {
            template = await FlazhInfinity.findById(id).lean();
        } else {
            return res.status(400).json({
                success: false,
                message: `Invalid template type: ${type}`,
                error: 'Invalid template type'
            });
        }

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found',
                error: 'Template not found'
            });
        }

        res.json({
            success: true,
            template
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving template',
            error: error.message
        });
    }
});

// Delete template by ID
router.delete('/:type/:id', async (req, res) => {
    try {
        const type = req.params.type.toLowerCase();
        const id = req.params.id;

        let result;

        if (type === 'atm') {
            result = await AtmStrategy.findByIdAndDelete(id);
        } else if (type === 'flazh') {
            result = await FlazhInfinity.findByIdAndDelete(id);
        } else {
            return res.status(400).json({
                success: false,
                message: `Invalid template type: ${type}`,
                error: 'Invalid template type'
            });
        }

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Template not found',
                error: 'Template not found'
            });
        }

        res.json({
            success: true,
            message: 'Template deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting template',
            error: error.message
        });
    }
});

module.exports = router;
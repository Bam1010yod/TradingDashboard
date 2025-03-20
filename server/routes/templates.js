const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const templateService = require('../services/templateService');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Get all templates
router.get('/', async (req, res) => {
    try {
        const result = await templateService.getAllTemplates();
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload a template
router.post('/upload', upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const result = await templateService.importTemplate(req.file.path);
        if (result.success) {
            res.json({ message: `Template ${result.name} imported successfully`, ...result });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Import templates from directory
router.post('/import-directory', async (req, res) => {
    try {
        const { directory } = req.body;
        if (!directory) {
            return res.status(400).json({ error: 'Directory path is required' });
        }

        const result = await templateService.importTemplatesFromDirectory(directory);
        if (result.success) {
            res.json({ message: `Imported ${result.count} templates` });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
/**
 * Backtest API Routes
 */

const express = require('express');
const router = express.Router();
const backtestService = require('../services/backtestService');

/**
 * @route   POST /api/backtest
 * @desc    Run a new backtest
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const result = await backtestService.runBacktest(req.body);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in backtest route:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/backtest
 * @desc    Get all backtests
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const backtests = await backtestService.getAllBacktests();
    res.json({
      success: true,
      count: backtests.length,
      data: backtests
    });
  } catch (error) {
    console.error('Error in get all backtests route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/backtest/:id
 * @desc    Get a single backtest by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const backtest = await backtestService.getBacktest(req.params.id);
    res.json({
      success: true,
      data: backtest
    });
  } catch (error) {
    console.error('Error in get backtest route:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/backtest/compare
 * @desc    Compare multiple backtests
 * @access  Public
 */
router.post('/compare', async (req, res) => {
  try {
    const { backtestIds } = req.body;
    
    if (!backtestIds || !Array.isArray(backtestIds) || backtestIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least two backtest IDs to compare'
      });
    }
    
    const comparison = await backtestService.compareBacktests(backtestIds);
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error in compare backtests route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/backtest/:id
 * @desc    Delete a backtest
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const success = await backtestService.deleteBacktest(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Backtest not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Backtest deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete backtest route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
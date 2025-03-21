/**
 * Backtesting Service
 * Simulates trading strategies against historical market data
 */

const Backtest = require('../models/backtest');
const mongoose = require('mongoose');

class BacktestService {
    /**
     * Initialize the backtesting service
     * @returns {Promise<boolean>} - Initialization success
     */
    async initialize() {
        console.log('Backtest Service initialized');
        return true;
    }

    /**
     * Run a backtest with the given parameters
     * @param {Object} params - Backtest parameters
     * @returns {Promise<Object>} - The backtest results
     */
    async runBacktest(params) {
        try {
            // 1. Validate parameters
            this._validateParams(params);

            // 2. Load historical data
            const historicalData = await this._loadHistoricalData(
                params.instrument,
                params.timeframe,
                params.startDate,
                params.endDate
            );

            if (!historicalData || historicalData.length === 0) {
                throw new Error('No historical data found for the specified criteria');
            }

            // 3. Run the strategy simulation
            const trades = await this._simulateStrategy(historicalData, params.strategyParams);

            // 4. Calculate performance metrics
            const performanceMetrics = this._calculatePerformanceMetrics(trades);

            // 5. Save the backtest results
            const backtest = new Backtest({
                name: params.name,
                description: params.description,
                strategyParams: params.strategyParams,
                instrument: params.instrument,
                timeframe: params.timeframe,
                startDate: params.startDate,
                endDate: params.endDate,
                trades: trades,
                performanceMetrics: performanceMetrics
            });

            const savedBacktest = await backtest.save();
            return savedBacktest;
        } catch (error) {
            console.error('Error running backtest:', error);
            throw error;
        }
    }

    /**
     * Get a backtest by ID
     * @param {string} id - Backtest ID
     * @returns {Promise<Object>} - The backtest data
     */
    async getBacktest(id) {
        try {
            const backtest = await Backtest.findById(id);
            if (!backtest) {
                throw new Error('Backtest not found');
            }
            return backtest;
        } catch (error) {
            console.error('Error getting backtest:', error);
            throw error;
        }
    }

    /**
     * Get all backtests
     * @returns {Promise<Array>} - Array of backtest data
     */
    async getAllBacktests() {
        try {
            const backtests = await Backtest.find({})
                .select('-trades') // Exclude trades array to reduce payload size
                .sort({ createdAt: -1 });
            return backtests;
        } catch (error) {
            console.error('Error getting all backtests:', error);
            throw error;
        }
    }

    /**
     * Compare multiple backtests
     * @param {Array<string>} backtestIds - Array of backtest IDs to compare
     * @returns {Promise<Object>} - Comparison results
     */
    async compareBacktests(backtestIds) {
        try {
            const backtests = await Backtest.find({
                _id: { $in: backtestIds }
            }).select('name performanceMetrics strategyParams');

            return {
                comparisonDate: new Date(),
                backtests: backtests
            };
        } catch (error) {
            console.error('Error comparing backtests:', error);
            throw error;
        }
    }

    /**
     * Delete a backtest
     * @param {string} id - Backtest ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteBacktest(id) {
        try {
            const result = await Backtest.findByIdAndDelete(id);
            return !!result;
        } catch (error) {
            console.error('Error deleting backtest:', error);
            throw error;
        }
    }

    // Private helper methods

    /**
     * Validate backtest parameters
     * @param {Object} params - Parameters to validate
     * @private
     */
    _validateParams(params) {
        const requiredFields = ['name', 'instrument', 'timeframe', 'startDate', 'endDate', 'strategyParams'];

        for (const field of requiredFields) {
            if (!params[field]) {
                throw new Error(`Missing required parameter: ${field}`);
            }
        }

        // Validate dates
        const startDate = new Date(params.startDate);
        const endDate = new Date(params.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date format');
        }

        if (startDate >= endDate) {
            throw new Error('Start date must be before end date');
        }
    }

    /**
     * Load historical market data
     * @param {string} instrument - Trading instrument
     * @param {string} timeframe - Data timeframe
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>} - Historical data
     * @private
     */
    async _loadHistoricalData(instrument, timeframe, startDate, endDate) {
        try {
            // Generate sample data for testing
            // In a real implementation, you would connect to your actual market data collection
            console.log(`Loading historical data for ${instrument} (${timeframe}) from ${startDate} to ${endDate}`);

            const sampleData = [];
            const startTime = new Date(startDate);
            const endTime = new Date(endDate);

            // Create one data point per hour for the test period
            const currentTime = new Date(startTime);
            let basePrice = 4000; // Sample starting price

            while (currentTime <= endTime) {
                // Generate a slightly random price
                const randomChange = (Math.random() - 0.5) * 10;
                basePrice += randomChange;

                sampleData.push({
                    timestamp: new Date(currentTime),
                    instrument: instrument,
                    timeframe: timeframe,
                    open: basePrice - 2,
                    high: basePrice + 5,
                    low: basePrice - 5,
                    close: basePrice,
                    volume: Math.floor(Math.random() * 1000) + 500
                });

                // Move to next hour
                currentTime.setHours(currentTime.getHours() + 1);
            }

            console.log(`Generated ${sampleData.length} sample data points`);
            return sampleData;

            /* 
            When connecting to your actual database, you'd do something like:
            
            const MarketData = mongoose.model('MarketData'); // Use your actual model name
            
            const data = await MarketData.find({
              instrument: instrument,
              timeframe: timeframe,
              timestamp: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            }).sort({ timestamp: 1 });
            
            return data;
            */
        } catch (error) {
            console.error('Error loading historical data:', error);
            throw error;
        }
    }

    /**
     * Simulate a trading strategy on historical data
     * @param {Array} historicalData - Historical market data
     * @param {Object} strategyParams - Strategy parameters
     * @returns {Promise<Array>} - Generated trades
     * @private
     */
    async _simulateStrategy(historicalData, strategyParams) {
        console.log('Simulating strategy with parameters:', strategyParams);

        const trades = [];
        let position = null;

        for (let i = 30; i < historicalData.length; i++) {  // Start after we have enough data for moving averages
            const currentBar = historicalData[i];
            const previousBar = historicalData[i - 1];

            // Example simple strategy: Moving average crossover
            const shortPeriod = strategyParams.shortPeriod || 10;
            const longPeriod = strategyParams.longPeriod || 30;

            // Calculate simple moving averages
            const shortMA = this._calculateMA(historicalData, i, shortPeriod);
            const longMA = this._calculateMA(historicalData, i, longPeriod);

            // Previous moving averages
            const prevShortMA = this._calculateMA(historicalData, i - 1, shortPeriod);
            const prevLongMA = this._calculateMA(historicalData, i - 1, longPeriod);

            // Entry signals
            const bullishCrossover = prevShortMA <= prevLongMA && shortMA > longMA;
            const bearishCrossover = prevShortMA >= prevLongMA && shortMA < longMA;

            // Trading logic
            if (!position && bullishCrossover) {
                // Enter long position
                position = {
                    entryTime: currentBar.timestamp,
                    entryPrice: currentBar.close,
                    quantity: 1,
                    direction: 'LONG',
                    marketConditions: {
                        volatility: this._calculateVolatility(historicalData, i, 14),
                        trend: this._calculateTrend(historicalData, i, 14)
                    }
                };
            }
            else if (!position && bearishCrossover) {
                // Enter short position
                position = {
                    entryTime: currentBar.timestamp,
                    entryPrice: currentBar.close,
                    quantity: 1,
                    direction: 'SHORT',
                    marketConditions: {
                        volatility: this._calculateVolatility(historicalData, i, 14),
                        trend: this._calculateTrend(historicalData, i, 14)
                    }
                };
            }
            else if (position) {
                // Exit logic (simplified)
                let exitSignal = false;

                if (position.direction === 'LONG' && bearishCrossover) {
                    exitSignal = true;
                }
                else if (position.direction === 'SHORT' && bullishCrossover) {
                    exitSignal = true;
                }

                if (exitSignal) {
                    // Close position
                    const profitLoss = position.direction === 'LONG'
                        ? (currentBar.close - position.entryPrice) * position.quantity
                        : (position.entryPrice - currentBar.close) * position.quantity;

                    trades.push({
                        ...position,
                        exitTime: currentBar.timestamp,
                        exitPrice: currentBar.close,
                        profitLoss: profitLoss
                    });

                    position = null;
                }
            }
        }

        // Close any open position at the end of the test
        if (position) {
            const lastBar = historicalData[historicalData.length - 1];
            const profitLoss = position.direction === 'LONG'
                ? (lastBar.close - position.entryPrice) * position.quantity
                : (position.entryPrice - lastBar.close) * position.quantity;

            trades.push({
                ...position,
                exitTime: lastBar.timestamp,
                exitPrice: lastBar.close,
                profitLoss: profitLoss
            });
        }

        console.log(`Strategy simulation completed with ${trades.length} trades`);
        return trades;
    }

    /**
     * Calculate simple moving average
     * @param {Array} data - Historical data
     * @param {number} currentIndex - Current index
     * @param {number} period - MA period
     * @returns {number} - Moving average value
     * @private
     */
    _calculateMA(data, currentIndex, period) {
        const startIndex = Math.max(0, currentIndex - period + 1);
        let sum = 0;

        for (let i = startIndex; i <= currentIndex; i++) {
            sum += data[i].close;
        }

        return sum / Math.min(period, currentIndex + 1);
    }

    /**
     * Calculate volatility (simplified)
     * @param {Array} data - Historical data
     * @param {number} currentIndex - Current index
     * @param {number} period - Period for calculation
     * @returns {number} - Volatility value
     * @private
     */
    _calculateVolatility(data, currentIndex, period) {
        const startIndex = Math.max(0, currentIndex - period + 1);
        const prices = [];

        for (let i = startIndex; i <= currentIndex; i++) {
            prices.push(data[i].close);
        }

        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }

        // Calculate standard deviation
        const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
        const variance = returns.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / returns.length;

        return Math.sqrt(variance);
    }

    /**
     * Calculate trend (simplified)
     * @param {Array} data - Historical data
     * @param {number} currentIndex - Current index
     * @param {number} period - Period for calculation
     * @returns {string} - Trend direction ('UP', 'DOWN', or 'SIDEWAYS')
     * @private
     */
    _calculateTrend(data, currentIndex, period) {
        const startIndex = Math.max(0, currentIndex - period + 1);
        const startPrice = data[startIndex].close;
        const endPrice = data[currentIndex].close;
        const priceChange = endPrice - startPrice;

        // Simple trend determination based on price change
        if (priceChange > startPrice * 0.03) return 'UP';
        if (priceChange < -startPrice * 0.03) return 'DOWN';
        return 'SIDEWAYS';
    }

    /**
     * Calculate performance metrics from trades
     * @param {Array} trades - Array of trades
     * @returns {Object} - Performance metrics
     * @private
     */
    _calculatePerformanceMetrics(trades) {
        if (!trades || trades.length === 0) {
            return {
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                winRate: 0,
                averageWin: 0,
                averageLoss: 0,
                netProfit: 0,
                maxDrawdown: 0,
                profitFactor: 0
            };
        }

        // Basic metrics
        const winningTrades = trades.filter(trade => trade.profitLoss > 0);
        const losingTrades = trades.filter(trade => trade.profitLoss <= 0);

        const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
        const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0));

        // Calculate drawdown
        let maxDrawdown = 0;
        let peak = 0;
        let equity = 0;

        for (const trade of trades) {
            equity += trade.profitLoss;
            if (equity > peak) {
                peak = equity;
            }

            const drawdown = peak - equity;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        // Compile metrics
        return {
            totalTrades: trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: (winningTrades.length / trades.length) * 100,
            averageWin: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
            averageLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
            netProfit: totalProfit - totalLoss,
            maxDrawdown: maxDrawdown,
            profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0
        };
    }
}

module.exports = new BacktestService();
/**
 * Analytics Service
 * Provides detailed performance metrics and analysis
 */

const TradeJournal = require('../models/tradeJournal');
const mongoose = require('mongoose');

class AnalyticsService {
    /**
     * Initialize the analytics service
     * @returns {Promise<boolean>} - Initialization success
     */
    async initialize() {
        console.log('Analytics Service initialized');
        return true;
    }

    /**
     * Calculate advanced performance metrics
     * @param {Object} filters - Filters to apply (dates, instruments, etc.)
     * @returns {Promise<Object>} - Performance metrics
     */
    async calculatePerformanceMetrics(filters = {}) {
        try {
            // Build query from filters
            const query = this._buildQuery(filters);

            // Only include closed trades
            query.status = 'CLOSED';

            // Get all matching trades
            const trades = await TradeJournal.find(query);

            if (trades.length === 0) {
                return {
                    message: 'No trades found matching the criteria',
                    metrics: {
                        basicMetrics: this._getEmptyBasicMetrics(),
                        ratios: this._getEmptyRatios(),
                        streaks: this._getEmptyStreaks()
                    }
                };
            }

            // Calculate basic metrics
            const basicMetrics = this._calculateBasicMetrics(trades);

            // Calculate advanced ratios
            const ratios = this._calculateAdvancedRatios(trades, basicMetrics);

            // Calculate streaks
            const streaks = this._calculateStreaks(trades);

            return {
                totalTrades: trades.length,
                dateRange: {
                    start: new Date(Math.min(...trades.map(t => t.entryTime.getTime()))),
                    end: new Date(Math.max(...trades.map(t => t.exitTime ? t.exitTime.getTime() : Date.now())))
                },
                metrics: {
                    basicMetrics,
                    ratios,
                    streaks
                }
            };
        } catch (error) {
            console.error('Error calculating performance metrics:', error);
            throw error;
        }
    }

    /**
     * Get performance breakdown by time period
     * @param {string} periodType - Time period type (day, week, month)
     * @param {Object} filters - Filters to apply
     * @returns {Promise<Object>} - Performance by time period
     */
    async getPerformanceByTimePeriod(periodType = 'day', filters = {}) {
        try {
            // Build query from filters
            const query = this._buildQuery(filters);

            // Only include closed trades
            query.status = 'CLOSED';

            // Validate period type
            const validPeriods = ['day', 'dayOfWeek', 'week', 'month', 'year', 'session'];
            if (!validPeriods.includes(periodType)) {
                throw new Error('Invalid period type. Valid options: day, dayOfWeek, week, month, year, session');
            }

            // Define group ID based on period type
            let groupId = {};
            if (periodType === 'day') {
                groupId = {
                    year: { $year: '$entryTime' },
                    month: { $month: '$entryTime' },
                    day: { $dayOfMonth: '$entryTime' }
                };
            } else if (periodType === 'dayOfWeek') {
                groupId = { dayOfWeek: '$dayOfWeek' };
            } else if (periodType === 'week') {
                groupId = {
                    year: { $year: '$entryTime' },
                    week: { $week: '$entryTime' }
                };
            } else if (periodType === 'month') {
                groupId = {
                    year: { $year: '$entryTime' },
                    month: { $month: '$entryTime' }
                };
            } else if (periodType === 'year') {
                groupId = { year: { $year: '$entryTime' } };
            } else if (periodType === 'session') {
                groupId = { session: '$session' };
            }

            // Perform aggregation
            const results = await TradeJournal.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: groupId,
                        count: { $sum: 1 },
                        totalPnL: { $sum: '$profitLoss' },
                        avgPnL: { $avg: '$profitLoss' },
                        wins: {
                            $sum: {
                                $cond: [{ $gt: ['$profitLoss', 0] }, 1, 0]
                            }
                        },
                        losses: {
                            $sum: {
                                $cond: [{ $lte: ['$profitLoss', 0] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        winRate: {
                            $multiply: [
                                {
                                    $cond: [
                                        { $eq: ['$count', 0] },
                                        0,
                                        { $divide: ['$wins', '$count'] }
                                    ]
                                },
                                100
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        '_id.year': 1,
                        '_id.month': 1,
                        '_id.day': 1,
                        '_id.week': 1,
                        '_id.dayOfWeek': 1,
                        '_id.session': 1
                    }
                }
            ]);

            // Format results for easier consumption
            const formattedResults = results.map(r => {
                let period = '';

                if (periodType === 'day') {
                    const date = new Date(r._id.year, r._id.month - 1, r._id.day);
                    period = date.toISOString().split('T')[0];
                } else if (periodType === 'dayOfWeek') {
                    period = r._id.dayOfWeek || 'Unknown';
                } else if (periodType === 'week') {
                    period = `${r._id.year}-W${r._id.week}`;
                } else if (periodType === 'month') {
                    period = `${r._id.year}-${r._id.month.toString().padStart(2, '0')}`;
                } else if (periodType === 'year') {
                    period = r._id.year.toString();
                } else if (periodType === 'session') {
                    period = r._id.session || 'Unknown';
                }

                return {
                    period,
                    count: r.count,
                    totalPnL: r.totalPnL,
                    avgPnL: r.avgPnL,
                    wins: r.wins,
                    losses: r.losses,
                    winRate: r.winRate
                };
            });

            return {
                periodType,
                data: formattedResults
            };
        } catch (error) {
            console.error('Error getting performance by time period:', error);
            throw error;
        }
    }
    /**
   * Calculate drawdown metrics
   * @param {Object} filters - Filters to apply
   * @returns {Promise<Object>} - Drawdown metrics
   */
    async calculateDrawdownMetrics(filters = {}) {
        try {
            // Build query from filters
            const query = this._buildQuery(filters);

            // Only include closed trades
            query.status = 'CLOSED';

            // Get all matching trades in chronological order
            const trades = await TradeJournal.find(query).sort({ exitTime: 1 });

            if (trades.length === 0) {
                return {
                    message: 'No trades found matching the criteria',
                    drawdown: {
                        maxDrawdown: 0,
                        maxDrawdownPercent: 0,
                        avgDrawdown: 0,
                        currentDrawdown: 0,
                        recoveryFactor: 0
                    }
                };
            }

            // Calculate drawdown metrics
            let equity = 0;
            let peak = 0;
            let maxDrawdown = 0;
            let maxDrawdownPercent = 0;
            let drawdownStart = null;
            let drawdownEnd = null;
            let drawdowns = [];
            let currentDrawdown = 0;

            for (const trade of trades) {
                // Update equity
                equity += trade.profitLoss;

                // Check for new peak
                if (equity > peak) {
                    peak = equity;
                    // If we were in a drawdown and now we've recovered, record it
                    if (currentDrawdown > 0) {
                        drawdowns.push({
                            startDate: drawdownStart,
                            endDate: trade.exitTime,
                            amount: currentDrawdown,
                            percent: (currentDrawdown / (peak - currentDrawdown)) * 100
                        });
                        currentDrawdown = 0;
                        drawdownStart = null;
                    }
                } else {
                    // Calculate drawdown
                    const drawdown = peak - equity;
                    if (drawdown > maxDrawdown) {
                        maxDrawdown = drawdown;
                        maxDrawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
                        drawdownEnd = trade.exitTime;
                    }

                    // Track current drawdown period
                    if (currentDrawdown === 0) {
                        drawdownStart = trade.exitTime;
                    }
                    currentDrawdown = drawdown;
                }
            }

            // Add current drawdown if we're still in one
            if (currentDrawdown > 0 && drawdownStart) {
                drawdowns.push({
                    startDate: drawdownStart,
                    endDate: trades[trades.length - 1].exitTime,
                    amount: currentDrawdown,
                    percent: (currentDrawdown / (peak - currentDrawdown)) * 100
                });
            }

            // Calculate average drawdown
            const avgDrawdown = drawdowns.length > 0
                ? drawdowns.reduce((sum, d) => sum + d.amount, 0) / drawdowns.length
                : 0;

            // Calculate recovery factor
            const netProfit = trades.reduce((sum, t) => sum + t.profitLoss, 0);
            const recoveryFactor = maxDrawdown > 0 ? Math.abs(netProfit / maxDrawdown) : 0;

            return {
                drawdown: {
                    maxDrawdown,
                    maxDrawdownPercent,
                    maxDrawdownPeriod: drawdownEnd ? {
                        start: drawdownStart,
                        end: drawdownEnd
                    } : null,
                    avgDrawdown,
                    currentDrawdown: peak - equity,
                    recoveryFactor,
                    drawdownEpisodes: drawdowns.length
                },
                equity: {
                    final: equity,
                    peak
                }
            };
        } catch (error) {
            console.error('Error calculating drawdown metrics:', error);
            throw error;
        }
    }

    /**
     * Analyze win rate by different factors
     * @param {string} factor - Factor to analyze (instrument, timeOfDay, etc.)
     * @param {Object} filters - Filters to apply
     * @returns {Promise<Object>} - Win rate analysis
     */
    async analyzeWinRateByFactor(factor = 'instrument', filters = {}) {
        try {
            // Build query from filters
            const query = this._buildQuery(filters);

            // Only include closed trades
            query.status = 'CLOSED';

            // Validate factor
            const validFactors = ['instrument', 'strategy', 'session', 'dayOfWeek', 'direction'];
            if (!validFactors.includes(factor)) {
                throw new Error('Invalid factor. Valid options: instrument, strategy, session, dayOfWeek, direction');
            }

            // Perform aggregation
            const results = await TradeJournal.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: `$${factor}`,
                        count: { $sum: 1 },
                        wins: {
                            $sum: {
                                $cond: [{ $gt: ['$profitLoss', 0] }, 1, 0]
                            }
                        },
                        totalPnL: { $sum: '$profitLoss' },
                        avgPnL: { $avg: '$profitLoss' }
                    }
                },
                {
                    $addFields: {
                        winRate: {
                            $multiply: [
                                {
                                    $cond: [
                                        { $eq: ['$count', 0] },
                                        0,
                                        { $divide: ['$wins', '$count'] }
                                    ]
                                },
                                100
                            ]
                        }
                    }
                },
                { $sort: { winRate: -1 } }
            ]);

            // Format results
            const formattedResults = results.map(r => ({
                [factor]: r._id || 'Unknown',
                count: r.count,
                wins: r.wins,
                losses: r.count - r.wins,
                winRate: r.winRate,
                totalPnL: r.totalPnL,
                avgPnL: r.avgPnL
            }));

            return {
                factor,
                data: formattedResults
            };
        } catch (error) {
            console.error('Error analyzing win rate by factor:', error);
            throw error;
        }
    }

    /**
     * Analyze consecutive wins and losses
     * @param {Object} filters - Filters to apply
     * @returns {Promise<Object>} - Streak analysis
     */
    async analyzeConsecutiveResults(filters = {}) {
        try {
            // Build query from filters
            const query = this._buildQuery(filters);

            // Only include closed trades
            query.status = 'CLOSED';

            // Get all matching trades in chronological order
            const trades = await TradeJournal.find(query).sort({ exitTime: 1 });

            if (trades.length === 0) {
                return {
                    message: 'No trades found matching the criteria',
                    streaks: this._getEmptyStreaks()
                };
            }

            // Calculate streaks
            const streaks = this._calculateStreaks(trades);

            // Get current streak
            let currentStreakType = null;
            let currentStreakCount = 0;

            if (trades.length > 0) {
                currentStreakType = trades[trades.length - 1].profitLoss > 0 ? 'win' : 'loss';
                let i = trades.length - 1;

                while (i >= 0 && (
                    (currentStreakType === 'win' && trades[i].profitLoss > 0) ||
                    (currentStreakType === 'loss' && trades[i].profitLoss <= 0)
                )) {
                    currentStreakCount++;
                    i--;
                }
            }

            return {
                streaks,
                currentStreak: {
                    type: currentStreakType,
                    count: currentStreakCount
                }
            };
        } catch (error) {
            console.error('Error analyzing consecutive results:', error);
            throw error;
        }
    }

    /**
     * Calculate Sharpe and Sortino ratios
     * @param {Object} filters - Filters to apply
     * @param {number} riskFreeRate - Annual risk-free rate (default: 0.02)
     * @returns {Promise<Object>} - Financial ratios
     */
    async calculateFinancialRatios(filters = {}, riskFreeRate = 0.02) {
        try {
            // Build query from filters
            const query = this._buildQuery(filters);

            // Only include closed trades
            query.status = 'CLOSED';

            // Get all matching trades
            const trades = await TradeJournal.find(query);

            if (trades.length === 0) {
                return {
                    message: 'No trades found matching the criteria',
                    ratios: {
                        sharpeRatio: 0,
                        sortinoRatio: 0,
                        calmarRatio: 0
                    }
                };
            }

            // Calculate returns for each trade
            const returns = trades.map(trade => {
                const entryValue = trade.entryPrice * trade.quantity;
                return trade.profitLoss / entryValue;
            });

            // Calculate average return
            const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;

            // Adjust for trading frequency (assuming 252 trading days per year)
            const tradingDaysPerYear = 252;
            const estimatedTradesPerYear = this._estimateTradesPerYear(trades);
            const annualizedReturn = avgReturn * estimatedTradesPerYear;

            // Calculate variance and standard deviation
            const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
            const stdDev = Math.sqrt(variance);
            const annualizedStdDev = stdDev * Math.sqrt(estimatedTradesPerYear);

            // Calculate negative returns for Sortino
            const negativeReturns = returns.filter(ret => ret < 0);
            const negativeVariance = negativeReturns.length > 0
                ? negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / negativeReturns.length
                : 0;
            const downstdDev = Math.sqrt(negativeVariance);
            const annualizedDownstdDev = downstdDev * Math.sqrt(estimatedTradesPerYear);

            // Calculate ratios
            const dailyRiskFreeRate = riskFreeRate / tradingDaysPerYear;
            const adjustedRiskFreeRate = dailyRiskFreeRate * estimatedTradesPerYear / tradingDaysPerYear;

            // Sharpe Ratio
            const sharpeRatio = annualizedStdDev > 0
                ? (annualizedReturn - adjustedRiskFreeRate) / annualizedStdDev
                : 0;

            // Sortino Ratio
            const sortinoRatio = annualizedDownstdDev > 0
                ? (annualizedReturn - adjustedRiskFreeRate) / annualizedDownstdDev
                : annualizedReturn > 0 ? Infinity : 0;

            // Calculate drawdown for Calmar ratio
            const drawdownResult = await this.calculateDrawdownMetrics(filters);
            const maxDrawdownPercent = drawdownResult.drawdown.maxDrawdownPercent;

            // Calmar Ratio
            const calmarRatio = maxDrawdownPercent > 0
                ? annualizedReturn / (maxDrawdownPercent / 100)
                : annualizedReturn > 0 ? Infinity : 0;

            return {
                ratios: {
                    sharpeRatio,
                    sortinoRatio,
                    calmarRatio
                },
                stats: {
                    averageReturn: avgReturn,
                    annualizedReturn,
                    standardDeviation: stdDev,
                    annualizedStandardDeviation: annualizedStdDev,
                    downstdDeviation: downstdDev,
                    estimatedTradesPerYear,
                    totalTrades: trades.length
                }
            };
        } catch (error) {
            console.error('Error calculating financial ratios:', error);
            throw error;
        }
    }

    /**
     * Check for correlation between market conditions and performance
     * @param {Object} filters - Filters to apply
     * @returns {Promise<Object>} - Correlation analysis
     */
    async analyzeMarketConditionCorrelation(filters = {}) {
        try {
            // Build query from filters
            const query = this._buildQuery(filters);

            // Only include closed trades with market conditions
            query.status = 'CLOSED';
            query['marketConditions.trend'] = { $exists: true };

            // Get all matching trades
            const trades = await TradeJournal.find(query);

            if (trades.length === 0) {
                return {
                    message: 'No trades found with market condition data',
                    correlations: {}
                };
            }

            // Analyze by trend
            const trendResults = await TradeJournal.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$marketConditions.trend',
                        count: { $sum: 1 },
                        wins: {
                            $sum: {
                                $cond: [{ $gt: ['$profitLoss', 0] }, 1, 0]
                            }
                        },
                        totalPnL: { $sum: '$profitLoss' },
                        avgPnL: { $avg: '$profitLoss' }
                    }
                },
                {
                    $addFields: {
                        winRate: {
                            $multiply: [
                                {
                                    $cond: [
                                        { $eq: ['$count', 0] },
                                        0,
                                        { $divide: ['$wins', '$count'] }
                                    ]
                                },
                                100
                            ]
                        }
                    }
                },
                { $sort: { avgPnL: -1 } }
            ]);

            // Analyze by volatility (bucketed)
            // Split volatility into buckets: low (0-0.33), medium (0.34-0.66), high (0.67+)
            const volatilityQuery = { ...query };

            const lowVolatilityResults = await this._getVolatilityMetrics(
                { ...volatilityQuery, 'marketConditions.volatility': { $lte: 0.33 } }
            );

            const mediumVolatilityResults = await this._getVolatilityMetrics(
                {
                    ...volatilityQuery,
                    'marketConditions.volatility': { $gt: 0.33, $lte: 0.66 }
                }
            );

            const highVolatilityResults = await this._getVolatilityMetrics(
                { ...volatilityQuery, 'marketConditions.volatility': { $gt: 0.66 } }
            );

            return {
                correlations: {
                    trend: trendResults.map(r => ({
                        trend: r._id || 'Unknown',
                        count: r.count,
                        winRate: r.winRate,
                        avgPnL: r.avgPnL,
                        totalPnL: r.totalPnL
                    })),
                    volatility: [
                        { level: 'Low (0-0.33)', ...lowVolatilityResults },
                        { level: 'Medium (0.34-0.66)', ...mediumVolatilityResults },
                        { level: 'High (0.67+)', ...highVolatilityResults }
                    ]
                },
                summary: this._generateCorrelationSummary(trendResults, lowVolatilityResults, mediumVolatilityResults, highVolatilityResults)
            };
        } catch (error) {
            console.error('Error analyzing market condition correlation:', error);
            throw error;
        }
    }

    // Private helper methods

    /**
     * Build query from filters
     * @param {Object} filters - Filters to apply
     * @returns {Object} - MongoDB query
     * @private
     */
    _buildQuery(filters = {}) {
        const query = {};

        if (filters.instrument) query.instrument = filters.instrument;
        if (filters.direction) query.direction = filters.direction;
        if (filters.strategy) query.strategy = filters.strategy;
        if (filters.session) query.session = filters.session;
        if (filters.dayOfWeek) query.dayOfWeek = filters.dayOfWeek;

        // Date range
        if (filters.startDate || filters.endDate) {
            query.timestamp = {};
            if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
        }

        // Tags (any match)
        if (filters.tags && filters.tags.length > 0) {
            query.tags = { $in: filters.tags };
        }

        return query;
    }

    /**
     * Calculate basic performance metrics
     * @param {Array} trades - Array of trade documents
     * @returns {Object} - Basic metrics
     * @private
     */
    _calculateBasicMetrics(trades) {
        const winningTrades = trades.filter(trade => trade.profitLoss > 0);
        const losingTrades = trades.filter(trade => trade.profitLoss <= 0);

        const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
        const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0));

        const avgWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

        return {
            totalTrades: trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: (winningTrades.length / trades.length) * 100,
            totalProfit,
            totalLoss,
            netProfit: totalProfit - totalLoss,
            averageWin: avgWin,
            averageLoss: avgLoss,
            largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profitLoss)) : 0,
            largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profitLoss)) : 0,
            averageTrade: (totalProfit - totalLoss) / trades.length,
            profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0
        };
    }

    /**
     * Calculate advanced financial ratios
     * @param {Array} trades - Array of trade documents
     * @param {Object} basicMetrics - Basic performance metrics
     * @returns {Object} - Advanced ratios
     * @private
     */
    _calculateAdvancedRatios(trades, basicMetrics) {
        // Calculate win/loss ratio
        const winLossRatio = basicMetrics.averageLoss > 0
            ? basicMetrics.averageWin / basicMetrics.averageLoss
            : basicMetrics.averageWin > 0 ? Infinity : 0;

        // Calculate expectancy
        const expectancy = (basicMetrics.winRate / 100 * basicMetrics.averageWin) -
            ((100 - basicMetrics.winRate) / 100 * basicMetrics.averageLoss);

        // R-multiples (if stop loss was used)
        let rMultiple = 0;
        let tradesWithStops = 0;

        for (const trade of trades) {
            if (trade.stopLoss && trade.entryPrice) {
                const riskPerUnit = Math.abs(trade.entryPrice - trade.stopLoss);
                if (riskPerUnit > 0) {
                    const r = trade.profitLoss / (riskPerUnit * trade.quantity);
                    rMultiple += r;
                    tradesWithStops++;
                }
            }
        }

        const avgRMultiple = tradesWithStops > 0 ? rMultiple / tradesWithStops : 0;

        return {
            winLossRatio,
            expectancy,
            avgRMultiple,
            tradesWithStops,
            payoffRatio: basicMetrics.averageLoss > 0 ? basicMetrics.averageWin / basicMetrics.averageLoss : 0,
            profitPerTrade: basicMetrics.totalTrades > 0 ? basicMetrics.netProfit / basicMetrics.totalTrades : 0
        };
    }

    /**
     * Calculate streak metrics
     * @param {Array} trades - Array of trade documents sorted by date
     * @returns {Object} - Streak metrics
     * @private
     */
    _calculateStreaks(trades) {
        if (!trades || trades.length === 0) {
            return this._getEmptyStreaks();
        }

        let currentStreakType = trades[0].profitLoss > 0 ? 'win' : 'loss';
        let currentStreakCount = 1;
        let maxWinStreak = currentStreakType === 'win' ? 1 : 0;
        let maxLossStreak = currentStreakType === 'loss' ? 1 : 0;

        const streaks = [];

        for (let i = 1; i < trades.length; i++) {
            const isWin = trades[i].profitLoss > 0;
            const newStreakType = isWin ? 'win' : 'loss';

            if (newStreakType === currentStreakType) {
                // Continue the streak
                currentStreakCount++;
            } else {
                // End current streak and record it
                streaks.push({
                    type: currentStreakType,
                    count: currentStreakCount,
                    startDate: trades[i - currentStreakCount].exitTime,
                    endDate: trades[i - 1].exitTime
                });

                // Start new streak
                currentStreakType = newStreakType;
                currentStreakCount = 1;
            }

            // Update max streaks
            if (currentStreakType === 'win' && currentStreakCount > maxWinStreak) {
                maxWinStreak = currentStreakCount;
            } else if (currentStreakType === 'loss' && currentStreakCount > maxLossStreak) {
                maxLossStreak = currentStreakCount;
            }
        }

        // Record the final streak
        streaks.push({
            type: currentStreakType,
            count: currentStreakCount,
            startDate: trades[trades.length - currentStreakCount].exitTime,
            endDate: trades[trades.length - 1].exitTime
        });

        // Count streaks
        const winStreaks = streaks.filter(s => s.type === 'win');
        const lossStreaks = streaks.filter(s => s.type === 'loss');

        // Calculate average streak lengths
        const avgWinStreak = winStreaks.length > 0
            ? winStreaks.reduce((sum, s) => sum + s.count, 0) / winStreaks.length
            : 0;

        const avgLossStreak = lossStreaks.length > 0
            ? lossStreaks.reduce((sum, s) => sum + s.count, 0) / lossStreaks.length
            : 0;

        return {
            maxWinningStreak: maxWinStreak,
            maxLosingStreak: maxLossStreak,
            avgWinningStreak: avgWinStreak,
            avgLosingStreak: avgLossStreak,
            totalStreaks: streaks.length,
            winStreaks: winStreaks.length,
            lossStreaks: lossStreaks.length
        };
    }

/**
 * Get metrics for a specific volatility range
 * @param {Object
 * /**
     * Get metrics for a specific volatility range
     * @param {Object} query - MongoDB query with volatility filter
     * @returns {Promise<Object>} - Volatility metrics
     * @private
     */
    async _getVolatilityMetrics(query) {
        const result = await TradeJournal.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    wins: { $sum: { $cond: [{ $gt: ['$profitLoss', 0] }, 1, 0] } },
                    totalPnL: { $sum: '$profitLoss' },
                    avgPnL: { $avg: '$profitLoss' }
                }
            }
        ]);

        if (result.length === 0) {
            return { count: 0, winRate: 0, avgPnL: 0, totalPnL: 0 };
        }

        const stats = result[0];
        return {
            count: stats.count,
            winRate: (stats.wins / stats.count) * 100,
            avgPnL: stats.avgPnL,
            totalPnL: stats.totalPnL
        };
    }

    /**
     * Generate summary of market condition correlations
     * @private
     */
    _generateCorrelationSummary(trendResults, lowVol, medVol, highVol) {
        // Find best performing trend
        let bestTrend = { avgPnL: -Infinity };
        for (const trend of trendResults) {
            if (trend.avgPnL > bestTrend.avgPnL && trend.count >= 5) {
                bestTrend = trend;
            }
        }

        // Compare volatility levels
        const volLevels = [
            { level: 'Low', ...lowVol },
            { level: 'Medium', ...medVol },
            { level: 'High', ...highVol }
        ].filter(v => v.count > 0);

        volLevels.sort((a, b) => b.avgPnL - a.avgPnL);

        const summary = [];

        if (bestTrend._id) {
            summary.push(`Performance is best in ${bestTrend._id} trend conditions with average P&L of $${bestTrend.avgPnL.toFixed(2)}.`);
        }

        if (volLevels.length > 0) {
            summary.push(`${volLevels[0].level} volatility shows the best results with average P&L of $${volLevels[0].avgPnL.toFixed(2)}.`);
        }

        return summary;
    }

    /**
     * Estimate number of trades per year based on historical data
     * @private
     */
    _estimateTradesPerYear(trades) {
        if (trades.length < 2) return 252; // Default to 252 trading days if not enough data

        const firstDate = new Date(Math.min(...trades.map(t => t.entryTime.getTime())));
        const lastDate = new Date(Math.max(...trades.map(t => t.exitTime ? t.exitTime.getTime() : Date.now())));

        const daysDifference = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
        if (daysDifference < 1) return 252; // Default if less than a day

        const tradesPerDay = trades.length / daysDifference;
        return tradesPerDay * 252; // 252 trading days in a year
    }

    /**
     * Return empty basic metrics object
     * @private
     */
    _getEmptyBasicMetrics() {
        return {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            totalProfit: 0,
            totalLoss: 0,
            netProfit: 0,
            averageWin: 0,
            averageLoss: 0,
            largestWin: 0,
            largestLoss: 0,
            averageTrade: 0,
            profitFactor: 0
        };
    }

    /**
     * Return empty ratios object
     * @private
     */
    _getEmptyRatios() {
        return {
            winLossRatio: 0,
            expectancy: 0,
            avgRMultiple: 0,
            tradesWithStops: 0,
            payoffRatio: 0,
            profitPerTrade: 0
        };
    }

    /**
     * Return empty streaks object
     * @private
     */
    _getEmptyStreaks() {
        return {
            maxWinningStreak: 0,
            maxLosingStreak: 0,
            avgWinningStreak: 0,
            avgLosingStreak: 0,
            totalStreaks: 0,
            winStreaks: 0,
            lossStreaks: 0
        };
    }
}

module.exports = new AnalyticsService();
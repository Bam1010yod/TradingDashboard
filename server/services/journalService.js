/**
 * Journal Service
 * Manages trade journal entries and analysis
 */

const TradeJournal = require('../models/tradeJournal');
const mongoose = require('mongoose');

class JournalService {
    /**
     * Initialize the journal service
     * @returns {Promise<boolean>} - Initialization success
     */
    async initialize() {
        console.log('Journal Service initialized');
        return true;
    }

    /**
     * Log a new trade
     * @param {Object} tradeData - Trade details
     * @returns {Promise<Object>} - Saved trade record
     */
    async logTrade(tradeData) {
        try {
            // Generate tradeId if not provided
            if (!tradeData.tradeId) {
                tradeData.tradeId = this._generateTradeId(tradeData.instrument);
            }

            // Add day of week
            const entryDate = new Date(tradeData.entryTime);
            tradeData.dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][entryDate.getDay()];

            // Create and save trade record
            const trade = new TradeJournal(tradeData);
            return await trade.save();
        } catch (error) {
            console.error('Error logging trade:', error);
            throw error;
        }
    }

    /**
     * Update an existing trade
     * @param {string} tradeId - Trade ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} - Updated trade
     */
    async updateTrade(tradeId, updateData) {
        try {
            // Calculate P&L if closing the trade
            if (updateData.status === 'CLOSED' && updateData.exitPrice) {
                const trade = await TradeJournal.findOne({ tradeId: tradeId });

                if (!trade) {
                    throw new Error('Trade not found');
                }

                // Calculate P&L
                updateData.profitLoss = this._calculateProfitLoss(
                    trade.direction,
                    trade.entryPrice,
                    updateData.exitPrice,
                    trade.quantity
                );

                // Calculate percentage gain/loss
                updateData.profitLossPercent = (Math.abs(updateData.profitLoss) /
                    (trade.entryPrice * trade.quantity)) * 100 *
                    (updateData.profitLoss >= 0 ? 1 : -1);

                // Calculate net P&L if fees are provided
                if (updateData.fees || trade.fees) {
                    const fees = updateData.fees || trade.fees || 0;
                    updateData.netProfitLoss = updateData.profitLoss - fees;
                } else {
                    updateData.netProfitLoss = updateData.profitLoss;
                }
            }

            // Update the trade
            const updatedTrade = await TradeJournal.findOneAndUpdate(
                { tradeId: tradeId },
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedTrade) {
                throw new Error('Trade not found');
            }

            return updatedTrade;
        } catch (error) {
            console.error('Error updating trade:', error);
            throw error;
        }
    }

    /**
     * Get a single trade
     * @param {string} tradeId - Trade ID
     * @returns {Promise<Object>} - Trade data
     */
    async getTrade(tradeId) {
        try {
            const trade = await TradeJournal.findOne({ tradeId: tradeId });

            if (!trade) {
                throw new Error('Trade not found');
            }

            return trade;
        } catch (error) {
            console.error('Error getting trade:', error);
            throw error;
        }
    }

    /**
     * Delete a trade
     * @param {string} tradeId - Trade ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteTrade(tradeId) {
        try {
            const result = await TradeJournal.findOneAndDelete({ tradeId: tradeId });
            return !!result;
        } catch (error) {
            console.error('Error deleting trade:', error);
            throw error;
        }
    }

    /**
     * Search for trades with filtering
     * @param {Object} filters - Search filters
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} - Search results
     */
    async searchTrades(filters = {}, pagination = { page: 1, limit: 20 }) {
        try {
            const query = {};

            // Apply filters
            if (filters.instrument) query.instrument = filters.instrument;
            if (filters.direction) query.direction = filters.direction;
            if (filters.status) query.status = filters.status;
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

            // P&L range
            if (filters.minPnL || filters.maxPnL) {
                query.profitLoss = {};
                if (filters.minPnL !== undefined) query.profitLoss.$gte = filters.minPnL;
                if (filters.maxPnL !== undefined) query.profitLoss.$lte = filters.maxPnL;
            }

            // Pagination
            const page = pagination.page || 1;
            const limit = pagination.limit || 20;
            const skip = (page - 1) * limit;

            // Execute query with pagination
            const trades = await TradeJournal.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit);

            // Get total count for pagination
            const total = await TradeJournal.countDocuments(query);

            return {
                trades,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error searching trades:', error);
            throw error;
        }
    }

    /**
     * Get trade statistics
     * @param {Object} filters - Filters to apply
     * @returns {Promise<Object>} - Statistics
     */
    async getTradeStatistics(filters = {}) {
        try {
            // Build query from filters
            const query = {};

            if (filters.instrument) query.instrument = filters.instrument;
            if (filters.direction) query.direction = filters.direction;
            if (filters.strategy) query.strategy = filters.strategy;
            if (filters.startDate || filters.endDate) {
                query.timestamp = {};
                if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
                if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
            }

            // Only include closed trades for P&L statistics
            query.status = 'CLOSED';

            const trades = await TradeJournal.find(query);

            if (trades.length === 0) {
                return {
                    totalTrades: 0,
                    winningTrades: 0,
                    losingTrades: 0,
                    winRate: 0,
                    averageWin: 0,
                    averageLoss: 0,
                    profitFactor: 0,
                    totalProfit: 0,
                    totalLoss: 0,
                    netProfit: 0
                };
            }

            // Calculate statistics
            const winningTrades = trades.filter(trade => trade.profitLoss > 0);
            const losingTrades = trades.filter(trade => trade.profitLoss <= 0);

            const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
            const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0));

            return {
                totalTrades: trades.length,
                winningTrades: winningTrades.length,
                losingTrades: losingTrades.length,
                winRate: (winningTrades.length / trades.length) * 100,
                averageWin: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
                averageLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
                profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
                totalProfit,
                totalLoss,
                netProfit: totalProfit - totalLoss
            };
        } catch (error) {
            console.error('Error getting trade statistics:', error);
            throw error;
        }
    }

    /**
     * Group trades by a specific field
     * @param {string} groupField - Field to group by
     * @param {Object} filters - Filters to apply
     * @returns {Promise<Object>} - Grouped results
     */
    async groupTradesByField(groupField, filters = {}) {
        try {
            // Validate groupField
            const validGroupFields = ['instrument', 'direction', 'strategy', 'session', 'dayOfWeek', 'tags'];
            if (!validGroupFields.includes(groupField)) {
                throw new Error(`Invalid group field: ${groupField}`);
            }

            // Build match stage from filters
            const matchStage = {};

            if (filters.instrument) matchStage.instrument = filters.instrument;
            if (filters.direction) matchStage.direction = filters.direction;
            if (filters.strategy) matchStage.strategy = filters.strategy;
            if (filters.startDate || filters.endDate) {
                matchStage.timestamp = {};
                if (filters.startDate) matchStage.timestamp.$gte = new Date(filters.startDate);
                if (filters.endDate) matchStage.timestamp.$lte = new Date(filters.endDate);
            }

            // Only include closed trades
            matchStage.status = 'CLOSED';

            // Special handling for tags
            const pipeline = [];

            // Add match stage
            pipeline.push({ $match: matchStage });

            // Special handling for tags field
            if (groupField === 'tags') {
                pipeline.push(
                    { $unwind: '$tags' },
                    {
                        $group: {
                            _id: '$tags',
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
                    }
                );
            } else {
                // Standard grouping for other fields
                pipeline.push(
                    {
                        $group: {
                            _id: `$${groupField}`,
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
                    }
                );
            }

            // Add calculated fields and sorting
            pipeline.push(
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
                { $sort: { totalPnL: -1 } }
            );

            const results = await TradeJournal.aggregate(pipeline);

            return {
                groupField,
                results
            };
        } catch (error) {
            console.error('Error grouping trades:', error);
            throw error;
        }
    }

    // Private helper methods

    /**
     * Generate a unique trade ID
     * @param {string} instrument - Trading instrument
     * @returns {string} - Generated ID
     * @private
     */
    _generateTradeId(instrument) {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 10000);
        return `${instrument}-${timestamp}-${random}`;
    }

    /**
     * Calculate profit/loss for a trade
     * @param {string} direction - Trade direction (LONG/SHORT)
     * @param {number} entryPrice - Entry price
     * @param {number} exitPrice - Exit price
     * @param {number} quantity - Trade quantity
     * @returns {number} - Calculated P&L
     * @private
     */
    _calculateProfitLoss(direction, entryPrice, exitPrice, quantity) {
        if (direction === 'LONG') {
            return (exitPrice - entryPrice) * quantity;
        } else {
            return (entryPrice - exitPrice) * quantity;
        }
    }
}

module.exports = new JournalService();
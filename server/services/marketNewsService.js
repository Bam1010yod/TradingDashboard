/**
 * Market News Service
 * Monitors market news relevant to NQ futures trading
 * Uses web search functionality to find recent news
 */

const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

// News source configurations
const NEWS_SOURCES = [
    {
        name: 'CNBC',
        url: 'https://www.cnbc.com/quotes/NQ=F',
        selector: '.LatestNews-list .LatestNews-item'
    },
    {
        name: 'Bloomberg',
        url: 'https://www.bloomberg.com/quote/NQ1:IND',
        selector: '.story-package-module__story'
    },
    {
        name: 'MarketWatch',
        url: 'https://www.marketwatch.com/investing/future/nq00',
        selector: '.article__content'
    }
];

// Keywords for additional searches
const MARKET_KEYWORDS = [
    'Nasdaq futures',
    'NQ futures',
    'tech stocks',
    'Fed announcement',
    'interest rates',
    'inflation data',
    'economic data',
    'market volatility'
];

// Cache for news items
let newsCache = {
    lastUpdated: null,
    items: []
};

// How often to update news (in milliseconds)
const UPDATE_INTERVAL = 900000; // 15 minutes

/**
 * Initialize the market news service
 * @param {Object} io - Socket.io instance for real-time updates
 */
const initialize = async (io) => {
    console.log('Initializing Market News Service...');

    // Create MongoDB schema for news items if it doesn't exist yet
    try {
        const MarketNews = mongoose.model('MarketNews');
        console.log('MarketNews model already exists');
    } catch (error) {
        const marketNewsSchema = new mongoose.Schema({
            title: { type: String, required: true },
            source: { type: String, required: true },
            url: { type: String, required: true },
            summary: { type: String },
            publishedAt: { type: Date },
            relevanceScore: { type: Number },
            sentimentScore: { type: Number },
            createdAt: { type: Date, default: Date.now }
        });

        mongoose.model('MarketNews', marketNewsSchema);
        console.log('MarketNews model created');
    }

    // Fetch initial news
    await fetchLatestNews();

    // Set up periodic updates
    setInterval(async () => {
        const newItems = await fetchLatestNews();

        if (newItems && newItems.length > 0 && io) {
            // Emit new items to connected clients
            io.emit('marketNewsUpdate', newItems);
            console.log(`${newItems.length} new market news items emitted to clients`);
        }
    }, UPDATE_INTERVAL);

    console.log('Market News Service initialized');
    return true;
};

/**
 * Fetch latest news from all sources
 * @returns {Array} - New news items found
 */
const fetchLatestNews = async () => {
    console.log('Fetching latest market news...');

    try {
        const newItems = [];

        // Fetch from predefined sources
        for (const source of NEWS_SOURCES) {
            const sourceItems = await fetchNewsFromSource(source);
            newItems.push(...sourceItems);
        }

        // Fetch from search queries
        for (const keyword of MARKET_KEYWORDS) {
            const searchItems = await searchForNews(keyword);
            newItems.push(...searchItems);
        }

        // Filter out duplicates
        const uniqueItems = filterDuplicates(newItems);

        // Filter already cached items
        const previousUrls = newsCache.items.map(item => item.url);
        const actuallyNewItems = uniqueItems.filter(item => !previousUrls.includes(item.url));

        // Update cache with all items
        newsCache = {
            lastUpdated: new Date(),
            items: [...uniqueItems, ...newsCache.items].slice(0, 100) // Keep the 100 most recent
        };

        // Save new items to database
        for (const item of actuallyNewItems) {
            await saveNewsItem(item);
        }

        console.log(`Fetched ${actuallyNewItems.length} new market news items`);
        return actuallyNewItems;
    } catch (error) {
        console.error('Error fetching market news:', error);
        return [];
    }
};

/**
 * Fetch news from a specific source
 * @param {Object} source - Source configuration
 * @returns {Array} - News items
 */
const fetchNewsFromSource = async (source) => {
    try {
        const response = await axios.get(source.url);
        const $ = cheerio.load(response.data);

        const items = [];

        $(source.selector).each((i, element) => {
            // Extract details based on source-specific selectors
            let title = $(element).find('h2, h3, .headline').first().text().trim();
            let url = $(element).find('a').attr('href');
            let summary = $(element).find('p, .summary').first().text().trim();

            // Ensure URL is absolute
            if (url && !url.startsWith('http')) {
                url = new URL(url, source.url).href;
            }

            // Only add if we have at least a title and URL
            if (title && url) {
                items.push({
                    title,
                    source: source.name,
                    url,
                    summary: summary || '',
                    publishedAt: new Date(),
                    relevanceScore: calculateRelevance(title, summary),
                    sentimentScore: analyzeSentiment(title, summary)
                });
            }
        });

        console.log(`Fetched ${items.length} items from ${source.name}`);
        return items;
    } catch (error) {
        console.error(`Error fetching news from ${source.name}:`, error);
        return [];
    }
};

/**
 * Search for news using web search
 * @param {string} keyword - Keyword to search for
 * @returns {Array} - News items
 */
const searchForNews = async (keyword) => {
    try {
        // This is a placeholder for the web search functionality
        // In a production environment, you would integrate with a proper search API
        console.log(`Searching for news with keyword: ${keyword}`);

        // For now, we'll do a simple search on a financial news site
        const searchUrl = `https://www.reuters.com/search/news?blob=${encodeURIComponent(keyword)}`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        const items = [];

        // Extract search results
        $('.search-result-content').each((i, element) => {
            const title = $(element).find('h3').text().trim();
            const url = $(element).find('a').attr('href');
            const summary = $(element).find('.search-result-excerpt').text().trim();

            if (title && url) {
                items.push({
                    title,
                    source: 'Reuters',
                    url: url.startsWith('http') ? url : `https://www.reuters.com${url}`,
                    summary: summary || '',
                    publishedAt: new Date(),
                    relevanceScore: calculateRelevance(title, summary),
                    sentimentScore: analyzeSentiment(title, summary)
                });
            }
        });

        console.log(`Found ${items.length} items from search: ${keyword}`);
        return items;
    } catch (error) {
        console.error(`Error searching for news with keyword ${keyword}:`, error);
        return [];
    }
};

/**
 * Filter out duplicate news items
 * @param {Array} items - News items to filter
 * @returns {Array} - Filtered news items
 */
const filterDuplicates = (items) => {
    const seen = new Set();
    return items.filter(item => {
        // Create a key using title or URL
        const key = item.title.toLowerCase();
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

/**
 * Calculate relevance score for a news item
 * @param {string} title - News item title
 * @param {string} summary - News item summary
 * @returns {number} - Relevance score (0-10)
 */
const calculateRelevance = (title, summary) => {
    // Keywords indicating high relevance for NQ trading
    const highRelevanceKeywords = [
        'nasdaq', 'nq', 'futures', 'tech', 'technology',
        'apple', 'microsoft', 'google', 'amazon', 'meta',
        'interest rate', 'fed', 'federal reserve',
        'inflation', 'cpi', 'ppi', 'gdp', 'employment'
    ];

    // Combine title and summary for analysis
    const text = `${title} ${summary}`.toLowerCase();

    // Count keyword matches
    let matches = 0;
    for (const keyword of highRelevanceKeywords) {
        if (text.includes(keyword.toLowerCase())) {
            matches++;
        }
    }

    // Generate score (0-10)
    const score = Math.min(10, matches * 2);
    return score;
};

/**
 * Analyze sentiment of a news item
 * @param {string} title - News item title
 * @param {string} summary - News item summary
 * @returns {number} - Sentiment score (-10 to 10)
 */
const analyzeSentiment = (title, summary) => {
    // Positive and negative sentiment words
    const positiveWords = [
        'gain', 'gains', 'rise', 'rises', 'rising', 'up', 'higher',
        'increase', 'increased', 'increasing', 'growth', 'growing',
        'positive', 'strong', 'stronger', 'rally', 'bullish',
        'outperform', 'beat', 'exceed', 'exceeded', 'record'
    ];

    const negativeWords = [
        'drop', 'drops', 'fall', 'falls', 'falling', 'down', 'lower',
        'decrease', 'decreased', 'decreasing', 'decline', 'declining',
        'negative', 'weak', 'weaker', 'bearish', 'underperform',
        'miss', 'missed', 'disappoint', 'disappointed', 'worry'
    ];

    // Combine title and summary for analysis
    const text = `${title} ${summary}`.toLowerCase();

    // Count matches
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
        if (text.includes(word.toLowerCase())) {
            positiveCount++;
        }
    }

    for (const word of negativeWords) {
        if (text.includes(word.toLowerCase())) {
            negativeCount++;
        }
    }

    // Calculate score (-10 to 10)
    return Math.min(10, Math.max(-10, positiveCount - negativeCount));
};

/**
 * Save a news item to the database
 * @param {Object} item - News item to save
 */
const saveNewsItem = async (item) => {
    try {
        const MarketNews = mongoose.model('MarketNews');

        // Check if it already exists
        const existing = await MarketNews.findOne({ url: item.url });
        if (existing) {
            return false;
        }

        // Create a new record
        const newsItem = new MarketNews(item);
        await newsItem.save();

        console.log(`Saved news item: ${item.title}`);
        return true;
    } catch (error) {
        console.error('Error saving news item:', error);
        return false;
    }
};

/**
 * Get the latest news items
 * @param {number} limit - Maximum number of items to return
 * @returns {Array} - News items
 */
const getLatestNews = (limit = 10) => {
    return newsCache.items.slice(0, limit);
};

/**
 * Get high-relevance news items
 * @param {number} minRelevance - Minimum relevance score (0-10)
 * @param {number} limit - Maximum number of items to return
 * @returns {Array} - News items
 */
const getRelevantNews = (minRelevance = 7, limit = 10) => {
    return newsCache.items
        .filter(item => item.relevanceScore >= minRelevance)
        .slice(0, limit);
};

/**
 * Get historical news items from the database
 * @param {Date} startDate - Start of the time range
 * @param {Date} endDate - End of the time range
 * @param {number} limit - Maximum number of items to return
 * @returns {Array} - News items
 */
const getHistoricalNews = async (startDate, endDate, limit = 100) => {
    try {
        const MarketNews = mongoose.model('MarketNews');

        const items = await MarketNews.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        })
            .sort({ createdAt: -1 })
            .limit(limit);

        return items;
    } catch (error) {
        console.error('Error retrieving historical news:', error);
        return [];
    }
};

// Export all the functions
module.exports = {
    initialize,
    getLatestNews,
    getRelevantNews,
    getHistoricalNews
};
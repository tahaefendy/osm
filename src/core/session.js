const browserManager = require('./browser');
const settings = require('../config/settings');
const { getRandomUA } = require('../utils/userAgents');
const logger = require('../utils/logger');

class SessionManager {
    /**
     * Creates a new isolated browser context with its own cookies and storage.
     */
    async createContext() {
        const browser = await browserManager.init();
        const userAgent = getRandomUA();
        
        logger.info(`Creating isolated context with User-Agent: ${userAgent}`);
        
        try {
            const context = await browser.newContext({
                userAgent: userAgent,
                viewport: { width: 1280, height: 720 },
                // Extra stealth: mask webdriver
                extraHTTPHeaders: {
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });

            // Set global timeout for this context
            context.setDefaultTimeout(settings.browser.timeout);
            
            return context;
        } catch (error) {
            logger.error(`Failed to create browser context: ${error.message}`);
            throw error;
        }
    }

    /**
     * Closes the context and clears all session data.
     */
    async closeContext(context) {
        if (context) {
            logger.info('Closing context and cleaning up session (cookies/storage)...');
            try {
                await context.close();
            } catch (error) {
                logger.error(`Error while closing context: ${error.message}`);
            }
        }
    }
}

module.exports = new SessionManager();

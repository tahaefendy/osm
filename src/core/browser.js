const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const settings = require('../config/settings');
const logger = require('../utils/logger');

// Use stealth plugin
chromium.use(stealth);

class BrowserManager {
    constructor() {
        this.browser = null;
    }

    /**
     * Initializes the browser instance if not already created.
     */
    async init() {
        if (!this.browser) {
            logger.info('Launching browser (Headed: ' + settings.browser.headed + ')...');
            try {
                this.browser = await chromium.launch({
                    headless: !settings.browser.headed,
                    args: [
                        '--disable-blink-features=AutomationControlled',
                        '--no-sandbox',
                        '--disable-setuid-sandbox'
                    ]
                });
            } catch (error) {
                logger.error(`Failed to launch browser: ${error.message}`);
                throw error;
            }
        }
        return this.browser;
    }

    /**
     * Closes the browser instance.
     */
    async close() {
        if (this.browser) {
            logger.info('Closing browser...');
            await this.browser.close();
            this.browser = null;
        }
    }
}

// Export as singleton
module.exports = new BrowserManager();

const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const settings = require('../config/settings');
const logger = require('../utils/logger');

/**
 * Browser Singleton - Tarayıcı motorunu tek bir yerden yönetir.
 */
class BrowserManager {
    constructor() {
        this.browser = null;
    }

    async getBrowser() {
        if (!this.browser) {
            logger.system('Playwright motoru başlatılıyor...');
            chromium.use(stealth);
            this.browser = await chromium.launch({
                headless: settings.browser.headed === false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-site-isolation-trials',
                    '--font-render-hinting=none',
                    '--disable-notifications'
                ]
            });
        }
        return this.browser;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = new BrowserManager();

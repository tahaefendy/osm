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

            const launchOptions = {
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
            };

            // Eğer proxy tanımlanmışsa ekle
            if (settings.browser.proxy && settings.browser.proxy.server) {
                logger.info(`Proxy kullanılıyor: ${settings.browser.proxy.server}`);
                launchOptions.proxy = {
                    server: settings.browser.proxy.server,
                    username: settings.browser.proxy.username,
                    password: settings.browser.proxy.password
                };
            }

            this.browser = await chromium.launch(launchOptions);
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

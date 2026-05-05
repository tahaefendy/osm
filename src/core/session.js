const browserManager = require('./browser');
const settings = require('../config/settings');
const { getRandomUA } = require('../utils/userAgents');

/**
 * İzole Context Yönetimi - Her hesap için yeni bir temiz oturum açar.
 */
class SessionManager {
    async createContext() {
        const browser = await browserManager.getBrowser();
        const context = await browser.newContext({
            userAgent: getRandomUA(),
            viewport: settings.browser.viewport,
            deviceScaleFactor: 1,
            hasTouch: false,
            javaScriptEnabled: true
        });

        // Anti-bot için ekstra özellikler
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        return context;
    }

    async closeContext(context) {
        if (context) {
            await context.close();
        }
    }
}

module.exports = new SessionManager();

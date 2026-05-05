const logger = require('../utils/logger');
const { randomDelay } = require('../utils/delay');

/**
 * Oturumu kapatır ve bir sonraki işleme hazırlar.
 */
const logout = async (page) => {
    try {
        logger.info('Oturum kapatılıyor (Logout)...');
        // OSM logout URL'sine direkt gitmek daha güvenlidir
        await page.goto('https://tr.onlinesoccermanager.com/Logout', { waitUntil: 'networkidle' });
        await randomDelay();
        logger.info('Oturum başarıyla kapatıldı.');
    } catch (error) {
        logger.warn('Logout sırasında hata oluştu, devam ediliyor...');
    }
};

module.exports = { logout };

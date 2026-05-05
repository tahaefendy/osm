const axios = require('axios');
const logger = require('./utils/logger');

class MailSystem {
    constructor() {
        this.baseUrl = 'https://kodteslimal.com'; // PHP sitemizin adresi
    }

    async init() {
        logger.info('MailSystem initialized.');
    }

    async createAccount() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/mail/create`);
            if (response.data && response.data.success) {
                logger.info(`Mail account received: ${response.data.email}`);
                return {
                    email: response.data.email,
                    token: response.data.token
                };
            }
            throw new Error(response.data.error || 'Sistemden e-posta hesabı alınamadı.');
        } catch (error) {
            logger.error(`MailSystem createAccount error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Polling yaparak yeni doğrulama kodunu bekler.
     */
    async waitForCode(token, timeout = 120000) {
        const startTime = Date.now();
        logger.info(`Kod bekleniyor (Token: ${token})...`);

        while (Date.now() - startTime < timeout) {
            try {
                const response = await axios.get(`${this.baseUrl}/api/mail/get-code`, {
                    params: { token }
                });

                if (response.data && response.data.success && response.data.code) {
                    logger.info(`Kod bulundu: ${response.data.code}`);
                    return response.data.code;
                }
            } catch (error) {
                logger.warn(`MailSystem poll hatası: ${error.message}`);
            }

            // 5 saniye bekle
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        logger.warn('Kod bekleme süresi doldu (Timeout).');
        return null;
    }
}

module.exports = MailSystem;

const axios = require('axios');
const logger = require('./utils/logger');

/**
 * Mail.tm API entegrasyonu ile bağımsız geçici e-posta servisi.
 */
class MailSystem {
    constructor() {
        this.apiBase = 'https://api.mail.tm';
        this.address = null;
        this.password = null;
        this.token = null;
    }

    async init() {
        logger.info('MailSystem (Mail.tm) başlatılıyor...');
    }

    /**
     * Mail.tm üzerinden yeni bir hesap oluşturur.
     */
    async createAccount() {
        try {
            // 1. Kullanılabilir domainleri al
            const domainsRes = await axios.get(`${this.apiBase}/domains`);
            const domain = domainsRes.data['hydra:member'][0].domain;

            // 2. Rastgele bilgiler oluştur
            const id = Math.random().toString(36).substring(2, 10);
            this.address = `${id}@${domain}`;
            this.password = 'OsmBot123!';

            // 3. Hesabı oluştur
            await axios.post(`${this.apiBase}/accounts`, {
                address: this.address,
                password: this.password
            });

            // 4. Token (JWT) al
            const tokenRes = await axios.post(`${this.apiBase}/token`, {
                address: this.address,
                password: this.password
            });
            this.token = tokenRes.data.token;

            logger.info(`Mail.tm hesabı oluşturuldu: ${this.address}`);
            
            return {
                email: this.address,
                token: this.token // JWT token'ı kullanacağız
            };
        } catch (error) {
            logger.error(`Mail.tm hesap oluşturma hatası: ${error.message}`);
            if (error.response) logger.error(JSON.stringify(error.response.data));
            throw error;
        }
    }

    /**
     * Gelen kutusunu polleyerek doğrulama kodunu bekler.
     */
    async waitForCode(token, timeout = 120000) {
        const startTime = Date.now();
        const jwt = token || this.token;
        
        logger.info(`Mail.tm üzerinden kod bekleniyor (${this.address})...`);

        while (Date.now() - startTime < timeout) {
            try {
                // 1. Mesaj listesini al
                const messagesRes = await axios.get(`${this.apiBase}/messages`, {
                    headers: { 'Authorization': `Bearer ${jwt}` }
                });

                const messages = messagesRes.data['hydra:member'];
                if (messages.length > 0) {
                    // 2. En son mesajın içeriğini al
                    const msgId = messages[0].id;
                    const msgRes = await axios.get(`${this.apiBase}/messages/${msgId}`, {
                        headers: { 'Authorization': `Bearer ${jwt}` }
                    });

                    const content = msgRes.data.text || msgRes.data.intro || '';
                    logger.info('Yeni bir e-posta alındı, içerik taranıyor...');

                    // 3. 6 haneli kodu ara (Örn: 123456)
                    const codeMatch = content.match(/\b(\d{6})\b/);
                    if (codeMatch) {
                        logger.info(`Doğrulama kodu yakalandı: ${codeMatch[1]}`);
                        return codeMatch[1];
                    }
                    
                    // Alternatif: 5-8 haneli kodları da dene (OSM bazen değişebilir)
                    const altMatch = content.match(/\b(\d{5,8})\b/);
                    if (altMatch) {
                        logger.info(`Alternatif doğrulama kodu yakalandı: ${altMatch[1]}`);
                        return altMatch[1];
                    }
                }
            } catch (error) {
                logger.warn(`Mail.tm izleme hatası: ${error.message}`);
            }

            // 5 saniye bekle
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        logger.warn('Mail.tm kod bekleme süresi doldu (Timeout).');
        return null;
    }
}

module.exports = MailSystem;

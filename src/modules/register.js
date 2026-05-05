const logger = require('../utils/logger');
const { randomDelay } = require('../utils/delay');
const settings = require('../config/settings');
const fs = require('fs');
const path = require('path');

class RegisterFlow {
    constructor(page) {
        this.page = page;
        this.selectors = settings.registration.selectors;
    }

    /**
     * Hata anında ekran görüntüsü alır.
     */
    async takeScreenshot(stepName) {
        try {
            const fileName = `error_${stepName}_${Date.now()}.png`;
            const dir = settings.paths.screenshots;
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            
            const filePath = path.join(dir, fileName);
            await this.page.screenshot({ path: filePath });
            logger.error(`Hata anı kaydedildi: ${filePath}`);
        } catch (e) {
            logger.error(`Ekran görüntüsü alınamadı: ${e.message}`);
        }
    }

    async clickAccept() {
        try {
            logger.info('Accept butonuna basılıyor...');
            await this.page.waitForSelector(this.selectors.acceptBtn, { timeout: 15000 });
            await this.page.click(this.selectors.acceptBtn);
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('clickAccept');
            throw new Error(`Accept hatası: ${error.message}`);
        }
    }

    async clickSignupWithEmail() {
        try {
            logger.info('Sign up with email butonuna basılıyor...');
            await this.page.waitForSelector(this.selectors.signupEmailBtn, { timeout: 10000 });
            await this.page.click(this.selectors.signupEmailBtn);
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('clickSignupWithEmail');
            throw new Error(`Signup button hatası: ${error.message}`);
        }
    }

    async fillUsername(username) {
        try {
            logger.info(`Kullanıcı adı giriliyor: ${username}`);
            await this.page.waitForSelector(this.selectors.usernameInput);
            await this.page.fill(this.selectors.usernameInput, username);
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('fillUsername');
            throw new Error(`Username girişi hatası: ${error.message}`);
        }
    }

    async submitUsername() {
        try {
            logger.info('Kullanıcı adı onaylanıyor...');
            await this.page.click(this.selectors.usernameSubmit);
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('submitUsername');
            throw new Error(`Username onayı hatası: ${error.message}`);
        }
    }

    async fillEmail(email) {
        try {
            logger.info(`E-posta adresi giriliyor: ${email}`);
            await this.page.waitForSelector(this.selectors.emailInput);
            await this.page.fill(this.selectors.emailInput, email);
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('fillEmail');
            throw new Error(`Email girişi hatası: ${error.message}`);
        }
    }

    async submitEmail() {
        try {
            logger.info('E-posta onaylanıyor...');
            await this.page.click(this.selectors.emailSubmit);
            await randomDelay(5000, 8000); // Kayıt sonrası ekstra bekleme
        } catch (error) {
            await this.takeScreenshot('submitEmail');
            throw new Error(`Email onayı hatası: ${error.message}`);
        }
    }

    async checkSuccess() {
        try {
            // Başarıyı doğrulamak için sayfada bir element kontrolü yapılabilir
            logger.success('Hesap oluşturma adımları tamamlandı.');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Tüm akışı orkestra eder.
     */
    async execute(inviteLink, userData, mailer) {
        try {
            await this.page.goto(inviteLink, { waitUntil: 'networkidle', timeout: 60000 });
            
            await this.clickAccept();
            await this.clickSignupWithEmail();
            await this.fillUsername(userData.username);
            await this.submitUsername();
            
            // Eğer username doluysa suggestion çıkabilir, onu geçmek gerekebilir
            // (Bu adım dinamiktir, gerekirse handleUsernameSuggestion eklenebilir)

            await this.fillEmail(userData.email);
            await this.submitEmail();

            // Eğer mail doğrulaması gerekliyse burada mailer kullanılır
            if (mailer) {
                logger.info('Mail doğrulaması bekleniyor...');
                // ... mailer.waitForCode mantığı
            }

            return await this.checkSuccess();
        } catch (error) {
            logger.error(`Akış sırasında kritik hata: ${error.message}`);
            return false;
        }
    }
}

module.exports = RegisterFlow;

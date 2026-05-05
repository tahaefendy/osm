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
            logger.info('Accept/Kabul et butonuna basılıyor...');
            // Hem İngilizce hem Türkçe metni kontrol et
            const selector = this.selectors.acceptBtn;
            await this.page.waitForSelector(selector, { timeout: 10000 });
            await this.page.click(selector);
            await randomDelay();
        } catch (error) {
            logger.info('Accept butonu görülmedi veya zaten geçilmiş, devam ediliyor...');
        }
    }

    async clickSignupWithEmail() {
        try {
            logger.info('E-postayla kaydol butonuna basılıyor (Bilingual)...');
            const selector = this.selectors.signupEmailBtn;
            await this.page.waitForSelector(selector, { timeout: 15000 });
            await this.page.click(selector);
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('clickSignupWithEmail');
            throw new Error(`"E-postayla kaydol" butonu bulunamadı. (Dil veya IP engeli kaynaklı olabilir)`);
        }
    }

    async fillUsername(username) {
        try {
            logger.info(`Kullanıcı adı giriliyor: ${username}`);
            await this.page.waitForSelector(this.selectors.usernameInput);
            // Daha insansı görünmesi için tek tek yazdırıyoruz
            await this.page.type(this.selectors.usernameInput, username, { delay: Math.floor(Math.random() * 100) + 50 });
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('fillUsername');
            throw new Error(`Username girişi hatası: ${error.message}`);
        }
    }

    async submitUsername() {
        try {
            logger.info('Kullanıcı adı onaylanıyor...');
            // Tıklamadan önce butona odaklan
            await this.page.focus(this.selectors.usernameSubmit);
            await this.page.click(this.selectors.usernameSubmit);
            await randomDelay(3000, 5000);

            // Eğer kullanıcı adı doluysa öneri çıkabilir
            const suggestBtn = this.selectors.suggestBtn;
            if (await this.page.$(suggestBtn)) {
                logger.info('Kullanıcı adı alınmış, öneri butonuna basılıyor...');
                await this.page.click(suggestBtn);
                await randomDelay();
                await this.page.click(this.selectors.usernameSubmit);
            }
        } catch (error) {
            await this.takeScreenshot('submitUsername');
            throw new Error(`Username onayı hatası: ${error.message}`);
        }
    }

    async fillEmail(email) {
        try {
            logger.info(`E-posta adresi giriliyor: ${email}`);
            await this.page.waitForSelector(this.selectors.emailInput);
            // Daha insansı görünmesi için tek tek yazdırıyoruz
            await this.page.type(this.selectors.emailInput, email, { delay: Math.floor(Math.random() * 80) + 40 });
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('fillEmail');
            throw new Error(`Email girişi hatası: ${error.message}`);
        }
    }

    async submitEmail() {
        try {
            logger.info('E-posta onaylanıyor (Kod gönderiliyor)...');
            await this.page.click(this.selectors.emailSubmit);
            // Sayfanın değişmesini bekle
            await this.page.waitForLoadState('networkidle').catch(() => {});
            await randomDelay(3000, 5000); 
        } catch (error) {
            await this.takeScreenshot('submitEmail');
            throw new Error(`Email onayı hatası: ${error.message}`);
        }
    }


    async checkSuccess() {
        try {
            // Başarıyı anlamak için daha geniş bir yelpazede kontrol yapıyoruz
            const successSelectors = [
                'input#code', 
                'input[name="code"]', 
                'input[type="number"]',
                'input[placeholder*="code"]',
                'input[placeholder*="kod"]',
                '.otp-input', 
                '.verify-email-container',
                'h1:has-text("Verify")', 
                'h1:has-text("Doğrula")',
                'h2:has-text("Verify")',
                'h2:has-text("Doğrula")',
                'div:has-text("Enter the code")',
                'div:has-text("Kodu girin")'
            ].join(', ');

            // Biraz bekleyip bu elementlerden herhangi biri var mı bak
            await this.page.waitForSelector(successSelectors, { timeout: 20000 });
            logger.success('Kayıt adımı başarıyla geçildi ve doğrulama ekranına ulaşıldı.');
            return true;
        } catch (error) {
            await this.takeScreenshot('success_check_failed');
            throw new Error('E-posta onay ekranı tespit edilemedi (Ancak hesap oluşmuş olabilir).');
        }
    }

    /**
     * Tüm akışı orkestra eder.
     */
    async execute(inviteLink, userData, mailer) {
        try {
            logger.info('Güvenli başlangıç için oturum temizleniyor...');
            await this.page.goto('https://tr.onlinesoccermanager.com/Logout', { waitUntil: 'networkidle' }).catch(() => {});
            
            logger.info(`İşlem başlatıldı: ${inviteLink}`);
            try {
                await this.page.goto(inviteLink, { waitUntil: 'networkidle', timeout: 45000 });
            } catch (e) {
                throw new Error('Davet linki yüklenemedi (Bağlantı yavaş veya IP engeli).');
            }
            
            await this.clickAccept();
            await this.clickSignupWithEmail();
            await this.fillUsername(userData.username);
            await this.submitUsername();
            
            await this.fillEmail(userData.email);
            await this.submitEmail();

            return await this.checkSuccess();
        } catch (error) {
            logger.error(`Akış hatası: ${error.message}`);
            // Hata mesajını frontend loguna da gönderelim (main.js üzerinden geçecek)
            this.lastError = error.message;
            return false;
        }
    }
}

module.exports = RegisterFlow;

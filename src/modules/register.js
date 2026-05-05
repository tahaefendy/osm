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
            logger.info('E-posta ile kayıt butonuna basılıyor...');
            const selector = this.selectors.signupEmailBtn;
            await this.page.waitForSelector(selector, { timeout: 10000 });
            await this.page.click(selector);
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('clickSignupWithEmail');
            throw new Error(`Kayıt butonu bulunamadı (Dil veya selector kaynaklı olabilir): ${error.message}`);
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
            await this.page.fill(this.selectors.emailInput, email);
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
            await randomDelay(5000, 8000); 
        } catch (error) {
            await this.takeScreenshot('submitEmail');
            throw new Error(`Email onayı hatası: ${error.message}`);
        }
    }

    async enterCode(code) {
        try {
            logger.info(`Doğrulama kodu giriliyor: ${code}`);
            const codeSelectors = [
                'input#code', 
                'input[name="code"]', 
                'input[placeholder*="code"]',
                'input[placeholder*="kod"]',
                '.otp-input input'
            ];
            
            let found = false;
            for (const selector of codeSelectors) {
                if (await this.page.$(selector)) {
                    await this.page.fill(selector, code);
                    found = true;
                    break;
                }
            }
            
            if (found) {
                logger.info('Kod girildi, onaylanıyor...');
                await this.page.keyboard.press('Enter');
                await randomDelay(5000, 8000);
            } else {
                await this.takeScreenshot('code_field_not_found');
                logger.error('Kod giriş alanı sayfada bulunamadı!');
            }
        } catch (error) {
            await this.takeScreenshot('enterCode');
            throw new Error(`Kod girişi hatası: ${error.message}`);
        }
    }

    async checkSuccess() {
        try {
            // Dashboard'a ulaşıldığını her iki dilde de ortak olan elementlerden anla
            await this.page.waitForSelector('#manager-profile, .page-main-content, #news-container', { timeout: 25000 });
            logger.success('Hesap başarıyla oluşturuldu ve doğrulandı.');
            return true;
        } catch (error) {
            await this.takeScreenshot('registration_failed_at_end');
            logger.warn('Kayıt doğrulanamadı (Dashboard yüklenmedi).');
            return false;
        }
    }

    /**
     * Tüm akışı orkestra eder.
     */
    async execute(inviteLink, userData, mailer) {
        try {
            // Önce temiz bir başlangıç için logout sayfasına git (Varsa eski oturumu düşürür)
            logger.info('Güvenli başlangıç için oturum temizleniyor...');
            await this.page.goto('https://tr.onlinesoccermanager.com/Logout', { waitUntil: 'networkidle' }).catch(() => {});
            
            logger.info(`İşlem başlatıldı: ${inviteLink}`);
            await this.page.goto(inviteLink, { waitUntil: 'networkidle', timeout: 60000 });
            
            await this.clickAccept();
            await this.clickSignupWithEmail();
            await this.fillUsername(userData.username);
            await this.submitUsername();
            
            await this.fillEmail(userData.email);
            await this.submitEmail();

            // Mail doğrulaması
            if (mailer) {
                logger.info('E-posta üzerinden onay kodu bekleniyor...');
                const code = await mailer.waitForCode(userData.mailToken);
                if (code) {
                    await this.enterCode(code);
                } else {
                    logger.error('Doğrulama kodu e-postaya gelmedi!');
                    return false;
                }
            }

            return await this.checkSuccess();
        } catch (error) {
            logger.error(`Akış sırasında kritik hata: ${error.message}`);
            return false;
        }
    }
}

module.exports = RegisterFlow;

const readline = require('readline');
const sessionManager = require('./src/core/session');
const browserManager = require('./src/core/browser');
const RegisterFlow = require('./src/modules/register');
const { logout } = require('./src/modules/logout');
const { generateUsername } = require('./src/modules/usernameGenerator');
const MailSystem = require('./src/mail'); // Mail.tm entegrasyonumuz
const logger = require('./src/utils/logger');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Ana Uygulama Başlangıç Noktası
 */
async function main() {
    console.clear();
    logger.system('=== OSM Profesyonel Otomasyon Sistemi ===');

    try {
        // 1. Kullanıcıdan bilgileri al
        const inviteLink = await askQuestion('Invite Link: ');
        const countStr = await askQuestion('Account Count: ');
        const accountCount = parseInt(countStr) || 1;

        if (!inviteLink) {
            logger.error('Invite link zorunludur!');
            process.exit(1);
        }

        const mailer = new MailSystem();
        await mailer.init();

        // 2. Döngü - Her hesap için yeni context
        for (let i = 0; i < accountCount; i++) {
            logger.system(`\n--- Hesap ${i + 1}/${accountCount} Başlatılıyor ---`);
            
            const context = await sessionManager.createContext();
            const page = await context.newPage();
            
            const username = generateUsername();
            
            // Mail oluştur
            const emailAccount = await mailer.createAccount();
            
            const registerFlow = new RegisterFlow(page);
            const success = await registerFlow.execute(inviteLink, { 
                username, 
                email: emailAccount.email,
                mailToken: emailAccount.token
            }, mailer);
            
            if (success) {
                logger.success(`Hesap oluşturuldu: ${username} (${emailAccount.email})`);
                await logout(page);
            } else {
                logger.warn(`Kayıt başarısız: ${username}`);
            }

            // Context'i kapat (bellek yönetimi)
            await sessionManager.closeContext(context);
            
            // Hesaplar arası bekleme
            if (i < accountCount - 1) {
                const wait = Math.floor(Math.random() * 10000) + 10000;
                logger.info(`${wait/1000} saniye sonra yeni hesaba geçilecek...`);
                await new Promise(r => setTimeout(r, wait));
            }
        }

    } catch (error) {
        logger.error(`Kritik Sistem Hatası: ${error.message}`);
    } finally {
        await browserManager.close();
        rl.close();
        logger.system('=== Otomasyon Tamamlandı ===');
    }
}

// Başlat
main();

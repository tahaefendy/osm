const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const sessionManager = require('./src/core/session');
const browserManager = require('./src/core/browser');
const RegisterFlow = require('./src/modules/register');
const { logout } = require('./src/modules/logout');
const { generateUsername } = require('./src/modules/usernameGenerator');
const MailSystem = require('./src/mail');
const logger = require('./src/utils/logger');
const { saveRegistration } = require('./src/utils/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: "*", 
        methods: ["GET", "POST"] 
    } 
});

/**
 * Başarılı hesapları log dosyasına kaydeder.
 */
const saveToLog = (data) => {
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    
    const logFile = path.join(logDir, 'accounts.log');
    const timestamp = new Date().toLocaleString('tr-TR');
    const logEntry = `[${timestamp}] Link: ${data.link} | User: ${data.username} | Email: ${data.email}\n`;
    
    fs.appendFileSync(logFile, logEntry);
};

io.on('connection', (socket) => {
    logger.system('Bağlantı sağlandı.');

    socket.on('start-bot', async ({ link, count, key, userId }) => {
        const accountCount = parseInt(count) || 10;
        logger.info(`Sipariş alındı: ${accountCount} adet. Key: ${key || 'Yok'} | UserID: ${userId || 'Anonim'}`);
        
        socket.emit('log', { type: 'info', msg: 'Siparişiniz işleme alındı, sistem hazırlanıyor...' });

        try {
            const mailer = new MailSystem();
            await mailer.init();

            let successCount = 0;
            for (let i = 0; i < accountCount; i++) {
                const currentId = i + 1;
                
                socket.emit('log', { type: 'system', msg: `[${currentId}/${accountCount}] Hesap hazırlanıyor...` });

                const context = await sessionManager.createContext();
                const page = await context.newPage();
                
                const username = generateUsername();
                const emailAccount = await mailer.createAccount(); 
                
                const registerFlow = new RegisterFlow(page);
                
                socket.emit('log', { type: 'info', msg: `[${currentId}/${accountCount}] Kayıt işlemi yapılıyor...` });

                const success = await registerFlow.execute(link, { 
                    username, 
                    email: emailAccount.email, 
                    mailToken: emailAccount.token 
                }, mailer);
                
                if (success) {
                    successCount++;
                    const progress = Math.round((successCount / accountCount) * 100);
                    logger.success(`Hesap ${currentId} tamamlandı. Toplam: ${successCount}`);
                    
                    // 1. Yerel log dosyasına kaydet
                    saveToLog({ link, username, email: emailAccount.email });

                    // 2. Veritabanına kaydet (Admin/Kullanıcı paneli için)
                    await saveRegistration({
                        key,
                        userId,
                        link,
                        username,
                        email: emailAccount.email
                    });

                    socket.emit('progress', { 
                        percent: progress, 
                        count: successCount,
                        total: accountCount,
                        type: 'success',
                        msg: `[${successCount}/${accountCount}] Hesap başarıyla oluşturuldu.` 
                    });
                    
                } else {
                    const errorMsg = registerFlow.lastError || 'Bilinmeyen bir hata oluştu.';
                    socket.emit('log', { type: 'error', msg: `[${currentId}/${accountCount}] Kayıt başarısız: ${errorMsg}` });
                }

                // Her durumda oturumu kapat ve temizle
                await logout(page);
                await sessionManager.closeContext(context);

                // Bekleme süresi
                if (i < accountCount - 1) {
                    const wait = Math.floor(Math.random() * 10000) + 15000;
                    socket.emit('log', { type: 'info', msg: 'Sistem dinlendiriliyor, lütfen bekleyin...' });
                    await new Promise(r => setTimeout(r, wait));
                }
            }

            socket.emit('finished', { 
                successCount,
                msg: `${accountCount} denemeden ${successCount} tanesi başarıyla tamamlandı.` 
            });
            logger.system(`Sipariş tamamlandı. Başarılı: ${successCount}`);

        } catch (error) {
            logger.error(`Sistem hatası: ${error.message}`);
            socket.emit('log', { type: 'error', msg: 'Sistemde geçici bir yoğunluk var, lütfen daha sonra tekrar deneyin.' });
        }
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    logger.system(`Servis ${PORT} portunda hazır.`);
});


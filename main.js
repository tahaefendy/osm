const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sessionManager = require('./src/core/session');
const browserManager = require('./src/core/browser');
const RegisterFlow = require('./src/modules/register');
const { logout } = require('./src/modules/logout');
const { generateUsername } = require('./src/modules/usernameGenerator');
const MailSystem = require('./src/mail');
const logger = require('./src/utils/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: "*", 
        methods: ["GET", "POST"] 
    } 
});

/**
 * Socket.io üzerinden gelen bağlantıları yönetir.
 */
io.on('connection', (socket) => {
    logger.system('Web sitesi üzerinden bağlantı sağlandı.');

    socket.on('start-bot', async ({ link, count }) => {
        logger.info(`İşlem başlatıldı. Link: ${link}, Adet: ${count}`);
        socket.emit('log', { type: 'info', msg: 'Bot sunucusu aktif, işlemler başlatılıyor...' });

        try {
            const mailer = new MailSystem();
            await mailer.init();
            const accountCount = parseInt(count) || 1;

            for (let i = 0; i < accountCount; i++) {
                const currentId = i + 1;
                socket.emit('log', { type: 'system', msg: `Hesap ${currentId}/${accountCount} için hazırlık yapılıyor...` });

                const context = await sessionManager.createContext();
                const page = await context.newPage();
                
                const username = generateUsername();
                const emailAccount = await mailer.createAccount(); 
                
                const registerFlow = new RegisterFlow(page);
                
                // Web sitesine log gönder
                socket.emit('log', { type: 'info', msg: `Kullanıcı oluşturuluyor: ${username}` });

                const success = await registerFlow.execute(link, { 
                    username, 
                    email: emailAccount.email, 
                    mailToken: emailAccount.token 
                }, mailer);
                
                if (success) {
                    logger.success(`Hesap ${currentId} tamamlandı.`);
                    socket.emit('progress', { count: currentId, msg: `Hesap ${currentId} başarıyla tamamlandı.` });
                    await logout(page);
                } else {
                    logger.error(`Hesap ${currentId} sırasında hata.`);
                    socket.emit('log', { type: 'error', msg: `Hesap ${currentId} oluşturulurken hata oluştu.` });
                }

                await sessionManager.closeContext(context);

                // Hesaplar arası bekleme
                if (i < accountCount - 1) {
                    const wait = Math.floor(Math.random() * 10000) + 10000;
                    socket.emit('log', { type: 'info', msg: `Bir sonraki hesap için ${wait/1000}sn bekleniyor...` });
                    await new Promise(r => setTimeout(r, wait));
                }
            }

            socket.emit('finished');
            logger.system('Tüm işlemler tamamlandı.');

        } catch (error) {
            logger.error(`Sistem hatası: ${error.message}`);
            socket.emit('log', { type: 'error', msg: `Kritik Hata: ${error.message}` });
        }
    });

    socket.on('disconnect', () => {
        logger.warn('Web sitesi bağlantısı kesildi.');
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    logger.system(`Bot Sunucusu ${PORT} portunda dinlemede...`);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sessionManager = require('./src/core/session');
const browserManager = require('./src/core/browser');
const RegisterFlow = require('./src/modules/register');
const { generateUsername } = require('./src/modules/usernameGenerator');
const { generateEmail } = require('./src/utils/emailGenerator');
const logger = require('./src/utils/logger');
// Not: Projenizde mail.js dosyasının adını ve yerini kontrol edip buraya yazın:
const MailSystem = require('./src/mail'); 
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
io.on('connection', (socket) => {
    logger.info('Site üzerinden bağlantı sağlandı.');
    socket.on('start-bot', async ({ key, link }) => {
        logger.info(`İşlem başladı. Link: ${link}`);
        socket.emit('log', { type: 'info', msg: 'Railway sunucusuna bağlanıldı, bot başlatılıyor...' });
        try {
            const mailer = new MailSystem();
            await mailer.init();
            for (let i = 0; i < 10; i++) {
                const id = i + 1;
                socket.emit('log', { type: 'system', msg: `Hesap ${id}/10 için işlem sırasına girildi...` });
                const context = await sessionManager.createContext();
                const page = await context.newPage();
                
                const username = generateUsername();
                const emailAccount = await mailer.createAccount(); 
                
                const registerFlow = new RegisterFlow(page);
                const success = await registerFlow.execute(link, { 
                    username, 
                    email: emailAccount.email, 
                    mailToken: emailAccount.token 
                }, mailer);
                
                if (success) {
                    socket.emit('progress', { count: id, msg: `Hesap ${id} başarıyla tamamlandı.` });
                } else {
                    socket.emit('log', { type: 'error', msg: `Hesap ${id} oluşturulurken bir sorun oluştu.` });
                }
                await sessionManager.closeContext(context);
            }
            socket.emit('finished');
        } catch (error) {
            socket.emit('log', { type: 'error', msg: 'Hata: ' + error.message });
        }
    });
});
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Bot ${PORT} portunda sitemizi dinliyor...`);
});

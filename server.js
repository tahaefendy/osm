const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-chromium');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));
app.use(express.json());

const KEYS_FILE = path.join(__dirname, 'keys.json');

// --- Helper Functions ---

function getKeys() {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
}

function saveKeys(data) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 4));
}

const https = require('https');
const { SocksProxyAgent } = require('socks-proxy-agent');

const PROXY = 'socks5://184.95.235.194:1080';
const proxyAgent = new SocksProxyAgent(PROXY);
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// --- Mail.tm Helper ---
class MailSystem {
    constructor() {
        this.api = 'https://api.mail.tm';
        this.domain = '';
        this.axiosConfig = {}; // No proxy for local test
    }

    async init() {
        const res = await axios.get(`${this.api}/domains`);
        this.domain = res.data['hydra:member'][0].domain;
    }

    async createAccount() {
        const username = `u${Math.floor(Date.now() / 1000)}${Math.floor(Math.random() * 1000)}`;
        const email = `${username}@${this.domain}`;
        const password = 'ComplexPassword123!@#';
        
        try {
            await axios.post(`${this.api}/accounts`, {
                address: email,
                password: password
            });

            const tokenRes = await axios.post(`${this.api}/token`, {
                address: email,
                password: password
            });

            return { email, password, token: tokenRes.data.token };
        } catch (err) {
            console.log('Mail creation error:', err.response?.status);
            if (err.response && (err.response.status === 429 || err.response.status === 422)) {
                await new Promise(r => setTimeout(r, 15000));
                return this.createAccount(); 
            }
            throw err;
        }
    }

    async waitForCode(token) {
        let code = null;
        let attempts = 0;
        
        while (!code && attempts < 20) {
            try {
                const res = await axios.get(`${this.api}/messages`, {
                    headers: { Authorization: `Bearer ${token}` },
                    ...this.axiosConfig
                });
                
                const messages = res.data['hydra:member'];
                if (messages.length > 0) {
                    const msgRes = await axios.get(`${this.api}/messages/${messages[0].id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                        ...this.axiosConfig
                    });
                    
                    const content = msgRes.data.text || msgRes.data.intro;
                    const match = content.match(/\b\d{6}\b/);
                    if (match) code = match[0];
                }
            } catch (e) {
                console.log('Error polling mail:', e.message);
            }
            
            if (!code) {
                await new Promise(r => setTimeout(r, 3000));
                attempts++;
            }
        }
        return code;
    }
}

// --- API Endpoints ---

app.post('/verify-key', (req, res) => {
    const { key } = req.body;
    console.log(`[AUTH] Key verification request: ${key}`);
    const data = getKeys();
    
    if (data.keys.includes(key) && !data.used_keys.includes(key)) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Geçersiz veya kullanılmış key.' });
    }
});

// --- Socket.io Bot Logic ---

io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('start-bot', async ({ key, link }) => {
        const data = getKeys();
        if (!data.keys.includes(key) || data.used_keys.includes(key)) {
            socket.emit('log', { type: 'error', msg: 'Key yetkisiz!' });
            return;
        }

        socket.emit('log', { type: 'system', msg: 'Stabil Mod: Hesaplar teker teker oluşturuluyor...' });

        const mailer = new MailSystem();
        await mailer.init();

        const browser = await chromium.launch({ 
            headless: true
        });
        let totalCompleted = 0;
        const totalTarget = 10;
        const batchSize = 1; // 1 by 1 for local stability

        try {
            async function createSingleAccount(id) {
                const context = await browser.newContext({
                    ignoreHTTPSErrors: true
                });
                const page = await context.newPage();
                
                try {
                    const account = await mailer.createAccount();
                    socket.emit('log', { type: 'info', msg: `[Hesap ${id}] E-posta hazır: ${account.email}` });
                    
                    // onelink.me yerine doğrudan OSM Referral URL'ine git
                    // link parametresinden shortlink kodunu çıkar
                    let targetUrl = link;
                    if (link.includes('onelink.me')) {
                        // Shortlink kodunu URL'den al (örn: f3dmcskn)
                        const shortCode = link.split('/').pop();
                        targetUrl = `https://en.onlinesoccermanager.com/Referral?af_force_deeplink=true&deep_link_sub1=1&source_caller=api&pid=af_app_invites&shortlink=${shortCode}&deep_link_value=invite&af_channel=11&c=friend_invite`;
                        socket.emit('log', { type: 'info', msg: `[Hesap ${id}] Direkt OSM URL'ine gidiliyor...` });
                    }
                    
                    socket.emit('log', { type: 'info', msg: `[Hesap ${id}] Kayıt sayfasına gidiliyor...` });
                    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                    await page.waitForTimeout(4000);

                    // 1. Çerezleri temizle
                    try {
                        const cookieBtn = await page.$('button#onetrust-accept-btn-handler');
                        if (cookieBtn) { await cookieBtn.click(); await page.waitForTimeout(1000); }
                    } catch (e) {}

                    // 2. PrivacyNotice sayfasındaysak kabul et
                    let currentUrl = page.url();
                    socket.emit('log', { type: 'info', msg: `[Hesap ${id}] Sayfa: ${currentUrl.split('/').pop().split('?')[0]}` });

                    if (currentUrl.includes('PrivacyNotice')) {
                        socket.emit('log', { type: 'info', msg: `[Hesap ${id}] Gizlilik sayfası kabul ediliyor...` });
                        
                        // JavaScript ile zorla tıkla (görünür olmasa bile)
                        await page.evaluate(() => {
                            const btn = document.querySelector('button.btn-orange, button.btn-new.btn-orange, button[class*="btn-orange"]');
                            if (btn) btn.click();
                            else document.querySelector('button')?.click();
                        });
                        
                        socket.emit('log', { type: 'info', msg: `[Hesap ${id}] Accept tıklandı, yönlendirme bekleniyor...` });
                        await page.waitForTimeout(5000);
                        currentUrl = page.url();
                        socket.emit('log', { type: 'info', msg: `[Hesap ${id}] Sonraki sayfa: ${currentUrl.split('/').pop().split('?')[0]}` });
                    }

                    // 3. Login sayfasındaysak "Hesap oluştur"a tıkla
                    if (!currentUrl.includes('/Register')) {
                        socket.emit('log', { type: 'info', msg: `[Hesap ${id}] Kayıt sayfasına geçiliyor...` });
                        try {
                            await page.waitForSelector('button.btn-alternative', { timeout: 10000 });
                            await page.click('button.btn-alternative');
                            await page.waitForTimeout(4000);
                        } catch(e) {
                            socket.emit('log', { type: 'info', msg: `[Hesap ${id}] btn-alternative yok, devam...` });
                        }
                    }

                    // 4. "E-postayla kaydol" butonunu bul ve tıkla
                    socket.emit('log', { type: 'info', msg: `[Hesap ${id}] E-posta formu tetikleniyor...` });
                    const emailBtn = await page.$('button.btn-sso.btn-orange') 
                        || await page.$('button.btn-orange');
                    
                    if (emailBtn) {
                        await emailBtn.click();
                        socket.emit('log', { type: 'info', msg: `[Hesap ${id}] E-posta butonu tıklandı.` });
                    } else {
                        const allBtns = await page.evaluate(() => 
                            Array.from(document.querySelectorAll('button')).map(b => `[${b.className}]: ${b.textContent.trim().substring(0,30)}`)
                        );
                        socket.emit('log', { type: 'error', msg: `[Hesap ${id}] Butonlar: ${allBtns.join(' | ')}` });
                    }
                    await page.waitForTimeout(4000);

                    // 5. Menajer ismini enjekte et
                    socket.emit('log', { type: 'info', msg: `[Hesap ${id}] Form dolduruluyor...` });
                    await page.waitForSelector('input#managername', { state: 'attached', timeout: 20000 });
                    
                    const managerName = `User${Math.floor(Math.random() * 9999999)}`;
                    await page.evaluate(({name}) => {
                        const el = document.querySelector('input#managername');
                        if (el) {
                            el.value = name;
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }, { name: managerName });
                    await page.waitForTimeout(2000);
                    await page.evaluate(() => document.querySelector('button#submit-managername')?.click());
                    await page.waitForTimeout(4000);

                    const hasSuggest = await page.evaluate(() => !!document.querySelector('button.btn-suggest'));
                    if (hasSuggest) {
                        socket.emit('log', { type: 'info', msg: `[Hesap ${id}] İsim önerisi seçiliyor...` });
                        await page.evaluate(() => document.querySelector('button.btn-suggest')?.click());
                        await page.waitForTimeout(2000);
                        await page.evaluate(() => document.querySelector('button#submit-managername')?.click());
                    }

                    // 6. E-postayı enjekte et
                    await page.waitForSelector('input#email', { state: 'attached', timeout: 15000 });
                    await page.evaluate(({email}) => {
                        const el = document.querySelector('input#email');
                        if (el) {
                            el.value = email;
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }, { email: account.email });
                    await page.waitForTimeout(2000);
                    await page.evaluate(() => document.querySelector('button#submit-email')?.click());

                    socket.emit('log', { type: 'info', msg: `[Hesap ${id}] Kod bekleniyor...` });
                    const code = await mailer.waitForCode(account.token);
                    
                    if (code) {
                        socket.emit('log', { type: 'success', msg: `[Hesap ${id}] Kod yakalandı: ${code}` });
                        await page.waitForSelector('input#ssoCode', { state: 'attached' });
                        await page.evaluate(({c}) => {
                            const el = document.querySelector('input#ssoCode');
                            if (el) {
                                el.value = c;
                                el.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }, { c: code });
                        await page.evaluate(() => document.querySelector('button#submit-ssoCode')?.click());
                        
                        await page.waitForTimeout(5000);
                        totalCompleted++;
                        socket.emit('progress', { count: totalCompleted, msg: `Hesap ${totalCompleted}/10 tamam.` });
                        socket.emit('log', { type: 'success', msg: `[Hesap ${id}] İşlem başarılı!` });
                    }
                } catch (err) {
                    socket.emit('log', { type: 'error', msg: `[Hesap ${id}] Hata: ${err.message}` });
                } finally {
                    await context.close();
                }
            }

            // Batch bazlı paralel çalıştırma
            for (let i = 0; i < totalTarget; i += batchSize) {
                const batch = [];
                for (let j = 0; j < batchSize && (i + j) < totalTarget; j++) {
                    batch.push(createSingleAccount(i + j + 1));
                }
                await Promise.all(batch);
                socket.emit('log', { type: 'system', msg: `Grup tamamlandı, sıradaki gruba geçiliyor...` });
            }

            socket.emit('finished');
        } catch (err) {
            socket.emit('log', { type: 'error', msg: 'Kritik hata: ' + err.message });
        } finally {
            await browser.close();
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const path = require('path');

module.exports = {
    browser: {
        headed: false, // Railway için false, yerel test için true yapabilirsiniz
        timeout: 30000,
        viewport: { width: 1280, height: 720 },
        // Proxy Ayarları (Opsiyonel)
        // Kullanmak için server kısmını 'http://ip:port' şeklinde doldurun
        proxy: {
            server: '', // Örn: 'http://1.2.3.4:8080'
            username: '', 
            password: ''
        }
    },
    delay: {
        min: 2000,
        max: 5000
    },
    paths: {
        screenshots: path.join(__dirname, '../../logs/screenshots')
    },
    registration: {
        selectors: {
            // Hem "Accept" hem "Kabul et" metinlerini kapsar
            acceptBtn: 'button.btn-new.btn-orange:has-text("Accept"), button.btn-new.btn-orange:has-text("Kabul et")',
            
            // Sınıf bazlı (dil bağımsız)
            signupEmailBtn: 'button.btn-new.btn-sso.btn-wide.btn-orange',
            
            usernameInput: '#managername',
            usernameSubmit: '#submit-managername',
            
            emailInput: '#email',
            emailSubmit: '#submit-email',
            
            suggestBtn: '.btn-suggest, button:has-text("Suggest"), button:has-text("Öner")'
        }
    }
};

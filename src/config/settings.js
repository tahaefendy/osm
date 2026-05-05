const path = require('path');

module.exports = {
    browser: {
        headed: false, // Railway için false, yerel test için true yapabilirsiniz
        timeout: 30000,
        viewport: { width: 1280, height: 720 }
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
            // Span içeriğine göre iki dilde kontrol
            acceptBtn: 'button.btn-new.btn-orange:has(span:has-text("Accept")), button.btn-new.btn-orange:has(span:has-text("Kabul et"))',
            signupEmailBtn: 'button.btn-sso:has(span:has-text("Sign up with email")), button.btn-sso:has(span:has-text("E-postayla kaydol"))',
            
            usernameInput: '#managername',
            usernameSubmit: '#submit-managername', // Hesap oluştur
            
            emailInput: '#email',
            emailSubmit: '#submit-email', // Kod gönder
            
            suggestBtn: '.btn-suggest, button:has-text("Suggest"), button:has-text("Öner")'
        }
    }
};

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
            acceptBtn: 'button.btn-new.btn-orange:has-text("Accept")',
            signupEmailBtn: 'button.btn-new.btn-sso.btn-wide.btn-orange',
            usernameInput: '#managername',
            usernameSubmit: '#submit-managername',
            emailInput: '#email',
            emailSubmit: '#submit-email',
            suggestBtn: '.btn-suggest' // Opsiyonel: Kullanıcı adı doluysa öneri butonu
        }
    }
};

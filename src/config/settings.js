const path = require('path');

module.exports = {
    browser: {
        headed: true,
        timeout: 30000,
        viewport: { width: 1280, height: 720 }
    },
    delay: {
        min: 1000,
        max: 3000
    },
    paths: {
        screenshots: path.join(__dirname, '../../logs/screenshots')
    },
    registration: {
        selectors: {
            acceptBtn: 'button.btn-new.btn-orange:has-text("Accept")',
            signupEmailBtn: 'button.btn-new.btn-sso.btn-wide.btn-orange:has-text("Sign up with email")',
            usernameInput: '#managername',
            usernameSubmit: '#submit-managername',
            emailInput: '#email',
            emailSubmit: '#submit-email'
        }
    }
};

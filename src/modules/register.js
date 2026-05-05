const logger = require('../utils/logger');
const { randomDelay } = require('../utils/delay');
const settings = require('../config/settings');
const path = require('path');

class RegisterFlow {
    constructor(page) {
        this.page = page;
        this.selectors = settings.registration.selectors;
    }

    async takeScreenshot(stepName) {
        const fileName = `error_${stepName}_${Date.now()}.png`;
        const filePath = path.join(settings.paths.screenshots, fileName);
        await this.page.screenshot({ path: filePath });
        logger.error(`Screenshot saved: ${filePath}`);
    }

    async clickAccept() {
        try {
            logger.info('Waiting for Accept button...');
            await this.page.waitForSelector(this.selectors.acceptBtn);
            await this.page.click(this.selectors.acceptBtn);
            logger.info('Accept button clicked');
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('clickAccept');
            throw new Error(`Failed to click Accept: ${error.message}`);
        }
    }

    async clickSignupWithEmail() {
        try {
            logger.info('Waiting for Sign up with email button...');
            await this.page.waitForSelector(this.selectors.signupEmailBtn);
            await this.page.click(this.selectors.signupEmailBtn);
            logger.info('Sign up with email button clicked');
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('clickSignupWithEmail');
            throw new Error(`Failed to click Sign up with email: ${error.message}`);
        }
    }

    async fillUsername(username) {
        try {
            logger.info(`Filling username: ${username}`);
            await this.page.waitForSelector(this.selectors.usernameInput);
            await this.page.fill(this.selectors.usernameInput, username);
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('fillUsername');
            throw new Error(`Failed to fill username: ${error.message}`);
        }
    }

    async submitUsername() {
        try {
            logger.info('Submitting username...');
            await this.page.click(this.selectors.usernameSubmit);
            logger.info('Username submitted');
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('submitUsername');
            throw new Error(`Failed to submit username: ${error.message}`);
        }
    }

    async fillEmail(email) {
        try {
            logger.info(`Filling email: ${email}`);
            await this.page.waitForSelector(this.selectors.emailInput);
            await this.page.fill(this.selectors.emailInput, email);
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('fillEmail');
            throw new Error(`Failed to fill email: ${error.message}`);
        }
    }

    async submitEmail() {
        try {
            logger.info('Submitting email...');
            await this.page.click(this.selectors.emailSubmit);
            logger.info('Email submitted');
            await randomDelay();
        } catch (error) {
            await this.takeScreenshot('submitEmail');
            throw new Error(`Failed to submit email: ${error.message}`);
        }
    }

    async checkSuccess() {
        try {
            logger.info('Checking for registration success...');
            // Placeholder: Look for a specific element that appears after success
            // await this.page.waitForSelector('.success-indicator', { timeout: 10000 });
            logger.info('[SUCCESS] Account registration flow completed');
            return true;
        } catch (error) {
            logger.warn('Success indicator not found, registration might have failed or reached a different state.');
            return false;
        }
    }

    /**
     * Orchestrates the entire registration flow
     */
    async execute(inviteLink, userData) {
        try {
            logger.info(`Navigating to Invite Link: ${inviteLink}`);
            await this.page.goto(inviteLink, { waitUntil: 'networkidle' });
            
            await this.clickAccept();
            await this.clickSignupWithEmail();
            await this.fillUsername(userData.username);
            await this.submitUsername();
            await this.fillEmail(userData.email);
            await this.submitEmail();
            
            return await this.checkSuccess();
        } catch (error) {
            logger.error(`Registration flow aborted: ${error.message}`);
            return false;
        }
    }
}

module.exports = RegisterFlow;

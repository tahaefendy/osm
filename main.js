const readline = require('readline');
const sessionManager = require('./src/core/session');
const browserManager = require('./src/core/browser');
const RegisterFlow = require('./src/modules/register');
const { logout } = require('./src/modules/logout');
const { generateUsername } = require('./src/modules/usernameGenerator');
const { generateEmail } = require('./src/utils/emailGenerator');
const logger = require('./src/utils/logger');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Main execution entry point
 */
async function main() {
    console.clear();
    logger.info('=== OSM Professional Automation System ===');

    try {
        // 1. Get inputs from terminal
        const inviteLink = await askQuestion('Invite Link: ');
        const countStr = await askQuestion('Account Count: ');
        const accountCount = parseInt(countStr) || 1;

        if (!inviteLink) {
            logger.error('Invite link is required!');
            process.exit(1);
        }

        // 2. Main Loop
        for (let i = 0; i < accountCount; i++) {
            logger.info(`\n--- Starting Account ${i + 1}/${accountCount} ---`);
            
            const context = await sessionManager.createContext();
            const page = await context.newPage();
            
            const username = generateUsername();
            const email = generateEmail(username);
            
            const registerFlow = new RegisterFlow(page);
            const success = await registerFlow.execute(inviteLink, { username, email });
            
            if (success) {
                logger.info(`[SUCCESS] Account created: ${username} (${email})`);
                await logout(page);
            } else {
                logger.warn(`[FAILED] Registration failed for ${username}`);
            }

            await sessionManager.closeContext(context);
        }

    } catch (error) {
        logger.error(`Critical Error: ${error.message}`);
    } finally {
        await browserManager.close();
        rl.close();
        logger.info('=== Automation Finished ===');
    }
}

// Start
main();

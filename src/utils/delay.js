const settings = require('../config/settings');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomDelay = async () => {
    const ms = Math.floor(Math.random() * (settings.delay.max - settings.delay.min + 1) + settings.delay.min);
    await delay(ms);
};

module.exports = { delay, randomDelay };

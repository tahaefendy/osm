const settings = require('../config/settings');

/**
 * Belirtilen aralıkta rastgele bir süre bekler.
 */
const randomDelay = async (min = settings.delay.min, max = settings.delay.max) => {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
};

module.exports = { randomDelay };

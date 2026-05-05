/**
 * Basit ve profesyonel loglama sistemi.
 */
const logger = {
    info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
    success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
    warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
    error: (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
    system: (msg) => console.log(`\x1b[35m[SYSTEM]\x1b[0m ${msg}`)
};

module.exports = logger;

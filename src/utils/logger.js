const logger = {
    info: (message) => console.log(`[INFO] [${new Date().toLocaleTimeString()}] ${message}`),
    error: (message) => console.error(`[ERROR] [${new Date().toLocaleTimeString()}] ${message}`),
    warn: (message) => console.warn(`[WARN] [${new Date().toLocaleTimeString()}] ${message}`),
};

module.exports = logger;

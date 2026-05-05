const generateEmail = (username) => {
    const domains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(Math.random() * 999);
    
    return `${cleanUsername}${randomNum}@${randomDomain}`;
};

module.exports = { generateEmail };

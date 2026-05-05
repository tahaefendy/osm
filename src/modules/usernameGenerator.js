const generateUsername = (prefix = '') => {
    const adjectives = ['Cool', 'Swift', 'Dark', 'Golden', 'Epic', 'Ghost', 'Silent', 'Mighty', 'Brave', 'Wild'];
    const nouns = ['Player', 'Runner', 'Gamer', 'Striker', 'Shadow', 'Warrior', 'Knight', 'Falcon', 'Tiger', 'Wolf'];
    
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 9999);
    
    return `${prefix}${randomAdj}${randomNoun}${randomNumber}`;
};

module.exports = { generateUsername };

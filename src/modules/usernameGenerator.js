/**
 * Rastgele profesyonel kullanıcı adları üretir.
 */
const generateUsername = () => {
    const prefixes = ['Pro', 'King', 'Shadow', 'Master', 'Elite', 'Fast', 'Power'];
    const suffixes = ['Manager', 'Soccer', 'Tactics', 'Winner', 'Star', 'Player'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const randomNum = Math.floor(Math.random() * 9999);
    
    return `${prefix}${suffix}${randomNum}`;
};

module.exports = { generateUsername };

const axios = require('axios');

/**
 * Başarılı kaydı PHP API üzerinden veritabanına iletir.
 */
async function saveRegistration(data) {
    try {
        // Kendi sitenizin URL'si (Hostinger)
        const apiUrl = 'https://kodteslimal.com/api/osm/save-log';
        
        await axios.post(apiUrl, {
            key: data.key,
            userId: data.userId,
            link: data.link,
            username: data.username,
            email: data.email,
            password: data.password
        }, {
            timeout: 10000
        });

        return true;
    } catch (error) {
        console.error('[API_ERROR] Kayıt API üzerinden iletilemedi:', error.message);
        return false;
    }
}

module.exports = {
    saveRegistration
};

const axios = require('axios');

module.exports = [
    {
        name: 'apk',
        category: 'utils',
        description: 'Search APKs',
        usage: '.apk <name>',
        async execute(sock, msg, args) {
            const res = await axios.get('https://eliteprotech-apis.zone.id/apk'); // Note: APK API usually needs search param
            await sock.sendMessage(msg.key.remoteJid, { text: JSON.stringify(res.data) });
        }
    },
    {
        name: 'gitstalk',
        category: 'utils',
        description: 'Stalk Github user',
        usage: '.gitstalk <username>',
        async execute(sock, msg, args) {
            const res = await axios.get(`https://eliteprotech-apis.zone.id/githubstalk?username=${args[0]}`);
            await sock.sendMessage(msg.key.remoteJid, { text: `👤 *${res.data.result.name}*\nBio: ${res.data.result.bio}` });
        }
    },
    {
        name: 'font',
        category: 'utils',
        description: 'Change text font',
        usage: '.font <text>',
        async execute(sock, msg, args) {
            const res = await axios.get(`https://eliteprotech-apis.zone.id/font?text=${encodeURIComponent(args.join(' '))}`);
            await sock.sendMessage(msg.key.remoteJid, { text: res.data.result });
        }
    },
    {
        name: 'ocr',
        category: 'utils',
        description: 'Read text from image',
        usage: '.ocr (reply image)',
        async execute(sock, msg) {
            // OCR-ന് സാധാരണയായി ഇമേജ് ലിങ്ക് അല്ലെങ്കിൽ ഫയൽ വേണം
            await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ OCR feature logic needs image URL.' });
        }
    }
];
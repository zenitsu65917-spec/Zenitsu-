const axios = require('axios');

module.exports = [
    {
        name: 'wallpaper',
        alias: ['wp'],
        category: 'media',
        description: 'Get random wallpapers',
        usage: '.wallpaper',
        async execute(sock, msg) {
            const res = await axios.get('https://eliteprotech-apis.zone.id/wallpaper');
            await sock.sendMessage(msg.key.remoteJid, { image: { url: res.data.result.url }, caption: '🖼️ Wallpaper' });
        }
    },
    {
        name: '4k',
        category: 'media',
        description: 'Search 4K Wallpapers',
        usage: '.4k <query>',
        async execute(sock, msg, args) {
            const res = await axios.get(`https://eliteprotech-apis.zone.id/4kwallpaper?q=${encodeURIComponent(args.join(' '))}&type=search`);
            await sock.sendMessage(msg.key.remoteJid, { image: { url: res.data.result[0].url }, caption: '✨ 4K Wallpaper' });
        }
    }
];
// plugins/find.js – KIRA X MD (Song identification via JerryCoder)
const axios = require('axios');

module.exports = {
    name: 'find',
    alias: ['identify', 'whatsong'],
    category: 'media',
    description: 'Identify song from audio/video URL',
    usage: `${process.env.PREFIX || '.'}find <audio/video URL>`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        let url = (args && Array.isArray(args) ? args.join(' ') : '').trim();

        // If no URL, check if replying to a message with a link
        if (!url) {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted) {
                const text = quoted.conversation || quoted.extendedTextMessage?.text || '';
                const match = text.match(/https?:\/\/[^\s]+/);
                if (match) url = match[0];
            }
        }

        if (!url || !url.startsWith('http')) {
            await sock.sendMessage(jid, { text: '❌ *Provide an audio/video URL or reply to a link*' }, { quoted: msg });
            return;
        }

        await sock.sendMessage(jid, { react: { text: '🎵', key: msg.key } });
        const statusMsg = await sock.sendMessage(jid, { text: `🔍 *Identifying song...*` });

        try {
            const apiUrl = `https://jerrycoder.oggyapi.workers.dev/tool/identify?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, { timeout: 20000 });
            const data = response.data;

            if (data.status !== 'success' || !data.result) {
                throw new Error('No song identified');
            }

            const song = data.result;
            const title = song.title || 'Unknown';
            const artist = song.artist || 'Unknown';
            const album = song.album || 'N/A';
            const release = song.release || 'N/A';
            const cover = song.cover || null;

            const caption = `🎵 *SONG IDENTIFIED*\n\n` +
                `📖 *Title* : ${title}\n` +
                `🎤 *Artist* : ${artist}\n` +
                `💿 *Album* : ${album}\n` +
                `📅 *Release* : ${release}\n\n` +
                `> *KIRA X MD*`;

            if (cover) {
                await sock.sendMessage(jid, { image: { url: cover }, caption });
            } else {
                await sock.sendMessage(jid, { text: caption });
            }

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
            await sock.sendMessage(jid, { text: '✅ *Song identified*', edit: statusMsg.key });
        } catch (err) {
            console.error('Find error:', err);
            await sock.sendMessage(jid, { text: '❌ *Could not identify song*', edit: statusMsg.key });
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
        }
    }
};
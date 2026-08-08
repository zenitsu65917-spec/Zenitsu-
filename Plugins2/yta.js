const axios = require('axios');

module.exports = {
    name: 'yta',
    alias: ['ytmp3', 'play', 'ytaudio'],
    category: 'downloader',
    description: 'Download YouTube Audio (MP3)',
    usage: '.yta <URL>',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        let url = (args || []).join(' ').trim();

        const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
                            msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo;
        const quoted = contextInfo?.quotedMessage;

        // റിപ്ലൈ ചെയ്ത മെസ്സേജിൽ നിന്ന് ലിങ്ക് എടുക്കാൻ
        if (!url && quoted) {
            const rawText = quoted.conversation || quoted.extendedTextMessage?.text || 
                            quoted.imageMessage?.caption || quoted.videoMessage?.caption || '';
            const match = rawText.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/i);
            if (match) url = match[0];
        }

        // ലിങ്ക് വാലിഡ് ആണോ എന്ന് നോക്കുന്നു
        if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
            return await sock.sendMessage(jid, { 
                text: "❌ *Please provide a valid YouTube URL or reply to a link!*" 
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });

        // 🛠️ നീ തന്ന പുതിയ API ലിസ്റ്റുകൾ ഇവിടെ ആഡ് ചെയ്തു
        const apis = [
            `https://xenoytdl-2.vercel.app/api/youtube?url=${encodeURIComponent(url)}`,
            `https://jerrycoder.oggyapi.workers.dev/down/ytmp3-v1?url=${encodeURIComponent(url)}`,
            `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`,
            `https://eliteprotech-apis.zone.id/ytdown?format=mp3&url=${encodeURIComponent(url)}`
        ];

        try {
            let audioUrl = null;
            let title = "ZENITSU BOT";

            for (const api of apis) {
                try {
                    const { data } = await axios.get(api, { timeout: 15000 });
                    
                    // എല്ലാ API-കളുടെയും റെസ്പോൺസ് രീതികൾ ഒരൊറ്റ ലൈനിൽ ചെക്ക് ചെയ്യുന്നു
                    audioUrl = data?.data?.dl || data?.data?.url || data?.result?.download_url || data?.result?.url || data?.url || data?.download || data?.audio;
                    
                    if (data?.title || data?.data?.title || data?.result?.title) {
                        title = data.title || data.data.title || data.result.title;
                    }

                    // ലിങ്ക് വർക്കിംഗ് ആണോ എന്ന് നോക്കുന്നു
                    if (audioUrl && audioUrl.startsWith('http')) {
                        const check = await axios.head(audioUrl, { timeout: 5000, validateStatus: () => true });
                        if (check.status === 200) {
                            console.log('✅ API worked:', api);
                            break;
                        }
                        audioUrl = null;
                    }
                } catch (e) { 
                    console.log('API Failed, trying next...', api);
                    continue; 
                }
            }

            if (!audioUrl) throw new Error('Audio URL not found from any APIs');

            // ഫൈനൽ MP3 ഓഡിയോ അയക്കുന്നു
            await sock.sendMessage(jid, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mpeg', 
                ptt: false, 
                fileName: `${title}.mp3`
            }, { quoted: msg });
            
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error('YTA Error:', err.message);
            await sock.sendMessage(jid, { 
                text: `❌ *Failed to download audio! API issue.*` 
            }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
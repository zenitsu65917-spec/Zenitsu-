module.exports = {
    name: "alive",
    category: "main",
    desc: "Bot status",

    async execute(sock, msg) {
        // Uptime കാൽക്കുലേറ്റ് ചെയ്യുന്നു
        const ms = Date.now() - (global.startTime || Date.now());
        const d = Math.floor(ms / (24 * 60 * 60 * 1000));
        const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        const s = Math.floor((ms % (60 * 1000)) / 1000);
        const uptime = `${d}d ${h}h ${m}m ${s}s`;

        // 1. വോയിസ് നോട്ട് അയക്കുന്നു (ptt: true കൊടുത്താൽ വോയിസ് ആയിട്ട് പോകും)
        await sock.sendMessage(msg.key.remoteJid, {
            audio: { url: "https://files.catbox.moe/lq7oeq.tmp" },
            mimetype: "audio/mp4",
            ptt: true 
        }, { quoted: msg });

        // 2. അലൈവ് മെസ്സേജ് അയക്കുന്നു
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: `*I'm Alive Senpai!* 🩸\n\n*Running for:* ${uptime}`
            },
            { quoted: msg }
        );
    }
};
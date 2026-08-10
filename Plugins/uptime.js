// plugins/uptime.js
module.exports = {
    name: "uptime",
    alias: ["runtime", "status"],
    category: "info",
    description: "Check bot running time",
    async execute(sock, msg) {
        const getUptime = (ms) => {
            const days = Math.floor(ms / (24 * 60 * 60 * 1000));
            const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((ms % (60 * 1000)) / 1000);
            
            let str = "";
            if (days > 0) str += `${days}d `;
            if (hours > 0) str += `${hours}h `;
            if (minutes > 0) str += `${minutes}m `;
            str += `${seconds}s`;
            return str;
        };

        const ms = Date.now() - global.startTime;
        const uptime = getUptime(ms);

        await sock.sendMessage(msg.key.remoteJid, { 
            text: `╭──『 ⏱️ *UPTIME* 』──⊷\n│\n│ ➢ *${uptime}*\n│\n╰──────────────⊷` 
        }, { quoted: msg });
    }
};
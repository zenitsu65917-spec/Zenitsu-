const axios = require("axios");

module.exports = {
    name: "fb",
    alias: ["facebook"],
    category: "downloader",
    description: "Download Facebook videos",
    usage: `${process.env.PREFIX || '.'}fb <url> (or reply to a message with URL)`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        // ─── Get URL from args or reply ───
        let url = args.join(" ").trim();

        if (!url) {
            // Check if replying to a message
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted) {
                const quotedText =
                    quoted.conversation ||
                    quoted.extendedTextMessage?.text ||
                    "";
                const match = quotedText.match(/https?:\/\/[^\s]+/);
                if (match) url = match[0];
            }
        }

        if (!url) {
            return sock.sendMessage(jid, {
                text: `❌ *Missing URL*\n\n➤ ${process.env.PREFIX || '.'}fb <url>\n➤ Or reply to a message containing a Facebook link.`
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(jid, {
                react: { text: "⏳", key: msg.key }
            });

            // ─── Primary API ───
            let apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/fbdl?url=${encodeURIComponent(url)}`;
            let response = await axios.get(apiUrl, { timeout: 15000 });
            let data = response.data;

            // ─── Fallback API if primary fails ───
            if (!data?.data?.high && !data?.result?.high) {
                console.log("Primary API failed, trying fallback...");
                const fallbackUrl = `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`;
                response = await axios.get(fallbackUrl, { timeout: 15000 });
                data = response.data;
            }

            // ─── Extract video URL ───
            const video =
                data?.data?.high ||
                data?.data?.hd ||
                data?.data?.sd ||
                data?.result?.high ||
                data?.result?.hd ||
                data?.result?.sd ||
                data?.url ||
                data?.video ||
                data?.download;

            if (!video) throw new Error("No video found");

            // ─── Extract caption ───
            const caption =
                data?.data?.caption ||
                data?.result?.caption ||
                data?.data?.title ||
                data?.result?.title ||
                "📘 Facebook Video";

            await sock.sendMessage(jid, {
                video: { url: video },
                caption: `${caption}\n\n> *Downloaded by KIRA X MD*`
            }, { quoted: msg });

            await sock.sendMessage(jid, {
                react: { text: "✅", key: msg.key }
            });

        } catch (err) {
            console.error("FB error:", err);
            await sock.sendMessage(jid, {
                text: `❌ *Download Failed*\n\n${err.message || "Please try again later."}`
            }, { quoted: msg });
            await sock.sendMessage(jid, {
                react: { text: "❌", key: msg.key }
            });
        }
    }
};
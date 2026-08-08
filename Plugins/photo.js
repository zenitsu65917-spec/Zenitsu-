const sharp = require("sharp");
const { getBuffer } = require("../lib/functions");

module.exports = {
    name: "photo",
    category: "sticker",
    desc: "Convert sticker to image",

    async execute(sock, msg) {

        const quoted =
            msg.message?.extendedTextMessage?.contextInfo;

        if (!quoted?.quotedMessage?.stickerMessage) {
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "❌ Reply to a sticker."
                }
            );
        }

        try {

            const status = await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "⚡ Converting..."
                }
            );

            const mediaMsg = {
                key: {
                    remoteJid: msg.key.remoteJid
                },
                message: quoted.quotedMessage
            };

            const buffer = await getBuffer(mediaMsg);

            const imageBuffer = await sharp(buffer)
                .png()
                .toBuffer();

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    image: imageBuffer,
                    caption: "🖼️ Converted by ZENITSU BOT"
                }
            );

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "✅ Converted",
                    edit: status.key
                }
            );

        } catch (err) {

            console.log(err);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "❌ Conversion failed."
                }
            );
        }
    }
};
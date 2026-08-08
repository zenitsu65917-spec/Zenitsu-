module.exports = {
    name: "owner",
    alias: ["creator", "developer", "admin"],
    category: "general",
    description: "Get Bot Owner Information",
    usage: `${process.env.PREFIX || '.'}owner`,

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;

        // 1. ഓണറെ കുറിച്ചുള്ള ഒരു ചെറിയ മെസ്സേജ്
        const infoText = `👑 *ZENITSU BOT- OWNER INFO* 👑\n\n` +
            `👤 *Name:* Sayanth\n` +
            `📱 *Number:* +91 9074196526\n` +
            `💻 *Role:* Developer & Bot Owner\n\n` +
            `> *Feel free to contact for bot queries!*`;

        await sock.sendMessage(jid, { text: infoText }, { quoted: msg });

        // 2. VCard (Contact Card) അയക്കുന്നു
        const vcard = 'BEGIN:VCARD\n'
            + 'VERSION:3.0\n'
            + 'FN:Sayanth\n' // Name
            + 'ORG: ZENITSU BOT Owner\n'
            + 'TEL;type=CELL;type=VOICE;waid=919188252308:+91 91882 52308\n' // Number
            + 'END:VCARD';

        await sock.sendMessage(jid, {
            contacts: {
                displayName: 'Sayanth',
                contacts: [{ displayName: 'Sayanth', vcard }]
            }
        }, { quoted: msg });
    }
};
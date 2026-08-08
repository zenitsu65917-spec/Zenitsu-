module.exports = {
    name: "settings",
    category: "owner",
    description: "Bot settings panel",

    async execute(sock, msg, args, isOwner) {

        const jid = msg.key.remoteJid;

        if (!isOwner) {
            return await sock.sendMessage(
                jid,
                { text: "❌ *Owner only!*" },
                { quoted: msg }
            );
        }

        const text = `
⚙️ *BOT SETTINGS*

1. Bot Mode        : ${global.botMode === "public" ? "Public" : "Private"}
2. Auto DL Groups  : ${global.autoDlAllGroups ? "ON" : "OFF"}
3. Auto DL DM      : ${global.autoDlAllDms ? "ON" : "OFF"}
4. Anti Delete     : ${global.antiDeleteChats.includes(jid) ? "ON" : "OFF"}
5. Welcome         : ${global.welcomeChats.includes(jid) ? "ON" : "OFF"}
6. Goodbye         : ${global.goodbyeChats.includes(jid) ? "ON" : "OFF"}
7. Anti Link       : ${global.antilinkChats.includes(jid) ? "ON" : "OFF"}
8. Call Reject     : ${global.callReject ? "ON" : "OFF"}
9. Bot Online      : ${global.botOnline ? "ON" : "OFF"}
10. Auto Read      : ${global.autoRead ? "ON" : "OFF"}
11. Auto React     : ${global.autoReact ? "ON" : "OFF"}
12. Auto Reply     : ${global.autoReply ? "ON" : "OFF"}
13. Auto VV        : ${global.autoVV ? "ON" : "OFF"}
14. Auto Sticker   : ${global.autoSticker ? "ON" : "OFF"}
15. Without Handler : ${global.withoutHandler ? "ON" : "OFF"}

📌 Reply to this message

Example:
4 on
4 off
`;

        const sent = await sock.sendMessage(
            jid,
            { text },
            { quoted: msg }
        );

        global.settingsReplies = global.settingsReplies || {};

        global.settingsReplies[sent.key.id] = true;
    }
};
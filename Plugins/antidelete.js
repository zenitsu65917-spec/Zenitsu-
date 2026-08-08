module.exports = {
    name: "antidelete",
    alias: ["ad"],
    category: "owner",

    async execute(sock, msg, args) {

        const jid = msg.key.remoteJid;

        global.antiDeleteChats = global.antiDeleteChats || [];

        const action = (args[0] || "").toLowerCase();

        if (action === "on") {

            if (!global.antiDeleteChats.includes(jid)) {
                global.antiDeleteChats.push(jid);
            }

            return sock.sendMessage(jid, {
                text: "✅ AntiDelete Enabled"
            }, { quoted: msg });
        }

        if (action === "off") {

            global.antiDeleteChats =
                global.antiDeleteChats.filter(x => x !== jid);

            return sock.sendMessage(jid, {
                text: "❌ AntiDelete Disabled"
            }, { quoted: msg });
        }

        return sock.sendMessage(jid, {
            text:
`*ANTI DELETE*

.antidelete on
.antidelete off`
        }, { quoted: msg });
    }
};
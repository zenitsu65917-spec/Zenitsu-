module.exports = {
    name: "antilink",
    alias: ["alink"],
    category: "group",
    description: "Manage Anti-Link",

    async execute(sock, msg, args, isOwner) {

        const jid = msg.key.remoteJid;

        if (!jid.endsWith("@g.us")) {
            return sock.sendMessage(
                jid,
                {
                    text: "❌ Group only command!"
                },
                { quoted: msg }
            );
        }

        const sender =
            msg.key.participant ||
            msg.participant;

        const metadata =
            await sock.groupMetadata(jid);

        const isAdmin =
            metadata.participants.some(
                p =>
                    p.id === sender &&
                    (
                        p.admin === "admin" ||
                        p.admin === "superadmin"
                    )
            );

        if (!isAdmin && !isOwner) {
            return sock.sendMessage(
                jid,
                {
                    text: "❌ Admin only!"
                },
                { quoted: msg }
            );
        }

        global.antilinkChats =
            global.antilinkChats || [];

        global.antilinkMode =
            global.antilinkMode || {};

        const action =
            (args[0] || "").toLowerCase();

        const mode =
            (args[1] || "delete")
                .toLowerCase();

        // .antilink on
        if (action === "on") {

            if (
                !["warn", "delete", "kick"]
                    .includes(mode)
            ) {
                return sock.sendMessage(
                    jid,
                    {
                        text:
`❌ Invalid mode!

Example:
.antilink on warn
.antilink on delete
.antilink on kick`
                    },
                    { quoted: msg }
                );
            }

            if (
                !global.antilinkChats.includes(jid)
            ) {
                global.antilinkChats.push(jid);
            }

            global.antilinkMode[jid] =
                mode;

            return sock.sendMessage(
                jid,
                {
                    text:
`✅ AntiLink Enabled

Mode: ${mode.toUpperCase()}`
                },
                { quoted: msg }
            );
        }

        // .antilink off
        if (action === "off") {

            global.antilinkChats =
                global.antilinkChats.filter(
                    x => x !== jid
                );

            delete global.antilinkMode[jid];

            return sock.sendMessage(
                jid,
                {
                    text:
"❌ AntiLink Disabled"
                },
                { quoted: msg }
            );
        }

        // Menu
        return sock.sendMessage(
            jid,
            {
                text:
`╭━━━〔 ANTILINK 〕━━━⬣

.antilink on
.antilink on warn
.antilink on delete
.antilink on kick
.antilink off

╰━━━━━━━━━━━━━━⬣`
            },
            { quoted: msg }
        );
    }
};
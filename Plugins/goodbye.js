module.exports = {
    name: 'goodbye',
    category: 'group',
    description: 'Toggle and set goodbye messages',
    
    async execute(sock, msg, args, isOwner) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) return await sock.sendMessage(jid, { text: "❌ *This command can only be used in groups!*" }, { quoted: msg });

        // 🚨 Admin Check
        const sender = msg.key.participant || msg.key.remoteJid;
        const groupMetadata = await sock.groupMetadata(jid);
        const isAdmin = groupMetadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (!isAdmin && !isOwner) return await sock.sendMessage(jid, { text: "❌ *Group Admins only!*" }, { quoted: msg });

        global.goodbyeChats = global.goodbyeChats || [];
        global.goodbyeMessages = global.goodbyeMessages || {}; // Custom message store
        
        const action = (args[0] || "").toLowerCase();

        if (action === "on") {
            if (!global.goodbyeChats.includes(jid)) global.goodbyeChats.push(jid);
            return sock.sendMessage(jid, { text: "✅ *Goodbye Message Enabled!*" }, { quoted: msg });
        }

        if (action === "off") {
            global.goodbyeChats = global.goodbyeChats.filter(x => x !== jid);
            return sock.sendMessage(jid, { text: "❌ *Goodbye Message Disabled!*" }, { quoted: msg });
        }

        if (action === "set") {
            const customMsg = args.slice(1).join(" ");
            if (!customMsg) return sock.sendMessage(jid, { text: "❌ *Please provide a message!*\n_Example: .goodbye set Bye bye @user!_" }, { quoted: msg });
            
            global.goodbyeMessages[jid] = customMsg;
            return sock.sendMessage(jid, { text: "✅ *Custom Goodbye Message Set!*\n_(Don't forget to turn it on using .goodbye on)_" }, { quoted: msg });
        }

        if (action === "reset") {
            delete global.goodbyeMessages[jid];
            return sock.sendMessage(jid, { text: "✅ *Goodbye Message reset to default!*" }, { quoted: msg });
        }

        return sock.sendMessage(jid, { 
            text: `*👋 GOODBYE SYSTEM*\n\n.goodbye on\n.goodbye off\n.goodbye set <message>\n.goodbye reset\n\n*Note:* Use *@user* in your custom message to tag the member.` 
        }, { quoted: msg });
    }
};
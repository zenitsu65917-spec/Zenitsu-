module.exports = {
    name: 'welcome',
    category: 'group',
    description: 'Toggle and set welcome messages',
    
    async execute(sock, msg, args, isOwner) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) return await sock.sendMessage(jid, { text: "❌ *This command can only be used in groups!*" }, { quoted: msg });

        // 🚨 Admin Check
        const sender = msg.key.participant || msg.key.remoteJid;
        const groupMetadata = await sock.groupMetadata(jid);
        const isAdmin = groupMetadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (!isAdmin && !isOwner) return await sock.sendMessage(jid, { text: "❌ *Group Admins only!*" }, { quoted: msg });

        global.welcomeChats = global.welcomeChats || [];
        global.welcomeMessages = global.welcomeMessages || {}; // Custom message store
        
        const action = (args[0] || "").toLowerCase();

        if (action === "on") {
            if (!global.welcomeChats.includes(jid)) global.welcomeChats.push(jid);
            return sock.sendMessage(jid, { text: "✅ *Welcome Message Enabled!*" }, { quoted: msg });
        }

        if (action === "off") {
            global.welcomeChats = global.welcomeChats.filter(x => x !== jid);
            return sock.sendMessage(jid, { text: "❌ *Welcome Message Disabled!*" }, { quoted: msg });
        }

        if (action === "set") {
            const customMsg = args.slice(1).join(" ");
            if (!customMsg) return sock.sendMessage(jid, { text: "❌ *Please provide a message!*\n_Example: .welcome set Hello @user, welcome to our group!_" }, { quoted: msg });
            
            global.welcomeMessages[jid] = customMsg;
            return sock.sendMessage(jid, { text: "✅ *Custom Welcome Message Set!*\n_(Don't forget to turn it on using .welcome on)_" }, { quoted: msg });
        }

        if (action === "reset") {
            delete global.welcomeMessages[jid];
            return sock.sendMessage(jid, { text: "✅ *Welcome Message reset to default!*" }, { quoted: msg });
        }

        return sock.sendMessage(jid, { 
            text: `*👋 WELCOME SYSTEM*\n\n.welcome on\n.welcome off\n.welcome set <message>\n.welcome reset\n\n*Note:* Use *@user* in your custom message to tag the new member.` 
        }, { quoted: msg });
    }
};
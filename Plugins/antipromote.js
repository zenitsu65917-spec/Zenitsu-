// plugins/antipromote.js – KIRA X MD (Anti-Promote & Anti-Demote)
global.antiPromoteChats = global.antiPromoteChats || [];
global.antiDemoteChats = global.antiDemoteChats || [];

const recentActions = {};

function shouldProcess(jid, action, authorPhone) {
    const now = Date.now();
    const key = `${jid}_${action}_${authorPhone}`;
    if (recentActions[key] && (now - recentActions[key] < 5000)) return false;
    recentActions[key] = now;
    return true;
}

function getPhoneFromJid(jid) {
    if (!jid) return '';
    return jid.split('@')[0].replace(/[^0-9]/g, '');
}

function isOwnerJid(authorPhone) {
    const ownerPhone = process.env.BOT_NUMBER ? process.env.BOT_NUMBER.replace(/[^0-9]/g, '') : '';
    return authorPhone === ownerPhone;
}

function isSudoJid(authorPhone) {
    const sudoUsers = global.sudoUsers || [];
    return sudoUsers.some(s => {
        const sPhone = s.split('@')[0].replace(/[^0-9]/g, '');
        return sPhone === authorPhone;
    });
}

async function getRealAuthor(sock, jid, author) {
    if (!author || !author.includes('@lid')) return author;
    try {
        const meta = await sock.groupMetadata(jid);
        const p = meta.participants.find(x => x.id === author || x.lid === author);
        if (p) {
            if (p.phoneNumber) return p.phoneNumber.includes('@') ? p.phoneNumber : `${p.phoneNumber}@s.whatsapp.net`;
            if (p.id && !p.id.includes('@lid')) return p.id;
        }
    } catch(e) {}
    return author;
}

// ─── COMMAND LOGIC ───
const handleToggle = async (sock, msg, args, isOwner, isPromote) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return await sock.sendMessage(jid, { text: '❌ *Group only!*' }, { quoted: msg });

    const sender = msg.key.participant || jid;
    const groupMeta = await sock.groupMetadata(jid);
    const isAdmin = groupMeta.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
    if (!isAdmin && !isOwner) return await sock.sendMessage(jid, { text: '❌ *Admins only!*' }, { quoted: msg });

    const targetList = isPromote ? global.antiPromoteChats : global.antiDemoteChats;
    const targetName = isPromote ? 'Anti‑Promote' : 'Anti‑Demote';
    const action = (args && args.length) ? args[0].toLowerCase() : '';

    if (action === 'on') {
        if (!targetList.includes(jid)) {
            targetList.push(jid);
            await sock.sendMessage(jid, { text: `✅ *${targetName} enabled*` }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: `⚠️ *Already enabled*` }, { quoted: msg });
        }
    } else if (action === 'off') {
        const idx = targetList.indexOf(jid);
        if (idx !== -1) {
            targetList.splice(idx, 1);
            await sock.sendMessage(jid, { text: `❌ *${targetName} disabled*` }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: `⚠️ *Already disabled*` }, { quoted: msg });
        }
    } else {
        const status = targetList.includes(jid) ? '🟢 ENABLED' : '🔴 DISABLED';
        await sock.sendMessage(jid, { text: `🛡️ *${targetName} Status*\n➤ ${status}\n\nUsage: .${isPromote ? 'antipromote' : 'antidemote'} on/off` }, { quoted: msg });
    }
};

// ─── COMMANDS EXPORT ───
module.exports = [
    {
        name: 'antipromote',
        alias: ['ap'],
        category: 'group',
        description: 'Toggle anti-promote protection',
        usage: '.antipromote on/off',
        async execute(sock, msg, args, isOwner) { await handleToggle(sock, msg, args, isOwner, true); }
    },
    {
        name: 'antidemote',
        alias: ['ad'],
        category: 'group',
        description: 'Toggle anti-demote protection',
        usage: '.antidemote on/off',
        async execute(sock, msg, args, isOwner) { await handleToggle(sock, msg, args, isOwner, false); }
    }
];

// ─── EVENT LISTENER ───
async function initAntiPromoteListener(sock) {
    sock.ev.on('group-participants.update', async (update) => {
        try {
            const jid = update.id;
            const action = update.action;
            const participants = update.participants;
            const rawAuthor = update.author;

            if (action !== 'promote' && action !== 'demote') return;

            const isPromote = (action === 'promote');
            const isProtected = isPromote ? global.antiPromoteChats.includes(jid) : global.antiDemoteChats.includes(jid);
            if (!isProtected) return;

            const realAuthor = await getRealAuthor(sock, jid, rawAuthor);
            const authorPhone = getPhoneFromJid(realAuthor);
            const botPhone = getPhoneFromJid(sock.user.id);
            
            if (authorPhone === botPhone || rawAuthor === sock.user.id) return;
            if (isOwnerJid(authorPhone) || isSudoJid(authorPhone)) return;
            if (!shouldProcess(jid, action, authorPhone)) return;

            const targetUsers = participants.map(p => {
                let num = p.phoneNumber || p.id;
                return num.includes('@') ? num : `${num}@s.whatsapp.net`;
            }).filter(id => id && !id.includes('@lid')); 

            if (targetUsers.length === 0) return;

            const revertAction = isPromote ? 'demote' : 'promote';
            await sock.sendMessage(jid, { 
                text: `🛡️ *Security Alert!*\n@${authorPhone} tried to ${action} users. Reverting...`, 
                mentions: [realAuthor] 
            });

            try {
                await sock.groupParticipantsUpdate(jid, [realAuthor], 'demote'); // കുറ്റവാളിയെ ഡീമോട്ട് ചെയ്യുന്നു
                await sock.groupParticipantsUpdate(jid, targetUsers, revertAction); // ആക്ഷൻ റീവേർട്ട് ചെയ്യുന്നു
            } catch (e) { console.error(e.message); }

        } catch (err) { console.error(err); }
    });
}

module.exports.initAntiPromote = initAntiPromoteListener;
module.exports = {
    name: "ping",

    async execute(sock, msg) {
        const start = Date.now();

        const sent = await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: "⚡ Calculating..."
            }
        );

        const latency = Date.now() - start;

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: `*⚡ ZENITSU Latency:* ${latency}ms`,
                edit: sent.key
            }
        );
    }
};
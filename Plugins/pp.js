const fs = require("fs");

module.exports = {
    name: "pp",
    category: "group",

    async execute(sock,msg,args,isOwner){

        if(!isOwner) return;

        const jid = msg.key.remoteJid;

        const quoted =
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if(!quoted?.imageMessage){
            return sock.sendMessage(jid,{
                text:"❌ Reply to image"
            });
        }

        const buffer =
        await sock.downloadMediaMessage({
            message: quoted
        });

        fs.writeFileSync("./temp.jpg",buffer);

        await sock.updateProfilePicture(
            sock.user.id,
            fs.readFileSync("./temp.jpg")
        );

        fs.unlinkSync("./temp.jpg");

        await sock.sendMessage(jid,{
            text:"✅ Profile Updated"
        });
    }
};
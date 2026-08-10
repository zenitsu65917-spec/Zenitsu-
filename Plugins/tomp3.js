// plugins/tomp3.js - KIRA X MD (Video to MP3 with Metadata & Reply)
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

// വിൻഡോസ് ആണെങ്കിൽ ffmpeg പാത്ത് സെറ്റ് ചെയ്യാം, റെയിൽവേയിൽ ആണെങ്കിൽ ഇത് ഓട്ടോമാറ്റിക് ആയി എടുത്തോളും
const ffmpegPath = path.join(__dirname, '../ffmpeg.exe');
if (fs.existsSync(ffmpegPath)) ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
    name: "tomp3",
    alias: ["mp3", "video2mp3"],
    category: "media",
    description: "Convert replied video to MP3 audio",
    usage: `${process.env.PREFIX || '.'}tomp3 (reply to a video)`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // വീഡിയോയ്ക്ക് റിപ്ലൈ ചെയ്തില്ലെങ്കിൽ
        if (!quoted || !quoted.videoMessage) {
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
            return;
        }

        await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });

        let inputPath, outputPath;
        try {
            // വീഡിയോ ഡൗൺലോഡ് ചെയ്യുന്നു
            const videoBuffer = await downloadMediaMessage(
                { message: quoted },
                "buffer",
                {},
                { logger: console, reuploadRequest: sock.updateMediaMessage }
            );
            if (!videoBuffer || videoBuffer.length < 1000) throw new Error("Video download failed");

            // Temp ഫയലുകൾ സെറ്റ് ചെയ്യുന്നു
            const tempDir = path.join(__dirname, "../temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            inputPath = path.join(tempDir, `video_${Date.now()}.mp4`);
            outputPath = path.join(tempDir, `audio_${Date.now()}.mp3`);
            
            fs.writeFileSync(inputPath, videoBuffer);

            // 🛠️ FFmpeg ഉപയോഗിച്ച് കൺവെർട്ട് ചെയ്യുന്നു + വാട്ടർമാർക്ക് (Metadata) ആഡ് ചെയ്യുന്നു
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .toFormat("mp3")
                    .audioBitrate(128)
                    .outputOptions([
                        '-metadata', 'title=KIRA X MD',  // പാട്ടിന്റെ പേര് (Title)
                        '-metadata', 'artist=Madhav',    // പാടിയ ആൾ/ഉണ്ടാക്കിയത് (Artist)
                        '-metadata', 'album=KIRA Bot'    // ആൽബം പേര് 
                    ])
                    .on("end", resolve)
                    .on("error", reject)
                    .save(outputPath);
            });

            if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1000) throw new Error("Conversion failed");

            const audioBuffer = fs.readFileSync(outputPath);
            
            // 📩 കൺവെർട്ട് ചെയ്ത ഓഡിയോ റിപ്ലൈ ആയി അയക്കുന്നു
            await sock.sendMessage(jid, {
                audio: audioBuffer,
                mimetype: "audio/mpeg",
                ptt: false, // true ആക്കിയാൽ വോയിസ് നോട്ട് ആയി പോകും
                fileName: `KIRA_X_MD_${Date.now()}.mp3`,
            }, { quoted: msg }); // <-- നിന്റെ മെസ്സേജിന് റിപ്ലൈ പോവാൻ ഇതാണ് ചേർത്തത് (quoted: msg)

            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
            
        } catch (err) {
            console.error("toMP3 Error:", err);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        } finally {
            // പ്രോസസ്സ് കഴിഞ്ഞാൽ temp ഫയലുകൾ ഡിലീറ്റ് ആക്കാൻ
            try {
                if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            } catch (e) {
                console.error("Temp file deletion error:", e);
            }
        }
    }
};
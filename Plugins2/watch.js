// plugins/watch.js – KIRA X MD (Anime downloader)
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log("✅ WATCH PLUGIN LOADED");

const userState = {};
const WATERMARK = `\n\n>* KIRA X MD*`;

// ─── Try multiple Gogoanime domains ───
const DOMAINS = [
    'https://gogoanime.gg',
    'https://gogoanime3.co',
    'https://gogoanime.live',
    'https://gogoanime.run'
];

let BASE_URL = DOMAINS[0];

// ─── Search using Gogoanime ───
async function searchAnime(query) {
    for (const domain of DOMAINS) {
        try {
            const url = `${domain}/search.html?keyword=${encodeURIComponent(query)}`;
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                timeout: 10000
            });
            const $ = cheerio.load(data);
            const results = [];

            // Try multiple selectors
            const selectors = [
                '.last_episodes li .img a',
                '.items li .img a',
                '.anime-list a',
                '.film_list .name a',
                '.search-results .result-item a'
            ];

            for (const selector of selectors) {
                $(selector).each((i, el) => {
                    const title = $(el).attr('title') || $(el).text().trim() || '';
                    const href = $(el).attr('href') || '';
                    const id = href.split('/')[2] || '';
                    if (title && id && !results.find(r => r.id === id)) {
                        results.push({ title, id });
                    }
                });
                if (results.length > 0) break;
            }

            if (results.length > 0) {
                BASE_URL = domain;
                console.log(`✅ Using domain: ${domain}, found ${results.length} results`);
                return results;
            }
        } catch (err) {
            console.log(`❌ Domain ${domain} failed:`, err.message);
        }
    }
    return [];
}

// ─── Get anime info ───
async function getAnimeInfo(id) {
    const url = `${BASE_URL}/category/${id}`;
    const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
    });
    const $ = cheerio.load(data);
    const title = $('.anime_info_body_bg h1').text().trim() || id;
    const episodes = [];
    $('.episodes a').each((i, el) => {
        const epLink = $(el).attr('href') || '';
        const epId = epLink.split('/')[2] || '';
        if (epId) episodes.push({ number: i + 1, title: `Episode ${i+1}`, episodeId: epId });
    });
    return { title, episodes };
}

// ─── Get episode URL ───
async function getEpisodeUrl(episodeId) {
    const url = `${BASE_URL}/${episodeId}`;
    const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
    });
    const $ = cheerio.load(data);
    const iframeSrc = $('iframe').attr('src') || '';
    if (!iframeSrc) {
        // Try alternative selector
        const embed = $('.embed-responsive iframe').attr('src') || '';
        if (embed) return embed;
        throw new Error('No video found');
    }
    return iframeSrc;
}

// ─── Download using yt-dlp ───
async function downloadVideo(videoUrl, outputPath) {
    const ytDlpPath = path.join(__dirname, '../yt-dlp.exe');
    const cookiePath = path.join(__dirname, '../cookies.txt');
    const cookieFlag = fs.existsSync(cookiePath) ? ` --cookies "${cookiePath}"` : '';
    const command = `"${ytDlpPath}" -f bestvideo+bestaudio --merge-output-format mp4 -o "${outputPath}" "${videoUrl}"${cookieFlag} --js-runtime node`;
    await execPromise(command, { timeout: 180000 });
}

// ─── Plugin ───────────────────────────────────────────────
module.exports = {
    name: 'watch',
    alias: ['download', 'anime'],
    category: 'downloader',
    description: 'Search and download anime episodes',
    usage: `${process.env.PREFIX || '.'}watch <title>`,

    async execute(sock, msg, args, isOwner) {
        const jid = msg.key.remoteJid;
        const sender = msg.key.participant || jid;
        const query = (args && Array.isArray(args) ? args.join(' ') : '').trim();
        const state = userState[sender];

        try {
            // ── Episode selection ──
            if (query && !isNaN(query) && state && state.step === 'episodes') {
                const num = parseInt(query);
                if (num >= 1 && num <= state.episodes.length) {
                    await downloadEpisode(sock, jid, sender, state.animeInfo, state.episodes[num - 1]);
                    return;
                }
            }

            // ── Episode range ──
            if (query && query.includes('-') && state && state.step === 'episodes') {
                const parts = query.split('-').map(Number);
                if (parts.length === 2) {
                    const start = Math.max(1, parts[0]);
                    const end = Math.min(state.episodes.length, parts[1]);
                    if (start <= end) {
                        await downloadEpisodeRange(sock, jid, sender, state.animeInfo, state.episodes, start, end);
                        return;
                    }
                }
            }

            // ── Pagination ──
            if (query === 'next' && state && state.step === 'episodes') {
                await showEpisodePage(sock, jid, sender, state.animeInfo, state.episodes, (state.currentPage || 1) + 1);
                return;
            }
            if (query === 'prev' && state && state.step === 'episodes') {
                const prev = (state.currentPage || 1) - 1;
                if (prev >= 1) await showEpisodePage(sock, jid, sender, state.animeInfo, state.episodes, prev);
                else await sock.sendMessage(jid, { text: '❌ Already on first page.' });
                return;
            }

            // ── Anime selection from search ──
            if (query && !isNaN(query) && state && state.step === 'search') {
                const num = parseInt(query);
                if (num >= 1 && num <= state.results.length) {
                    const selected = state.results[num - 1];
                    await showAnimeDetails(sock, jid, sender, selected.id);
                    delete userState[sender];
                    return;
                }
            }

            // ── Normal search ──
            if (!query) {
                await sock.sendMessage(jid, {
                    text: `📥 *WATCH DOWNLOADER*\n\n❌ *Missing title*\n➤ Example: ${process.env.PREFIX || '.'}watch Naruto`
                });
                return;
            }

            await sock.sendMessage(jid, { react: { text: "🔍", key: msg.key } });
            const statusMsg = await sock.sendMessage(jid, { text: `🔍 Searching for "${query}"...` });

            const results = await searchAnime(query);
            if (!results || results.length === 0) {
                await sock.sendMessage(jid, { text: `❌ No results for "${query}"\n\nTry a different keyword or use full title.`, edit: statusMsg.key });
                await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
                return;
            }

            userState[sender] = {
                step: 'search',
                results: results.slice(0, 10)
            };

            let msgText = `📥 *SEARCH RESULTS for "${query}"*\n\n`;
            results.slice(0, 10).forEach((anime, i) => {
                msgText += `${i + 1}. ${anime.title}\n`;
            });
            msgText += `\n_Reply with a number (1-${Math.min(10, results.length)}) to see episodes._`;

            await sock.sendMessage(jid, { text: msgText, edit: statusMsg.key });
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
        } catch (err) {
            console.error("❌ Watch error:", err);
            await sock.sendMessage(jid, { text: `❌ Error: ${err.message || 'Something went wrong'}` });
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};

// ─── Show anime details ───
async function showAnimeDetails(sock, jid, sender, animeId) {
    try {
        const info = await getAnimeInfo(animeId);
        if (!info || !info.episodes || info.episodes.length === 0) {
            await sock.sendMessage(jid, { text: '❌ No episodes found for this anime.' });
            return;
        }

        userState[sender] = {
            step: 'episodes',
            animeInfo: info,
            episodes: info.episodes,
            currentPage: 1
        };

        await showEpisodePage(sock, jid, sender, info, info.episodes, 1);
    } catch (err) {
        console.error("Details error:", err);
        await sock.sendMessage(jid, { text: `❌ Failed to fetch details: ${err.message}` });
    }
}

// ─── Show episode page ───
async function showEpisodePage(sock, jid, sender, info, episodes, page) {
    const perPage = 15;
    const totalPages = Math.ceil(episodes.length / perPage);
    if (page < 1 || page > totalPages) return;

    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, episodes.length);
    const pageEpisodes = episodes.slice(start, end);

    if (userState[sender]) userState[sender].currentPage = page;

    let msgText = `📥 *${info.title}*\n`;
    msgText += `📺 *Episodes (${start + 1}-${end} of ${episodes.length})*\n\n`;

    pageEpisodes.forEach((ep, i) => {
        msgText += `${start + i + 1}. ${ep.title}\n`;
    });

    msgText += `\n_Reply with number to download._\n`;
    msgText += `_Reply range (e.g., "5-10") for multiple._\n`;
    if (page > 1) msgText += `_Reply "prev" for previous page._\n`;
    if (page < totalPages) msgText += `_Reply "next" for next page._`;

    await sock.sendMessage(jid, { text: msgText });
}

// ─── Download single episode ───
async function downloadEpisode(sock, jid, sender, info, episode) {
    try {
        await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
        const statusMsg = await sock.sendMessage(jid, { text: `📥 Downloading episode ${episode.number}...` });

        const videoUrl = await getEpisodeUrl(episode.episodeId);
        if (!videoUrl) throw new Error('No video URL');

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const outputPath = path.join(tempDir, `${info.title.replace(/[^a-zA-Z0-9]/g, '_')}_E${episode.number}.mp4`);

        await downloadVideo(videoUrl, outputPath);

        const fileBuffer = fs.readFileSync(outputPath);
        await sock.sendMessage(jid, {
            document: fileBuffer,
            mimetype: 'video/mp4',
            fileName: `${info.title} - Episode ${episode.number}.mp4`,
            caption: `🎬 *${info.title} - Episode ${episode.number}*${WATERMARK}`
        });

        await sock.sendMessage(jid, { text: `✅ *Episode ${episode.number} downloaded!*`, edit: statusMsg.key });
        await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

        fs.unlinkSync(outputPath);
    } catch (err) {
        console.error("Download error:", err);
        await sock.sendMessage(jid, { text: `❌ Download failed: ${err.message}`, edit: statusMsg.key });
        await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
    }
}

// ─── Download episode range ───
async function downloadEpisodeRange(sock, jid, sender, info, episodes, start, end) {
    try {
        await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
        const statusMsg = await sock.sendMessage(jid, { text: `📥 Downloading episodes ${start}-${end}...` });

        for (let i = start - 1; i < end; i++) {
            const ep = episodes[i];
            if (!ep) continue;
            await downloadSingleEpisodeDirect(sock, jid, info, ep);
        }

        await sock.sendMessage(jid, { text: `✅ *All episodes downloaded!*`, edit: statusMsg.key });
        await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
    } catch (err) {
        console.error("Range error:", err);
        await sock.sendMessage(jid, { text: `❌ Failed: ${err.message}`, edit: statusMsg.key });
    }
}

async function downloadSingleEpisodeDirect(sock, jid, info, episode) {
    try {
        const videoUrl = await getEpisodeUrl(episode.episodeId);
        if (!videoUrl) return;

        const tempDir = path.join(__dirname, '../temp');
        const outputPath = path.join(tempDir, `${info.title.replace(/[^a-zA-Z0-9]/g, '_')}_E${episode.number}.mp4`);

        await downloadVideo(videoUrl, outputPath);

        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 10000) {
            const fileBuffer = fs.readFileSync(outputPath);
            await sock.sendMessage(jid, {
                document: fileBuffer,
                mimetype: 'video/mp4',
                fileName: `${info.title} - Episode ${episode.number}.mp4`,
                caption: `🎬 ${info.title} - E${episode.number}${WATERMARK}`
            });
            fs.unlinkSync(outputPath);
        }
    } catch (err) {
        console.error(`Failed E${episode.number}:`, err.message);
    }
}
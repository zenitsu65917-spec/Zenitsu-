const axios = require('axios');
const https = require('https');

// കണക്ഷൻ സ്റ്റേബിൾ ആക്കാനുള്ള കോൺഫിഗറേഷൻ
const api = axios.create({
    httpsAgent: new https.Agent({ keepAlive: true }),
    timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
});

const WATERMARK = `\n\n> *KIRA X MD*`;
const TMDB_API_KEY = '23a935477fba7e0af118d31923dab5d0';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// ─── Utility Functions ───
async function searchMovies(query) {
    const url = `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    const response = await api.get(url);
    return response.data.results || [];
}

async function getMovieDetails(movieId) {
    const url = `${TMDB_BASE}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,similar,videos`;
    const response = await api.get(url);
    return response.data;
}

// ─── Format Function ───
function formatMovieDetails(d) {
    const title = d.title || 'Unknown';
    const year = d.release_date ? d.release_date.split('-')[0] : 'N/A';
    const rating = d.vote_average ? d.vote_average.toFixed(1) : 'N/A';
    const runtime = d.runtime ? `${d.runtime} min` : 'N/A';
    const genres = d.genres ? d.genres.map(g => g.name).join(', ') : 'N/A';
    const overview = d.overview || 'No description available.';
    const poster = d.poster_path ? `${IMAGE_BASE}${d.poster_path}` : null;
    const director = d.credits.crew.find(c => c.job === "Director")?.name || "N/A";
    const cast = d.credits.cast.slice(0, 5).map(a => a.name).join(', ');
    const trailerData = d.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    const trailer = trailerData ? `https://youtube.com/watch?v=${trailerData.key}` : null;
    const similarMovies = d.similar.results.slice(0, 5).map(m => m.title).join(', ');

    return { title, year, rating, runtime, genres, overview, poster, director, cast, trailer, similarMovies };
}

// ─── Main Plugin ───
module.exports = {
    name: 'movie',
    alias: ['movies', 'film'],
    category: 'search',
    description: 'Search movies (TMDB) – details, cast, trailer, similar',
    usage: '.movie <title> or .movie <number>',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const query = args.join(' ').trim();

        // ── Handle Number Selection (Reply/Direct) ──
        if (!isNaN(query) && global._lastMovieSearch?.[jid]) {
            const idx = parseInt(query) - 1;
            const results = global._lastMovieSearch[jid];
            
            if (idx >= 0 && idx < results.length) {
                await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
                try {
                    const details = await getMovieDetails(results[idx].id);
                    const formatted = formatMovieDetails(details);
                    
                    const caption = `🎬 *${formatted.title}* (${formatted.year})\n\n` +
                        `⭐ *IMDb:* ${formatted.rating}/10\n` +
                        `🎭 *Genre:* ${formatted.genres}\n` +
                        `⏱ *Runtime:* ${formatted.runtime}\n` +
                        `🎬 *Director:* ${formatted.director}\n\n` +
                        `📝 *Story:*\n${formatted.overview.substring(0, 200)}...\n\n` +
                        `👥 *Cast:* ${formatted.cast}\n\n` +
                        (formatted.trailer ? `🎥 *Trailer:* ${formatted.trailer}\n\n` : '') +
                        `🍿 *Similar:* ${formatted.similarMovies}` +
                        WATERMARK;

                    if (formatted.poster) {
                        await sock.sendMessage(jid, { image: { url: formatted.poster }, caption: caption }, { quoted: msg });
                    } else {
                        await sock.sendMessage(jid, { text: caption }, { quoted: msg });
                    }
                    await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
                } catch (err) {
                    await sock.sendMessage(jid, { text: `❌ Error fetching details.` });
                }
                return;
            }
        }

        // ── Normal Search ──
        if (!query) return await sock.sendMessage(jid, { text: "⚠️ Use: .movie <movie name>" }, { quoted: msg });

        await sock.sendMessage(jid, { react: { text: "🔍", key: msg.key } });

        try {
            const results = await searchMovies(query);
            if (!results || results.length === 0) return await sock.sendMessage(jid, { text: `❌ No movies found for "${query}"` });

            global._lastMovieSearch = global._lastMovieSearch || {};
            global._lastMovieSearch[jid] = results;

            let msgText = `🎬 *MOVIE SEARCH: "${query}"*\n\n`;
            results.slice(0, 10).forEach((movie, i) => {
                const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
                msgText += `${i+1}. *${movie.title}* (${year})\n`;
            });
            msgText += `\n_Reply/Type .movie <number> to get details._` + WATERMARK;
            
            await sock.sendMessage(jid, { text: msgText }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Failed: ${err.message}` });
        }
    }
};
const express = require('express');
const youtubedl = require('youtube-dl-exec');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/download/:videoId', async (req, res) => {
    const url = `https://www.youtube.com/watch?v=${req.params.videoId}`;

    try {
        console.log(`Attempting to download video: ${url}`);
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            ]
        });

        const audioFormat = info.formats.find(format => format.acodec !== 'none' && format.vcodec === 'none');

        if (!audioFormat) {
            console.error('No audio format found');
            return res.status(404).send('No audio format found');
        }

        const title = info.title.replace(/[^\w\s]/gi, '');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `inline; filename="${title}.mp3"`);

        const audio = youtubedl.exec(url, {
            format: audioFormat.format_id,
            output: '-',
        }, { stdio: ['ignore', 'pipe', 'ignore'] });

        audio.stdout.pipe(res);

        audio.stdout.on('error', (err) => {
            console.error('Error in audio stream:', err);
            if (!res.headersSent) {
                res.status(500).send(`Error streaming audio: ${err.message}`);
            }
        });

        res.on('error', (err) => {
            console.error('Error in response stream:', err);
        });

    } catch (err) {
        console.error('Error in download route:', err);
        if (!res.headersSent) {
            res.status(500).send(`An error occurred: ${err.message}`);
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

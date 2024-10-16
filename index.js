const express = require('express');
const ytdl = require("@distube/ytdl-core");


const app = express();
const cors = require('cors');
app.use(cors());






app.get('/download/:videoId', async (req, res) => {
    var url = `https://www.youtube.com/watch?v=${req.params.videoId}`;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        
        // Set appropriate headers for audio streaming
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `inline; filename="${title}.mp3"`);

        // Stream the audio directly to the response
        const stream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            format: 'mp3'
        });

        stream.on('error', (err) => {
            console.error('Error in ytdl stream:', err);
            if (!res.headersSent) {
                res.status(500).send('Error streaming audio');
            }
        });

        stream.pipe(res);

        // Handle potential errors after headers are sent
        res.on('error', (err) => {
            console.error('Error in response stream:', err);
        });

    } catch (err) {
        console.error('Error in download route:', err);
        if (!res.headersSent) {
            res.status(500).send('An error occurred');
        }
    }
});

app.listen(3000 || process.env.PORT, () => console.log('Server running on port 3000'));
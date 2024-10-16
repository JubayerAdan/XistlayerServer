const express = require('express');
const ytdl = require("@distube/ytdl-core");
const cors = require('cors');

const app = express();
app.use(cors());

// Add this cookie string - you'll need to replace it with your own
const YOUTUBE_COOKIE = 'SID=g.a000oAhGG1NWgBa6_mdOyFOt9IPvY2zXIcuJdarxrnpDiHQ-nMpfOdyLQB_xgYmbPcnhPQ9pcgACgYKAZESARMSFQHGX2Mi8gHsk3RqDOdmMkbK9Hx61RoVAUF8yKoFmlpppsJ-TYqzyECI-VqA0076;HSID=AldQ4I6J2mZIRG2ag;SSID=AM1AaRFojsY3nw7sT;APISID=Z-qyuIpV17Gs_yJf/ACQL0REh_sf_s8Tx6;SAPISID=uectqJCl7u_leL5e/AYUtBnWvXNgiODU9O';

const headers = {
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Cookie': YOUTUBE_COOKIE
};

app.get('/download/:videoId', async (req, res) => {
    var url = `https://www.youtube.com/watch?v=${req.params.videoId}`;

    if (!url) {
        console.error('URL is missing');
        return res.status(400).send('URL is required');
    }

    try {
        console.log(`Attempting to download video: ${url}`);
        const info = await ytdl.getInfo(url, {
            requestOptions: { headers }
        });
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        
        // Set appropriate headers for audio streaming
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `inline; filename="${title}.mp3"`);

        // Stream the audio directly to the response
        const stream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            format: 'mp3',
            requestOptions: { headers }
        });

        stream.on('error', (err) => {
            console.error('Error in ytdl stream:', err);
            if (!res.headersSent) {
                res.status(500).send(`Error streaming audio: ${err.message}`);
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
            res.status(500).send(`An error occurred: ${err.message}`);
        }
    }
});

// Change the port to use environment variable first
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

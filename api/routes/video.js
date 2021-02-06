
const express = require('express');
const router = express.Router();
module.exports = router;
var ffmpeg = require('ffmpeg');

// This Get opens the video from the given path and slices 
// the video object into Image frames and returns them as an Array of Images
// This projects imports Video from the assets folder and extract video images to data folder
// for DEMO purpose only

router.get('/', async (req, res) => {

    res.send('Video processing Started....');
    try {
        var process = new ffmpeg('./assets/Creative.mkv');
        process.then(function (video) {
            // Callback mode
            video.fnExtractFrameToJPG('./data', { 
                frame_rate: 1, 
                file_name: 'my_frame_%t_%s'
            }, function (error, files) {
                if (!error)
                    console.log('Frames: ' + files);
            });
        }, function (err) {
            console.log('Error: ' + err);
        });
    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
    }


});



const express = require('express');
const router = express.Router();
module.exports = router;
var ffmpeg = require('ffmpeg');
var fs = require('fs');
const cors = require('../../middlewares/cors');
const { Store } = require('../../models/store');

// This Get opens the video from the given path and slices 
// the video object into Image frames and returns them as an Array of Images
// This projects imports Video from the assets folder and extract video images to data folder
// for DEMO purpose only

router.get('/', [cors], async (req, res) => {


    try {
        var process = new ffmpeg('./assets/Creative.mkv');
        process.then(function (video) {
            // Callback mode
            video.fnExtractFrameToJPG('./data', {
                frame_rate: 1,
                file_name: 'my_frame_%t_%s'
            }, async function (error, files) {
                if (!error)
                    console.log('Frames: ' + files);
                // after the Video extraction is finished
                // store to the database the following
                // * Timestamp 
                // * Start and End time [Optional] 


                var frame = fs.readFileSync(files[0]);
                var encode_frame = frame.toString('base64');
                console.log('Image IDEAS ==>', '\n', encode_frame)

                var frames = { 
                    frame: new Buffer.from(encode_frame, 'base64')
                };

                // save to mongo

                let dataStored = new Store({
                    start_time: Date.now(),
                    end_time: Date.now(),
                    frames: frames
                });

                dataStored = await dataStored.save();
                console.log('dataStored Results==>', dataStored)

                res.json({ dataStored });

                console.log('Buffer frame stored-->')
                // res.send('Video processed....' + image); // files
            });
        }, function (err) {
            console.log('Error: ' + err);
        });
    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
    }


});


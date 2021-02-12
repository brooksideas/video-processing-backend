
const express = require('express');
const router = express.Router();
module.exports = router;
var ffmpeg = require('ffmpeg');
var fs = require('fs');
const path = require('path');
var net = require('net');
const cors = require('../../middlewares/cors');
const { Store } = require('../../models/store');

// This Get opens the video from the given path and slices 
// the video object into Image frames and returns them as an Array of Images
// This projects imports Video from the assets folder and extract video images to data folder
// for DEMO purpose only

router.get('/', [cors], async (req, res) => {


    try {
        var process = new ffmpeg('./assets/Cartoon.mp4');//Cartoon.mp4  Creative.mkv
        var storeTimeStamp = Date.now().toString();
        var saveTimeStamp = Date.now();
        var pathStamp = "";
        process.then(function (video) {

            // Callback mode
            video.fnExtractFrameToJPG(`./data/${storeTimeStamp}`, {
                frame_rate: 1,
                file_name: 'my_frame_%t' //my_frame_%t_%s
            }, async function (error, files) {
                if (!error)

                    pathStamp = files[0].split('/')[3].split('_')[2]


                // after the Video extraction is finished
                // store to the database the following
                // * Timestamp 
                // * Start and End time [Optional] 
                // * Frame Count

                // save to mongo

                let dataStored = new Store({
                    start_time: Date.now(),
                    end_time: Date.now(),
                    timestamp: saveTimeStamp,
                    pathstamp: pathStamp
                });

                dataStored = await dataStored.save();
 

                res.json({ dataStored });



            });

        }, function (err) {
            console.log('Error: ' + err);
        })

    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
    }


});


router.get('/all', [cors], async (req, res) => {
    // Implement End point to make sure all the data frames are properly stored as Binary 
    var Frame = null;
    var framesArray = [];
    var specific_timestamp = 0;
    var specific_path = "";
    var total_length = 0;
    try {
        const frames = await Store.find({}).sort({ end_date: -1 });

        frames.map(async (frame) => {
            Frame = frame;
            specific_timestamp = frame.timestamp;
            specific_path = frame.pathstamp;
            total_length = frame.total_length;

            // Encode every frame in the Timestamped folder if the Number of total frame Array is not equal to frame.total_length

            //Files total length
            var file_path = path.join(__dirname + `../../../data/${specific_timestamp}`);
            fs.readdir(file_path, async (err, files) => {

                total_length = files.length;
                // Check if the Frames extracted have been stored as binary in the database 
                if (Frame.frames.length === 0) {
                    for (let second = 1; second <= total_length; second++) {

                        // set appropriate path to each frames to be Encoded
                        var frame_path = path.join(__dirname + `../../../data/${specific_timestamp}/my_frame_${specific_path}_${second}.jpg`);
                        var frame = fs.readFileSync(frame_path);
                        framesArray.push(frame);


                    }
                    // Update the specified timestamp to mongo

                    await Store.findOneAndUpdate({ timestamp: specific_timestamp }, {
                        frames: framesArray,
                        total_length: total_length
                    }, { new: true });

                }
            });

        });


        res.json({frames});
        res.end('All frames returned Successfully!');
    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
    }


});
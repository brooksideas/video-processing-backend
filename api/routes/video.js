
const express = require('express');
const router = express.Router();
module.exports = router;
var ffmpeg = require('ffmpeg');
var fs = require('fs');
const path = require('path');
const cors = require('../../middlewares/cors');
const { Store } = require('../../models/store');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fluentffmpeg = require('fluent-ffmpeg');
const videoStitch = require('video-stitch');

// This Get opens the video from the given path and slices 
// the video object into Image frames and returns them as an Array of Images
// This projects imports Video from the assets folder and extract video images to data folder
// for DEMO purpose only

router.get('/', [cors], async (req, res) => {


    try {
        var videoName = "Cartoon.mp4"; // name will be dynamically given from request in the future
        var process = new ffmpeg(`./assets/${videoName}`);//Cartoon.mp4  Creative.mkv
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
                // * Name
                // * Timestamp 
                // * Start and End time [Optional] 
                // * Frame Count

                // save to mongo

                let dataStored = new Store({
                    name: videoName,
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
                // Even if the Frames extracted have been stored as binary in the database
                // overwrite the binaries on multiple video edit

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


            });

        });


        res.json({ frames });
        console.log('All frames updated Successfully!');
    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
    }


});

// Cut the Video according to the request  
router.post('/cut', [cors], (req, res) => {

    try {
        fluentffmpeg.setFfmpegPath(ffmpegPath)
        
        // Name, Start and Duration are dynamic as per the request
        // Since you can overwrite any files below you can cut the video as many times as you like
        // to achieve this you need to Overwrite the Original file path on every edit instead of ..._edited 

        // section to cut initially 
        fluentffmpeg('./assets/Cartoon.mp4')
            .setStartTime('00:00:50')
            .setDuration('15')
            .output('./assets/Cartoon_cut.mp4')
            .on('end', function (err) {
                if (!err) {
                    console.log('Video Cutting Completed!')
                }
            })
            .on('error', function (err) {

                console.log('Video Cutting Failed!', err)

            }).run()


        // the Remaining Sections that are not pruned 
        // From the Original Start until the Cut Start Point
        // If the Cut selection starts from the Origin their is no Middle Section
        // thus this section is not required

        // if(req.startTime !== '00:00:00'){

        // }
        fluentffmpeg('./assets/Cartoon.mp4')
            .setStartTime('00:00:00')
            .setDuration('50')
            .output('./assets/Cartoon_remain_start.mp4')
            .on('end', function (err) {
                if (!err) {
                    console.log('Video Cutting Start Completed!')
                }
            })
            .on('error', function (err) {

                console.log('Video Cutting Failed!', err)

            }).run()

        // the Remaining Sections that are not pruned 
        // From the End of Cut Point until the End of the Video 
        fluentffmpeg('./assets/Cartoon.mp4')
            .setStartTime('00:01:05')
            .setDuration('1000000') // Give big number to ensure it goes to the end of the Video
            .output('./assets/Cartoon_remain_end.mp4')
            .on('end', function (err) {
                if (!err) {
                    console.log('Video Cutting End Completed!')
                }
            })
            .on('error', function (err) {

                console.log('Video Cutting Failed!', err)

            }).run()

        res.send('Video Successfully Cut!');
    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
    }
});

/* Using Video stitch Merge the Video Before the Cut Point [if it is there]
        and Video After the Cut Point
        If only one of the Clip is present return only that 
        Meaninng not a Middle cut rather a Start or End Cut */
router.post('/edit', [cors], async (req, res) => {
    var file_path_start = path.join(__dirname + `../../../assets/Cartoon_remain_start.mp4`);
    var file_path_end = path.join(__dirname + `../../../assets/Cartoon_remain_end.mp4`);
    let videoConcat = videoStitch.concat;
    try {
        await videoConcat({
            silent: false, // optional. if set to false, gives detailed output on console
            overwrite: true // optional. by default, if file already exists, ffmpeg will ask for overwriting in console and that pause the process. if set to true, it will force overwriting. if set to false it will prevent overwriting.
        })
            .clips([
                {
                    "fileName": `${file_path_start}`
                },
                {
                    "fileName": `${file_path_end}`
                }
            ])
            .output("./assets/Cartoon.mp4") //optional absolute file name for output file with ..._edit
            .concat()
            .then((outputFileName) => {
                console.log('videoConcat!')
                console.log('path to output file', outputFileName);
            });
        res.send('Video Successfully Edited!');
    } catch (error) {
        console.log(error)
    }

});


/*  Delete all the images with in the timestamped
 directory then extract the edited video and store the updated Video Frames in the directory */
router.post('/extract', [cors], async (req, res) => {

    // this should be dynamic per client side request
    var specific_timestamp = '1613209602442'; // req.body.timestamp
    var videoName = 'Cartoon.mp4'; // req.body.name

    try {

        // Delete all video frames in the directory 

        const directory = path.join(__dirname + `../../../data/${specific_timestamp}`);
        console.log('New Edited Video Frames Successfully Extracted!****', directory);
        fs.readdir(directory, async (err, files) => {

            if (err) throw err;

            files.map(file => {

                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;

                });
            })
        });

        // Process the newly edited Video frames

        var process = new ffmpeg(`./assets/${videoName}`);
        process.then(function (video) {

            // Callback mode
            video.fnExtractFrameToJPG(`./data/${specific_timestamp}`, {
                frame_rate: 1,
                file_name: 'my_frame_%t' //my_frame_%t_%s
            }, async function (error, files) {
                if (!error)
                    // Update the specified pathstamp to mongo since new extraction stamp
                    var pathStamp = files[0].split('/')[3].split('_')[2]

                await Store.findOneAndUpdate({ timestamp: specific_timestamp }, {

                    pathstamp: pathStamp
                }, { new: true });
                console.log('Files Extraction finished', files)

            });

        }, function (err) {
            console.log('Error: ' + err);
        })

        console.log('New Edited Video Frames Successfully Extracted!');
        res.send('New Edited Video Frames Successfully Extracted!');
    } catch (error) {
        console.log(error)
    }

});
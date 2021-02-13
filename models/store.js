const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    pathstamp: { type: String, required: true },
    timestamp: { type: Number, required: true, default: 0 },
    total_length: { type: Number, required: true, default: 0 },
    frames: { type: Array, required: false, default: [] }
});



const Store = mongoose.model('Store', storeSchema);


exports.Store = Store; 
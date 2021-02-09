const mongoose = require('mongoose');
 
const storeSchema = new mongoose.Schema({
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    frames: { type: Object, required: true ,default: null },
});



const Store = mongoose.model('Store', storeSchema);
 

exports.Store = Store; 
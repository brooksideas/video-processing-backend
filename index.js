const express = require('express')
const app = express();
const port = 7000;
const video = require('./api/routes/video');
const mongoose = require('mongoose');

app.get('/', (req, res) => {
  res.send('Video Processor Started!')
});
// Routing for Main Methods
app.use('/api/video', video);

// DB connection
mongoose.connect('mongodb://localhost/video-store')
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.log('Could not connect to MongoDB', error))


app.listen(port, () => {
  console.log(`Video Processor Started at port ${port}!`)
});
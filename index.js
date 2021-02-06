const express = require('express')
const app = express();
const port = 7000;
const video = require('./api/routes/video');

app.get('/', (req, res) => {
  res.send('Video Processor Started!')
});
// Routing for Main Methods
app.use('/api/video', video);

app.listen(port, () => {
  console.log(`Video Processor Started at port ${port}!`)
});
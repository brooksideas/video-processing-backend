const express = require('express')
const app = express();
const port = 7000;

app.get('/', (req, res) => {
  res.send('Video Processor Started!')
});

app.listen(port, () => {
  console.log(`Video Processor Started at port ${port}!`)
});
const io = require('socket.io-client');
const fs = require('fs');
const ss = require('socket.io-stream');

const videoPath = '/Users/fuchenxu/Downloads/Charlie Puth - Kiss Me.mp4';
const videoSize = fs.statSync(videoPath).size;

// http://192.168.86.33:6800/

const socket = io.connect('https://manager.zhitiaox.com', {
  query: {
    userId: 'streamer',
    videoSize
  },
});

socket.on('connect', () => {
  console.log('Socket connected');
});

socket.on('connect_error', (err) => {
  console.log(`connect_error due to ${err.message}`);
});

socket.on('request-vid', ([start, end]) => {
  console.log('request-vid');
  const stream = ss.createStream();
  fs.createReadStream(videoPath, { start, end }).pipe(stream);
  ss(socket).emit('video-data', stream);
});

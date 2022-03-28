const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const ss = require('socket.io-stream');
const cors = require('cors');

const app = express();
const io = socketio({
  cors: {
    origin: '*',
  }
});

app.set('port', 6800);

const server = http.createServer(app);

app.use(cors());

app.use(express.static(path.join(__dirname + '/build')));

let fileStreamerSocket = null;
let videoSize = 0;

const userResMap = new Map();

app.get("/video", function (req, res) {
  console.log('get /video');
  const { range } = req.headers;
  const { userId } = req.query;
  if (!range) {
      console.log('no range');
      res.status(400).send("Requires Range header");
      return;
  }
  userResMap.set(userId, res);
  const start = Number(range.replace(/\D/g, ""));
  const CHUNK_SIZE = 10 ** 6;
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
  };
  res.writeHead(206, headers);
  if (!fileStreamerSocket) {
    res.status(400).send("Streamer offline.");
    return;
  }
  fileStreamerSocket.emit('request-vid', [start, end]);
  console.log('go request-vid');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

io.attach(server);

io.on('connection', socket => {
  try {
    // Remove previous listeners to prevent duplicate
    socket.removeAllListeners();
    // Handle connection
    console.log(`New connection: ${socket.id}`);
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.id}`);
    });
    // handle player events
    playerController(socket);
    streamController(socket);
  } catch (err) {
    console.log('Socket error: ', err);
  }
});

function playerController(socket) {
  socket.on('play', () => {
    socket.broadcast.emit('play');
    console.log('play');
  });
  socket.on('pause', () => {
    socket.broadcast.emit('pause');
    console.log('pause');
  });
  socket.on('seeked', (playtime) => {
    socket.broadcast.emit('seeked', playtime);
    console.log('seeked ', playtime);
  });
}

function streamController(socket) {
  const { userId } = socket.handshake.query;
  if (userId !== 'streamer') return;
  console.log('Streamer connected');
  fileStreamerSocket = socket;
  videoSize = socket.handshake.query.videoSize;
  console.log('videoSize: ', videoSize);
  ss(socket).on('video-data', function(stream, data) {
    console.log('on video-data');
    for (let [, res] of userResMap.entries()) {
      stream.pipe(res);
    }
  });
}

server.listen(6800, () => {
  console.log('Server started on port 6800');
});